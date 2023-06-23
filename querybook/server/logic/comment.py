from app.db import with_session
from models.comment import Comment, CommentReaction, DataTableComment, DataCellComment


@with_session
def get_comment_by_id(comment_id: int, session=None):
    return Comment.get(id=comment_id, session=session)


@with_session
def get_comments_by_data_cell_id(data_cell_id: int, session=None):
    cell_comments = (
        session.query(DataCellComment)
        .filter(DataCellComment.data_cell_id == data_cell_id)
        .all()
    )

    return [
        get_comment_by_id(cell_comment.comment_id, session=session)
        for cell_comment in cell_comments
    ]


@with_session
def get_comments_by_data_table_id(data_table_id: int, session=None):
    table_comments = (
        session.query(DataTableComment)
        .filter(DataTableComment.data_table_id == data_table_id)
        .all()
    )

    return [
        get_comment_by_id(table_comment.comment_id, session=session)
        for table_comment in table_comments
    ]


@with_session
def add_comment_to_data_cell(data_cell_id: int, uid: int, text, session=None):
    comment = Comment.create(
        {"created_by": uid, "text": text}, commit=False, session=session
    )
    DataCellComment.create(
        {"data_cell_id": data_cell_id, "comment_id": comment.id},
        commit=False,
        session=session,
    )
    session.commit()
    return comment


@with_session
def add_comment_to_data_table(data_table_id: int, uid: int, text, session=None):
    comment = Comment.create(
        {"created_by": uid, "text": text}, commit=False, session=session
    )
    DataTableComment.create(
        {"data_table_id": data_table_id, "comment_id": comment.id},
        commit=False,
        session=session,
    )
    session.commit()
    return comment


@with_session
def get_thread_comments(parent_comment_id: int, session=None):
    return (
        session.query(Comment)
        .filter(Comment.parent_comment_id == parent_comment_id)
        .order_by(Comment.created_at)
        .all()
    )


@with_session
def add_thread_comment(parent_comment_id: int, uid: int, text, session=None):
    return Comment.create(
        {"created_by": uid, "text": text, "parent_comment_id": parent_comment_id},
        session=session,
    )


@with_session
def edit_comment(comment_id: int, session=None, **fields):
    return Comment.update(
        id=comment_id,
        fields=fields,
        field_names=["text", "archived"],
        commit=True,
        session=session,
    )


@with_session
def add_reaction(comment_id: int, reaction: str, uid: int, session=None):
    return CommentReaction.create(
        {"comment_id": comment_id, "reaction": reaction, "created_by": uid},
        session=session,
    )


@with_session
def remove_reaction(reaction_id: int, session=None):
    CommentReaction.delete(
        reaction_id,
        session=session,
    )
