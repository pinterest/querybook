import os

PROJECT_ROOT_PATH = os.path.join(os.path.dirname(__file__), "../../../")
BUILD_PATH = "/build"
STATIC_PATH = os.path.join(PROJECT_ROOT_PATH, "./querybook/static")
CONFIG_PATH = os.path.join(PROJECT_ROOT_PATH, "./querybook/config")
WEBAPP_DIR_PATH = os.path.join(PROJECT_ROOT_PATH, "./dist/webapp/")
WEBAPP_INDEX_PATH = os.path.join(WEBAPP_DIR_PATH, "index.html")
CHANGE_LOG_PATH = os.path.join(PROJECT_ROOT_PATH, "./docs_website/docs/changelog/")
