from datetime import datetime
from typing import Dict, Optional
import os
import requests

from google.adk.tools.mcp_tool import McpToolset, StdioConnectionParams, StreamableHTTPConnectionParams
from google.adk.tools import ToolContext
from mcp.client.stdio import StdioServerParameters


def add_conversation_note(
    tool_context: ToolContext,
    note: str,
    source: str = "Unknown"
) -> Dict[str, str]:
    """
    Add a note about the current conversation for future reference.
    Writes to individual files with timestamp in agent/notes/ directory.

    Use this to track:
    - Key recruiter questions or concerns
    - Specific job requirements discussed
    - Follow-up items or next steps
    - Important discussion points

    Args:
        note: A concise note about the conversation
        source: The name of the person (e.g., recruiter) or source of the note

    Returns:
        Dict indicating success and the note added
    """
    try:
        # Ensure notes directory exists
        notes_dir = os.path.join(os.environ.get("NOTES_DIR", os.path.dirname(os.path.abspath(__file__))), "notes")
        os.makedirs(notes_dir, exist_ok=True)

        # Generate timestamp and filename
        timestamp = datetime.now()
        date_str = timestamp.strftime("%Y-%m-%d")
        time_str = timestamp.strftime("%H-%M-%S")
        filename = f"{date_str}_{time_str}_note.md"
        filepath = os.path.join(notes_dir, filename)

        # Create note content with timestamp
        note_content = f"# Conversation Note\n\n## {timestamp.strftime('%Y-%m-%d %H:%M:%S')}\n\n{note}\n \n*Source: {source}*"

        # Write to file
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(note_content)

        # Also add to context list for the agent
        context_list = tool_context.state.get("conversation_context", [])
        if context_list is None:
            context_list = []

        timestamped_note = f"[{timestamp.strftime('%Y-%m-%d %H:%M:%S')}] {note}"
        context_list.append(timestamped_note)

        tool_context.state["conversation_context"] = context_list

        return {
            "status": "success",
            "message": f"Note added: {note}",
            "filepath": filepath
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error adding note: {str(e)}"
        }


def share_profile(email: str, notes: Optional[str]="Here is the profile you have requested for.") -> Dict[str, str]:
    """
    Share the user's profile with a recruiter via email, including any notes.
    
    args:
        email: The recruiter's email address to share the profile with
        notes: Any additional notes or context to include in the email (Optional, but do prompt the user to provide if not given)
    
    returns:
        Dict indicating success or error message
    """
    try:
        user_message = f"send my profile to {email}, include a note '{notes}'"
        response = requests.post(
            f'https://n8n.krishb.in/webhook/{os.environ.get("EMAIL_WF_WEBHOOK_ID", "default_webhook_id")}',
            headers={
                'Accept': '*/*',
                'User-Agent': 'Thunder Client (https://www.thunderclient.com)',
                'API_KEY': os.environ.get("EMAIL_WF_API_KEY", "default_api_key"),
                'Content-Type': 'application/json'
            },
            json={'user_message': user_message}
        )
        response.raise_for_status()
        return {"status": "success", "message": "Profile shared successfully"}
    except Exception as e:
        return {"status": "error", "message": f"Error sharing profile: {str(e)}"}


# Create memory MCP toolset for knowledge graph memory
memory_toolset = McpToolset(
    connection_params=StdioConnectionParams(
       timeout=120,
        server_params=StdioServerParameters(
            command='npx',
            args=["-y", "@modelcontextprotocol/server-memory"],
        ),
    ),
)


filesystem_toolset = McpToolset(
    connection_params=StdioConnectionParams(
       timeout=120,
        server_params=StdioServerParameters(
            command='npx',
            args=["-y", "@modelcontextprotocol/server-filesystem", "/home/bharath/workspace/profile_agent"],
        ),
    ),
)