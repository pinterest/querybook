from fastmcp import FastMCP

from env import QuerybookSettings
from lib.mcp.auth import QuerybookTokenVerifier
from lib.mcp.middleware import MCPEventLoggingMiddleware, wrap_mcp_resources
from lib.mcp.resources import (
    comments as comments_resources,
    datadocs as datadocs_resources,
    environments as environments_resources,
    guide as guide_resources,
    lists as lists_resources,
    query_engines as query_engines_resources,
    query_executions as query_executions_resources,
    schedules as schedules_resources,
    statement_executions as statement_executions_resources,
    users as users_resources,
)
from lib.mcp.tools import (
    comments,
    datadocs,
    environments,
    lists,
    query_engines,
    query_executions,
    schedules,
    users,
)

# Querybook MCP server
mcp = FastMCP("Querybook MCP", auth=QuerybookTokenVerifier())

# Add event logging middleware for tools (must be registered before tools)
mcp.add_middleware(MCPEventLoggingMiddleware())

# Wrap resource decorator to add logging (FastMCP middleware doesn't support resource hooks)
wrap_mcp_resources(mcp)

comments.register(mcp)
datadocs.register(mcp)
environments.register(mcp)
lists.register(mcp)
query_engines.register(mcp)
query_executions.register(mcp)
schedules.register(mcp)
users.register(mcp)

# Register resources
guide_resources.register(mcp)
comments_resources.register(mcp)
datadocs_resources.register(mcp)
environments_resources.register(mcp)
lists_resources.register(mcp)
query_engines_resources.register(mcp)
query_executions_resources.register(mcp)
schedules_resources.register(mcp)
statement_executions_resources.register(mcp)
users_resources.register(mcp)

if __name__ == "__main__":
    mcp.run(
        transport="http",
        host="0.0.0.0",
        port=QuerybookSettings.MCP_PORT,
        # Stateless mode used to enable horizontally-scaled deployments.
        stateless_http=True,
    )
