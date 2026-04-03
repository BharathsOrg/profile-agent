from google.adk.tools.mcp_tool import McpToolset, StdioConnectionParams, StreamableHTTPConnectionParams
from mcp.client.stdio import StdioServerParameters


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