from flask_login import current_user

from app.datasource import register
from app.db import DBSession
from app.auth.permission import verify_data_table_permission
from logic import tag as logic


@register(
    "/tag/table/<int:table_id>/", methods=["GET"],
)
def get_tag_items(table_id):
    with DBSession() as session:
        verify_data_table_permission(table_id, session=session)
        return logic.get_tag_items_by_table_id(table_id=table_id, session=session)


@register(
    "/tag/keyword/", methods=["GET"],
)
def get_tags_by_keyword(keyword):
    with DBSession() as session:
        tags = logic.get_tags_by_keyword(keyword=keyword, session=session)
        return [tag.name for tag in tags]


@register(
    "/tag/table/<int:table_id>/", methods=["POST"],
)
def create_tag_item(table_id, tag):
    with DBSession() as session:
        verify_data_table_permission(table_id, session=session)
        return logic.create_tag_item(
            table_id=table_id, tag_name=tag, uid=current_user.id, session=session
        )


@register(
    "/tag/table/<int:table_id>/<int:tag_id>/", methods=["DELETE"],
)
def delete_tag_item(table_id, tag_item_id):
    with DBSession() as session:
        verify_data_table_permission(table_id, session=session)
        return logic.delete_tag_item(tag_item_id=tag_item_id, session=session)
