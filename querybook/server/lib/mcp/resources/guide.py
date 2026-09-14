from fastmcp import FastMCP
from fastmcp.server.auth import AccessToken
from fastmcp.server.dependencies import CurrentAccessToken

from lib.mcp.utils import RESOURCE_ANNOTATIONS

RESOURCE_GUIDE = """\
# Querybook MCP Resource Guide

This server exposes resource templates that provide read-only access to
Querybook data. Use these URIs to fetch structured JSON for any entity
by substituting the appropriate ID.

## Resource Templates

### DataDocs
| URI | Description |
|-----|-------------|
| `querybook://datadoc/{datadoc_id}` | DataDoc with its cells and editors |
| `querybook://datadoc-cell/{cell_id}` | Single DataDoc cell content and metadata |
| `querybook://datadoc-cell/{cell_id}/executions{?limit,offset}` | Query execution history for a cell (default limit=20, offset=0) |

### Query Execution
| URI | Description |
|-----|-------------|
| `querybook://query-execution/{query_execution_id}` | Query execution status and statement details |
| `querybook://statement-execution/{statement_execution_id}/results{?limit}` | Actual result data rows for a statement execution (limit defaults to server-configured size) |

### Comments
| URI | Description |
|-----|-------------|
| `querybook://comment/{comment_id}` | Comment with thread replies and reactions |
| `querybook://datadoc-cell/{cell_id}/comments{?include_threads}` | All comments for a cell (include_threads defaults to true) |

### Schedules
| URI | Description |
|-----|-------------|
| `querybook://schedule/{schedule_id}` | Schedule configuration and recent run history |
| `querybook://schedule/{schedule_id}/runs{?limit,offset,hide_successful}` | Schedule run history with filtering and pagination (default limit=20, offset=0, hide_successful=false) |

### Lists
| URI | Description |
|-----|-------------|
| `querybook://list/{list_id}` | List with its items and editors |

### Environments & Engines
| URI | Description |
|-----|-------------|
| `querybook://environment/{environment_id}` | Environment details |
| `querybook://query-engine/{engine_id}` | Query engine configuration |

### Users
| URI | Description |
|-----|-------------|
| `querybook://user/{user_id}` | User profile (use `me` for current user) |

## Query Parameters

Some resources accept optional query parameters using RFC 6570 syntax:

- **`limit`** / **`offset`** — Pagination (e.g., `querybook://datadoc-cell/42/executions?limit=10&offset=20`)
- **`include_threads`** — Boolean to include/exclude thread replies on comments
- **`hide_successful`** — Boolean to filter schedule runs to only failures

## Tips

- Many tools return a `resource_uri` field in their response — use it to
  fetch the full resource representation.
- Use `list_environments` and `list_query_engines` tools to discover valid
  environment and engine IDs.
- Use `search_datadocs` or `list_datadocs` tools to find DataDoc IDs.
- The `querybook://user/me` shorthand resolves to your authenticated user.
"""


def register(mcp: FastMCP) -> None:
    """Register the resource guide on the given MCP server."""

    @mcp.resource(
        uri="querybook://resource-guide",
        name="Resource Guide",
        description=(
            "Markdown guide listing all available Querybook resource templates, "
            "their URI patterns, query parameters, and usage tips"
        ),
        mime_type="text/markdown",
        annotations=RESOURCE_ANNOTATIONS,
    )
    def get_resource_guide(
        token: AccessToken = CurrentAccessToken(),
    ) -> str:
        """Returns a Markdown document describing all available resource templates."""
        return RESOURCE_GUIDE
