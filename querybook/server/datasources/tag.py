from flask_login import current_user

from app.datasource import register, api_assert
from app.db import DBSession
from app.auth.permission import (
    verify_data_table_permission,
    verify_data_column_permission,
)
from logic import tag as logic
from models.tag import Tag


@register(
    "/table/<int:table_id>/tag/",
    methods=["GET"],
)
def get_tags_by_table_id(table_id: int):
    verify_data_table_permission(table_id)
    return logic.get_tags_by_table_id(table_id=table_id)


@register(
    "/column/<int:column_id>/tag/",
    methods=["GET"],
)
def get_tags_by_column_id(column_id: int):
    verify_data_column_permission(column_id)
    return logic.get_tags_by_column_id(column_id=column_id)


@register(
    "/tag/keyword/",
    methods=["GET"],
)
def get_tags_by_keyword(keyword):
    with DBSession() as session:
        tags = logic.get_tags_by_keyword(keyword=keyword, session=session)
        return [tag.name for tag in tags]


@register("/tag/<int:tag_id>/", methods=["PUT"])
def update_tag(tag_id, meta):
    tag = Tag.get(id=tag_id)
    if (tag.meta or {}).get("admin", False):
        api_assert(current_user.is_admin, "Tag can only be modified by admin")

    return Tag.update(id=tag_id, fields={"meta": meta}, skip_if_value_none=True)


@register(
    "/table/<int:table_id>/tag/",
    methods=["POST"],
)
def add_tag_to_table(table_id, tag):
    with DBSession() as session:
        verify_data_table_permission(table_id, session=session)
        return logic.add_tag_to_table(
            table_id=table_id,
            tag_name=tag,
            uid=current_user.id,
            user_is_admin=current_user.is_admin,
            session=session,
        )


@register(
    "/table/<int:table_id>/tag/",
    methods=["DELETE"],
)
def delete_tag_from_table(table_id: int, tag_name: str):
    with DBSession() as session:
        verify_data_table_permission(table_id, session=session)
        return logic.delete_tag_from_table(
            table_id=table_id,
            tag_name=tag_name,
            user_is_admin=current_user.is_admin,
            session=session,
        )
