from flask_login import current_user
from app.datasource import register
from logic import comment as logic
from querybook.server.app.db import DBSession
from querybook.server.logic.comment_permission import assert_can_edit_and_delete


@register(
    "/comment/data_cell/<int:data_cell_id>/",
    methods=["GET"],
)
def get_comments_by_cell_id(data_cell_id: int):
    return logic.get_comments_by_data_cell_id(data_cell_id=data_cell_id)


@register(
    "/comment/data_table/<int:data_table_id>/",
    methods=["GET"],
)
def get_comments_by_table_id(data_table_id: int):
    return logic.get_comments_by_data_table_id(data_table_id=data_table_id)


@register(
    "/comment/data_cell/<int:data_cell_id>/",
    methods=["POST"],
)
def add_comment_to_cell(data_cell_id: int, text):
    return logic.add_comment_to_data_cell(
        data_cell_id=data_cell_id, uid=current_user.id, text=text
    )


@register(
    "/comment/data_table/<int:data_table_id>/",
    methods=["POST"],
)
def add_comment_to_table(data_table_id: int, text):
    return logic.add_comment_to_data_table(
        data_table_id=data_table_id,
        uid=current_user.id,
        text=text,
    )


@register(
    "/comment/<int:parent_comment_id>/",
    methods=["POST"],
)
def add_thread_comment(parent_comment_id: int, text):
    return logic.add_thread_comment(
        parent_comment_id=parent_comment_id, uid=current_user.id, text=text
    )


@register(
    "/comment/<int:comment_id>/",
    methods=["PUT"],
)
def edit_comment(comment_id: int, text):
    with DBSession() as session:
        assert_can_edit_and_delete(comment_id=comment_id, session=session)
        return logic.edit_comment(comment_id=comment_id, text=text)


@register(
    "/comment/<int:comment_id>/",
    methods=["DELETE"],
)
def remove_comment(comment_id: int):
    with DBSession() as session:
        assert_can_edit_and_delete(comment_id=comment_id, session=session)
        return logic.remove_comment(comment_id=comment_id)


# reactions
@register(
    "/comment/<int:comment_id>/",
    methods=["POST"],
)
def add_reaction(comment_id: int, reaction):
    return logic.add_reaction(
        comment_id=comment_id,
        reaction=reaction,
    )


@register(
    "/comment/<int:reaction_id>/",
    methods=["DELETE"],
)
def remove_reaction(reaction_id: int):
    return logic.remove_reaction(reaction_id=reaction_id)
