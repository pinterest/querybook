from querybook.server.app.db import with_session
from models.comment import Comment, CommentReaction, DataTableComment, DataCellComment
from querybook.server.const.comment import CommentDict


@with_session
def get_comment_by_id(comment_id: int, session=None):
    return Comment.get(id=comment_id, session=session)


@with_session
def get_all_comment_data_dict_by_id(comment_id: int, session=None) -> CommentDict:
    comment = Comment.get(id=comment_id, session=session)
    child_comments = (
        session.query(Comment)
        .filter(Comment.parent_comment_id == comment_id)
        .order_by(Comment.created_at.asc())
        .all()
    )
    reactions = (
        session.query(CommentReaction)
        .filter(CommentReaction.comment_id == comment_id)
        .all()
    )
    comment_dict = comment.to_dict()
    if child_comments:
        comment_dict["child_comments"] = [
            child_comment.to_dict() for child_comment in child_comments
        ]
    comment_dict["reactions"] = [reaction.to_dict() for reaction in reactions]

    return comment_dict.sort(key=lambda element: element["created_at"])


@with_session
def get_comments_by_data_cell_id(data_cell_id: int, session=None):
    cell_comments = (
        session.query(DataCellComment)
        .filter(DataCellComment.data_cell_id == data_cell_id)
        .all()
    )

    comments = []
    for cell_comment in cell_comments:
        comment_dict = get_all_comment_data_dict_by_id(
            cell_comment.comment_id, session=session
        )
        comments.append(comment_dict)

    return comments


@with_session
def get_comments_by_data_table_id(data_table_id: int, session=None):
    table_comments = (
        session.query(DataTableComment)
        .filter(DataTableComment.data_table_id == data_table_id)
        .all()
    )

    comments = []
    for table_comment in table_comments:
        comment_dict = get_all_comment_data_dict_by_id(
            table_comment.comment_id, session=session
        )
        comments.append(comment_dict)

    return comments


@with_session
def add_comment_to_data_cell(
    data_cell_id: int, uid: int, text, commit=True, session=None
):
    comment = Comment.create(
        {"created_by": uid, "text": text}, commit=commit, session=session
    )
    DataCellComment.create(
        {"data_cell_id": data_cell_id, "comment_id": comment.id},
        commit=commit,
        session=session,
    )
    return comment


@with_session
def add_comment_to_data_table(
    data_table_id: int, uid: int, text, commit=True, session=None
):
    comment = Comment.create(
        {"created_by": uid, "text": text}, commit=commit, session=session
    )
    DataTableComment.create(
        {"data_table_id": data_table_id, "comment_id": comment.id},
        commit=commit,
        session=session,
    )
    return comment


@with_session
def add_thread_comment(
    parent_comment_id: int, uid: int, text, commit=True, session=None
):
    comment = Comment.create(
        {"created_by": uid, "text": text, "parent_comment_id": parent_comment_id},
        commit=commit,
        session=session,
    )
    return comment


@with_session
def edit_comment(comment_id: int, text, commit=True, session=None):
    comment = Comment.update(
        id=comment_id,
        text=text,
        commit=commit,
        session=session,
    )
    return get_all_comment_data_dict_by_id(comment.id)


@with_session
def remove_comment(comment_id: int, session=None):
    Comment.delete(
        comment_id,
        session=session,
    )


@with_session
def add_reaction(comment_id: int, reaction: str, commit=True, session=None):
    reaction = CommentReaction.create(
        {"comment_id": comment_id, "reaction": reaction},
        commit=commit,
        session=session,
    )
    return reaction


@with_session
def remove_reaction(reaction_id: int, session=None):
    CommentReaction.delete(
        reaction_id,
        session=session,
    )
