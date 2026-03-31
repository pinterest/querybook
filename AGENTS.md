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

Start the full stack (web server, worker, scheduler, and all dependencies) with Docker Compose:

```bash
make
```

This brings up everything and serves the app at http://localhost:10001. This is the primary command for local development.

To restart individual services without bouncing the full stack:

```bash
make web        # web server only
make worker     # celery worker
make scheduler  # celery beat
```

## Making Commits

When preparing a PR, run the relevant checks. CI runs all of the following via GitHub Actions (`.github/workflows/`), but must be manually triggered by a maintainer.

Always run tests via `make test`, which builds a `querybook-test` Docker image and runs checks inside it. This ensures an isolated, reproducible environment. Do not run test commands (pytest, yarn, webpack) directly on the host.

`make test` runs both backend and frontend checks:
- **Backend** (anything under `querybook/server/`): pytest
- **Frontend** (anything under `querybook/webapp/`): TypeScript type checking, Jest unit tests, ESLint, and production build verification

**Formatting (all changes) — common CI failure:**

`make test` does **not** run Prettier. CI runs Prettier separately via `pre-commit`, so formatting issues are a frequent cause of CI failures. After running `make test`, also run Prettier on changed files before pushing:

```bash
npx prettier --write <files>
```

For a full formatting pass (Black for Python, Prettier for JS/TS, flake8):

```bash
pre-commit run --all-files
```

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
