from flask_login import current_user

from app.auth.permission import verify_environment_permission
from app.datasource import register, api_assert
from app.flask_app import limiter
from app.db import DBSession
from lib.engine_status_checker import get_engine_checker_class
from logic import admin as admin_logic


@register(
    "/query_engine/", methods=["GET"],
)
def get_query_engines(environment_id):
    verify_environment_permission([environment_id])
    engines = admin_logic.get_query_engines_by_environment(environment_id)
    engines_dict = [engine.to_dict() for engine in engines]

    return engines_dict


@register("/query_engine/<int:id>/status/", methods=["GET"])
@limiter.limit("30 per minute")
def get_query_engine_status(id):
    engine_checker = None
    # Security check
    with DBSession() as session:
        engine = admin_logic.get_query_engine_by_id(id, session=session)
        api_assert(engine)
        verify_environment_permission([engine.environment_id])
        engine_checker = get_engine_checker_class(
            getattr(engine, "status_checker") or "NullChecker"
        )

    api_assert(engine_checker is not None, "Invalid engine checker")
    return engine_checker.check(engine_id=id, uid=current_user.id)
