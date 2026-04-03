from google.adk.agents import LlmAgent, Agent
from google.adk.models.lite_llm import LiteLlm
from google.adk.agents.base_agent import BaseAgent
from typing import AsyncGenerator
from google.adk.agents.invocation_context import InvocationContext
from google.adk.events import Event



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



class CustomAgent(LlmAgent):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs, model=model)

    # async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
    #     print("*************************** Inside _run_async_impl ***************************")
    #     pass