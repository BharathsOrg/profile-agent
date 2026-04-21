"""Shared State feature."""

from __future__ import annotations

import json
import time
from typing import Dict, Optional

from ag_ui_adk import ADKAgent, add_adk_fastapi_endpoint
from ag_ui_adk.endpoint import create_adk_app
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import litellm
from google.adk.agents import LlmAgent, Agent
from google.adk.agents.callback_context import CallbackContext
from google.adk.agents.remote_a2a_agent import RemoteA2aAgent
from google.adk.models.llm_request import LlmRequest
from google.adk.models.llm_response import LlmResponse
from google.adk.models.lite_llm import LiteLlm
from google.adk.tools import BaseTool, ToolContext
from google.adk.tools.agent_tool import AgentTool
from google.genai import types
from pydantic import BaseModel, Field

from langfuse import get_client
from openinference.instrumentation.google_adk import GoogleADKInstrumentor
from common.custom_agent import CustomAgent
from common.profile import PROFILE_CONTEXT
from common.tools import add_conversation_note, memory_toolset, share_profile
from google.adk.planners import BuiltInPlanner
# from common.tools import filesystem_toolset
from typing import Any

load_dotenv()


class ProfileState(BaseModel):
    """State for Bharath's personal assistant agent."""

    conversation_context: list[str] = Field(
        default_factory=list,
        description="Notes from conversations with recruiters",
    )
    last_thinking_content: Optional[str] = Field(
        default=None,
        description="Thinking content from the last agent response",
    )
    final_response: Optional[str] = Field(
        default=None,
        description="Final response text from the last agent response",
    )
    last_response_id: Optional[str] = Field(
        default=None,
        description="Message ID of the last response (for correlation)",
    )


def on_before_agent(callback_context: CallbackContext):
    """Initialize conversation context and thinking fields if they don't exist."""

    if "conversation_context" not in callback_context.state:
        callback_context.state["conversation_context"] = []

    # Initialize thinking fields
    if "last_thinking_content" not in callback_context.state:
        callback_context.state["last_thinking_content"] = None

    if "final_response" not in callback_context.state:
        callback_context.state["final_response"] = None

    if "last_response_id" not in callback_context.state:
        callback_context.state["last_response_id"] = None

    return None


# --- Define the Callback Function ---
#  modifying the agent's system prompt to include Bharath's complete profile
def before_model_modifier(
    callback_context: CallbackContext, llm_request: LlmRequest
) -> Optional[LlmResponse]:
    """Inspects/modifies the LLM request or skips the call."""
    agent_name = callback_context.agent_name
    if agent_name == "BharathAssistant":
        # Build conversation notes
        conversation_notes = "No conversation notes yet"
        if (
            "conversation_context" in callback_context.state
            and callback_context.state["conversation_context"] is not None
        ):
            try:
                conversation_notes = json.dumps(callback_context.state["conversation_context"], indent=2)
            except Exception as e:
                conversation_notes = f"Error serializing notes: {str(e)}"

        # Build comprehensive profile context
        profile_context = PROFILE_CONTEXT.format(conversation_notes=conversation_notes)

        # Add profile context to system instruction
        original_instruction = llm_request.config.system_instruction or types.Content(
            role="system", parts=[]
        )

        # Ensure system_instruction is Content and parts list exists
        if not isinstance(original_instruction, types.Content):
            original_instruction = types.Content(
                role="system", parts=[types.Part(text=str(original_instruction))]
            )
        if not original_instruction.parts:
            original_instruction.parts = [types.Part(text="")]

        # Modify the text of the first part
        if original_instruction.parts and len(original_instruction.parts) > 0:
            modified_text = profile_context + "\n\n" + (original_instruction.parts[0].text or "")
            # modified_text = modified_text + "\n\n" + f"Token Usage: {callback_context.state.get('total_token_count', 0)} tokens used in this session so far.\
            #     Max Tokens for this model: 262000 tokens. Be concise in your responses to stay within limits."
            original_instruction.parts[0].text = modified_text

        # TODO: Check model type to set system_instruction appropriately

        # For litellm models, we need to set it as string
        llm_request.config.system_instruction = original_instruction.parts[0].text
        # for Gemini models, we need to set it as Content
        # llm_request.config.system_instruction = original_instruction

    # Store start time for metrics
    callback_context.state["_last_request_start"] = time.time()

    return None

FINAL_RESPONSE = []

# --- Define the Callback Function ---
def simple_after_model_modifier(
    callback_context: CallbackContext, llm_response: LlmResponse
) -> Optional[LlmResponse]:
    """Stop the consecutive tool calling of the agent"""
    agent_name = callback_context.agent_name
    # --- Inspection ---
    if agent_name == "BharathAssistant":
        if llm_response.content and llm_response.content.parts:
            # Assuming simple text response for this example
            # print("LLM Response Text in after model modifier:", llm_response.content)
            if llm_response.finish_reason and llm_response.finish_reason.name == "STOP":
                callback_context._invocation_context.end_invocation = True
                
                # Calculate metrics
                start_time = callback_context.state.get("_last_request_start", 0)
                end_time = time.time()
                duration = end_time - start_time
                
                # if "</think>" in llm_response.content.parts[-1].text:
                #     thinking = llm_response.content.parts[-1].text.split("</think>")[0]
                #     text = llm_response.content.parts[-1].text.split("</think>")[-1]
                # else:
                #     text = llm_response.content.parts[-1].text
                # print("Final extracted text:", text)
                # llm_response.content.parts[-1].text = text
                # callback_context.state['last_thinking_content'] = thinking if 'thinking' in locals() else None
                # callback_context.state['final_response'] = text

                usage = llm_response.usage_metadata
                prompt_tokens = usage.prompt_token_count if usage else 0
                response_tokens = usage.candidates_token_count if usage else 0
                total_turn_tokens = usage.total_token_count if usage else 0
                
                tps = 0.0
                if duration > 0 and response_tokens > 0:
                    tps = response_tokens / duration

                # Update state
                total_token_count = callback_context.state.get('total_token_count', 0)
                callback_context.state['total_token_count'] = total_token_count + total_turn_tokens
                callback_context.state['last_context_tokens'] = prompt_tokens
                callback_context.state['last_response_tokens'] = response_tokens
                callback_context.state['tokens_per_second'] = round(tps, 2)

                # final_response = "".join(FINAL_RESPONSE)
                # FINAL_RESPONSE = []
                # llm_response.content.parts[0].text = final_response
            else:
                llm_response.content.parts[0].text = ""  # Clear intermediate responses
                return None

            # if (
            #     llm_response.content.role == "model"
            #     and llm_response.content.parts[0].text
            # ):
            #     callback_context._invocation_context.end_invocation = True

        elif llm_response.error_message:
            return None
        else:
            return None  # Nothing to modify
    return None

# from google.adk.agents.remote_a2a_agent import RemoteA2aAgent
# from google.adk.agents.remote_a2a_agent import AGENT_CARD_WELL_KNOWN_PATH

# profile_agent = RemoteA2aAgent(
#     name="profile_agent",
#     description="Profile Agent AI assistant for answering questions about Bharath's professional background.",
#     agent_card=(
#         f"http://localhost:8003/{AGENT_CARD_WELL_KNOWN_PATH}"
#     ),
# )
# from google.adk.tools import google_search, agent_tool


import os

# Configure model based on USE_LITELLM setting
use_litellm = os.getenv("USE_LITELLM", "false").lower() == "true"
model_name = os.getenv("MODEL_NAME", "gemini-2.5-pro")

if use_litellm:
    # Use LiteLLM for multi-model support (google_search won't work)
    if model_name.startswith("gemini") and not model_name.startswith("gemini/"):
        litellm_model = f"gemini/{model_name}"
    else:
        litellm_model = model_name
    model = LiteLlm(model=litellm_model)
    print(f"Using LiteLLM with model: {litellm_model}")
else:
    # Use native Gemini model (required for google_search tool)
    model = model_name
    print(f"Using native Gemini model: {model_name}")

def simple_before_tool_modifier(tool:BaseTool, args: Dict[str, Any], tool_context: ToolContext) -> Optional[Dict]:
    """Example before tool callback that could modify the tool arguments."""
    # For demonstration, we will just pass through the original arguments without modification.
    # You can add custom logic here to inspect or modify the tool arguments if needed.
    return None  # Return None to indicate no modification

def simple_after_tool_modifier(tool:BaseTool, args: Dict[str, Any], tool_context: ToolContext, tool_response: Dict) -> Optional[Dict]:
    """Example after tool callback that could modify the tool response."""
    # For demonstration, we will just pass through the original tool response without modification.
    # You can add custom logic here to inspect or modify the tool response if needed.

    return None  # Return None to indicate no modification

# sdlc_agent = RemoteA2aAgent(
#     name="SDLCAgent",
#     description="An agent that can generate code for a complete backend API service based on software requirements.",
#     agent_card="http://localhost:8088/.well-known/agent-card.json"
# )


profile_agent = CustomAgent(
    name="BharathAssistant",
    # model="gemini-2.5-flash",
    # model=model,
    description="Bharath's Personal Assistant Agent",
    instruction="""You are Bharath's Personal Assistant.

Your role:
- Answer questions about Bharath's professional background, experience, and skills
- Advocate on his behalf to recruiters and hiring managers
- Be professional, accurate, and conversational
- Highlight relevant experience based on context
- Provide specific details (dates, company names, technologies, achievements)

When asked about something not in the profile, politely indicate it's not available.

Use the add_conversation_note tool to track important points from discussions with recruiters, such as:
- Key questions or concerns raised
- Specific job requirements discussed
- Follow-up items or next steps
- Areas of particular interest

Keep your responses short and professional, likve a conversation. With in three sentences maximum.
""",
    tools=[
        add_conversation_note,
        memory_toolset,
        share_profile,
    ],
    # sub_agents=[
    #     sdlc_agent
    # ],
    before_agent_callback=on_before_agent,
    before_model_callback=before_model_modifier,
    # after_model_callback=simple_after_model_modifier,
    before_tool_callback=simple_before_tool_modifier,
    after_tool_callback=simple_after_tool_modifier,
    planner=BuiltInPlanner(
        thinking_config=types.ThinkingConfig(
            include_thoughts=False,  # capture intermediate reasoning
            thinking_budget=0        # tokens allocated for planning
        )
    )
)

# Create ADK middleware agent instance
adk_profile_agent = ADKAgent(
    adk_agent=profile_agent,
    user_id="demo_user",
    session_timeout_seconds=3600, # 1 hour session timeout
    use_in_memory_services=True,
    tool_timeout_seconds=600, # 10 minutes tool execution timeout
    max_concurrent_executions=20, # Limit concurrent executions to prevent overload
)

# Create FastAPI app
# app = FastAPI(title="Profile Agent API")

# Create via ag_ui_adk endpoint utility to ensure proper middleware setup and SSE support
app = create_adk_app(adk_profile_agent, path="/")  # Mount the ADK endpoint at root

# --- Exception Handlers ---
@app.exception_handler(litellm.exceptions.ServiceUnavailableError)
async def litellm_service_unavailable_handler(request: Request, exc: litellm.exceptions.ServiceUnavailableError):
    """Handle LLM service unavailable errors."""
    return JSONResponse(
        status_code=503,
        content={
            "error": "LLM Service Unavailable",
            "message": "The AI model service is currently unavailable. Please try again in a few moments.",
            "details": "The backend LLM server (vLLM) may be down or restarting.",
            "retry": True
        }
    )


@app.exception_handler(litellm.exceptions.APIConnectionError)
async def litellm_connection_error_handler(request: Request, exc: litellm.exceptions.APIConnectionError):
    """Handle LLM connection errors."""
    return JSONResponse(
        status_code=503,
        content={
            "error": "LLM Connection Error",
            "message": "Cannot connect to the AI model service. Please try again later.",
            "details": str(exc),
            "retry": True
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle any unhandled exceptions gracefully."""
    error_type = type(exc).__name__
    # Check if it's a LiteLLM-related error
    if "litellm" in str(type(exc).__module__).lower() or "ServiceUnavailable" in error_type:
        return JSONResponse(
            status_code=503,
            content={
                "error": "AI Service Error",
                "message": "The AI service encountered an error. Please try again.",
                "details": str(exc)[:200],  # Truncate for safety
                "retry": True
            }
        )
    # Re-raise other exceptions
    raise exc


# --- Health Check Endpoint ---
@app.get("/health")
async def health_check():
    """Check if the agent and LLM service are healthy."""
    health_status = {
        "agent": "ok"
    }
    return JSONResponse(content=health_status)
    
#     # Quick LLM connectivity check
#     try:
#         if use_litellm:
#             # Try a minimal completion to check connectivity
#             response = await litellm.acompletion(
#                 model=litellm_model if 'litellm_model' in dir() else model_name,
#                 messages=[{"role": "user", "content": "hi"}],
#                 max_tokens=1,
#                 timeout=5
#             )
#             health_status["llm"] = "ok"
#         else:
#             health_status["llm"] = "native_gemini"
#     except Exception as e:
#         health_status["llm"] = f"error: {str(e)[:100]}"
        
#     return health_status


# Disabled because using create_adk_app utility which already sets up the endpoint with proper middleware and SSE support
# Add the ADK endpoint
# add_adk_fastapi_endpoint(app, adk_profile_agent, path="/")


try:
    # Initialize Langfuse
    langfuse = get_client()

    # Verify connection
    if langfuse.auth_check():
        print("Langfuse client is authenticated and ready!")
    else:
        print("Authentication failed. Please check your credentials and host.")

    # Instrument with Google ADK
    GoogleADKInstrumentor().instrument()
except Exception as e:
    print(f"Error initializing Langfuse or Google ADK instrumentation: {str(e)}")

# make sure to start opik
# cd /home/bharath/workspace/opik
# ./opik.sh
# http://localhost:5173

from opik.integrations.adk import OpikTracer, track_adk_agent_recursive

# Configure Opik tracer
opik_tracer = OpikTracer(
    name="profile_agent_tracing",
    tags=["ProfileAgent", "agent", "google-adk"],
    metadata={
        "environment": "development",
        "model": os.environ.get("MODEL_NAME", "gemini-2.5-pro"),
        "framework": "google-adk",
        "example": "basic"
    },
    project_name="PrfileAgentTracing"
)
# Instrument the agent with a single function call - this is the recommended approach
track_adk_agent_recursive(profile_agent, opik_tracer)


if __name__ == "__main__":
    import os

    import uvicorn

    if not os.getenv("GOOGLE_API_KEY"):
        print("⚠️  Warning: GOOGLE_API_KEY environment variable not set!")
        print("   Set it with: export GOOGLE_API_KEY='your-key-here'")
        print("   Get a key from: https://makersuite.google.com/app/apikey")
        print()

    port = int(os.getenv("PYTHON_PORT", os.getenv("PORT", 8001)))
    uvicorn.run(app, host="0.0.0.0", port=port)
