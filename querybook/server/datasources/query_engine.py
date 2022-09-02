from flask_login import current_user

from app.auth.permission import (
    verify_query_engine_permission,
    verify_environment_permission,
)
from app.datasource import register, api_assert
from app.flask_app import limiter
from app.db import DBSession
from lib.engine_status_checker import get_engine_checker_class
from logic import admin as admin_logic


@register(
    "/query_engine/",
    methods=["GET"],
)
def get_query_engines(environment_id):
    verify_environment_permission([environment_id])
    return admin_logic.get_query_engines_by_environment(environment_id, ordered=True)


@register("/query_engine/<int:engine_id>/status/", methods=["GET"])
@limiter.limit("30 per minute")
def get_query_engine_status(engine_id):
    engine_checker = None
    # Security check
    with DBSession() as session:
        verify_query_engine_permission(engine_id, session=session)
        engine = admin_logic.get_query_engine_by_id(engine_id, session=session)
        engine_checker = get_engine_checker_class(
            engine.get_feature_params().get("status_checker", "NullChecker")
        )

    api_assert(engine_checker is not None, "Invalid engine checker")
    return engine_checker.check(engine_id=engine_id, uid=current_user.id)
