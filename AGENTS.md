# Querybook

Querybook is Pinterest's open-source Big Data IDE for discovering, creating, and sharing data analyses. It combines a rich-text editor, SQL query engine, charting, scheduling, and table documentation in a single web app.

## Tech Stack

- **Backend:** Python 3.10, Flask, SQLAlchemy (MySQL), Celery (Redis broker), Elasticsearch/OpenSearch, gevent + Flask-SocketIO (WebSockets), uWSGI (production)
- **Frontend:** React 17, TypeScript, Redux, Webpack 5, CodeMirror (SQL editor), Draft.js (rich text), Chart.js/D3/ReactFlow

## Directory Layout

- `querybook/server/` — Flask backend
  - `app/` — app setup
  - `datasources/` — REST API endpoints
  - `logic/` — business logic
  - `models/` — SQLAlchemy models
  - `tasks/` — Celery tasks
  - `lib/` — utilities, executors, metastores
  - `env.py` — `QuerybookSettings` configuration
- `querybook/webapp/` — React/TypeScript frontend
  - `components/` — React components
  - `hooks/` — custom React hooks
  - `redux/` — Redux store, actions, reducers
  - `lib/` — frontend utilities
  - `ui/` — reusable UI primitives
  - `resource/` — API client layer
- `querybook/config/` — YAML config files
- `plugins/` — plugin stubs (extension point for custom behavior)
- `requirements/` — pip requirements (`base.txt`, `prod.txt`, `engine/*.txt`, `auth/*.txt`)
- `containers/` — Docker Compose files (dev, prod, test)
- `docs_website/` — Docusaurus documentation site
- `helm/` / `k8s/` — Kubernetes deployment manifests

## Plugin System

Querybook is extended via plugins without forking. The env var `QUERYBOOK_PLUGIN` (default `./plugins`) points to a directory where plugin modules are discovered by `lib.utils.import_helper.import_module_with_default()`.

Each plugin module exports a well-known variable (e.g. `ALL_PLUGIN_EXECUTORS`) that the server merges with built-in defaults.

Key plugin types: `executor_plugin`, `metastore_plugin`, `auth_plugin`, `api_plugin`, `exporter_plugin`, `result_store_plugin`, `notifier_plugin`, `event_logger_plugin`, `stats_logger_plugin`, `job_plugin`, `tasks_plugin`, `dag_exporter_plugin`, `ai_assistant_plugin`, `vector_store_plugin`, `webpage_plugin`, `monkey_patch_plugin`, `query_validation_plugin`, `query_transpilation_plugin`, `engine_status_checker_plugin`, `table_uploader_plugin`.

## Configuration

Priority: **env vars > `querybook_config.yaml` > `querybook_default_config.yaml`**.

Key settings live in `querybook/server/env.py` (`QuerybookSettings`).

## Running Locally

```bash
make            # docker-compose up (full stack) → http://localhost:10001
make web        # web server only
make worker     # celery worker
make scheduler  # celery beat
```

## Making Commits

When preparing a PR, run the relevant checks:

**Backend changes** (anything under `querybook/server/`):
- `make test` — run backend tests
- Pre-commit hooks handle linting (configured in `.pre-commit-config.yaml`)

**Frontend changes** (anything under `querybook/webapp/`):
- `pnpm test` or `yarn test` — run Jest tests
- `pnpm run lint` or `yarn lint` — ESLint with auto-fix
- `pnpm run tsc-check` or `yarn tsc-check` — TypeScript type checking

## Pinterest Internal Deployment

Pinterest deploys Querybook internally via a separate repo (`datahub-pinterest`) that uses this repo's Docker image as a base and layers Pinterest-specific plugins on top. Changes to core Querybook go here; Pinterest-specific features belong in that plugin repo. Do not add Pinterest-internal details to this file.

## Maintaining This File

**Include:**
- Repo purpose, tech stack, and high-level architecture
- Directory layout (key paths only)
- How to run, test, and lint locally
- Commit and PR workflow expectations
- Plugin system overview and extension points

**Do not include:**
- Detailed API docs or function-level documentation
- Inline code examples longer than 5 lines
- Deployment runbooks or operational procedures (keep in README or docs/)
- Credentials, secrets, or internal URLs
- Information that changes frequently (version numbers, dependency lists)
- Content already covered in README.md
- Content that can be easily derived by AI agents (e.g. reading file trees, package.json)
- References to internal/proprietary repos — this is an open-source project
