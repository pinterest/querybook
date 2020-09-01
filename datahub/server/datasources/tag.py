from flask_login import current_user

from app.datasource import register
from app.db import DBSession
from app.auth.permission import verify_data_table_permission
from logic import tag as logic


@register(
    "/tag/", methods=["GET"],
)
def get_tag_items(table_id):
    with DBSession() as session:
        verify_data_table_permission(table_id, session=session)
        tag_items = logic.get_tag_items_by_table_id(table_id=table_id, session=session)
        return [tag_item.to_dict() for tag_item in tag_items]


@register(
    "/tag/prefix/", methods=["GET"],
)
def get_tags_by_prefix(prefix, limit=None):
    with DBSession() as session:
        tags = logic.get_tags_by_prefix(prefix=prefix, limit=limit, session=session)
        return [tag.name for tag in tags]


@register(
    "/tag/", methods=["POST"],
)
def create_tag_item(table_id, tag):
    with DBSession() as session:
        verify_data_table_permission(table_id, session=session)
        tag_item = logic.create_tag_item(
            table_id=table_id, tag_name=tag, uid=current_user.id, session=session
        )
        return tag_item.to_dict()


@register(
    "/tag/<int:tag_id>/", methods=["DELETE"],
)
def delete_tag_item(tag_id, table_id):
    with DBSession() as session:
        verify_data_table_permission(table_id, session=session)
        return logic.delete_tag_item(tag_item_id=tag_id, session=session)
