from functools import wraps

from flask_login import current_user

from const.admin import AdminOperation, AdminItemType
from const.db import description_length

from lib.utils.json import dumps
from lib.logger import get_logger
from models.admin import AdminAuditLog

LOG = get_logger(__file__)

"""
    ---------------------------------------------------------------------------------------------------------
    Admin Audit Log
    Record every action in the Admin API
    ---------------------------------------------------------------------------------------------------------
"""


def with_admin_audit_log(item_type: AdminItemType, op: AdminOperation):
    def wrapper(fn):
        @wraps(fn)
        def handler(*args, **kwargs):
            result = fn(*args, **kwargs)
            try:
                item_id = (
                    (
                        result["id"]
                        if isinstance(result, dict)
                        else getattr(
                            result,
                            "id",
                        )
                    )
                    if op == AdminOperation.CREATE
                    else kwargs["id"]
                )
                log = (
                    None
                    if op == AdminOperation.DELETE
                    else dumps(list(kwargs.keys()))[:description_length]
                )
                AdminAuditLog.create(
                    {
                        "uid": current_user.id,
                        "item_id": item_id,
                        "op": op,
                        "item_type": item_type.value,
                        "log": log,
                    }
                )
            except Exception as e:
                LOG.error(e, exc_info=True)
            finally:
                return result

        handler.__raw__ = fn
        return handler

    return wrapper
