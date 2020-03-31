from app.db import with_session
from logic.admin import get_query_engine_by_id
from logic.user import get_user_by_id
from lib.query_executor.all_executors import get_executor_class
from lib.query_analysis import get_statements


@with_session
def execute_query(
    query, engine_id, uid=None, session=None,
):
    engine = get_query_engine_by_id(engine_id, session=session)

    client_settings = {
        **engine.get_engine_params(),
    }
    if uid:
        user = get_user_by_id(uid, session=session)
        client_settings["access_token"] = user.access_token
        client_settings["proxy_user"] = user.username

    statements = get_statements(query)
    if len(statements) == 0:
        return None  # Empty statement, return None

    cursor = get_executor_class(engine.executor)._get_client(client_settings).cursor()

    for statement in statements[:-1]:
        cursor.run(statement)
        cursor.poll_until_finish()

    cursor.run(statements[-1])
    cursor.poll_until_finish()
    return cursor.get()
