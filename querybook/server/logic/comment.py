from app.db import with_session
from models.comment import Comment, CommentReaction, DataTableComment, DataCellComment
from const.comment import CommentDict


@with_session
def get_comment_by_id(comment_id: int, session=None):
    return Comment.get(id=comment_id, session=session)


@with_session
def get_all_comment_data_dict_by_id(comment_id: int, session=None) -> CommentDict:
    comment = Comment.get(id=comment_id, session=session)
    child_comments = session.query(Comment).filter(
        Comment.parent_comment_id == comment_id
    )
    reactions = (
        session.query(CommentReaction)
        .filter(CommentReaction.comment_id == comment_id)
        .all()
    )

    comment_dict = comment.to_dict()
    comment_dict["child_comment_ids"] = [
        child_comment.id for child_comment in child_comments
    ]
    comment_dict["reactions"] = [reaction.to_dict() for reaction in reactions]

    return comment_dict


@with_session
def get_comments_by_data_cell_id(data_cell_id: int, session=None):
    cell_comments = (
        session.query(DataCellComment)
        .filter(DataCellComment.data_cell_id == data_cell_id)
        .all()
    )

    return [
        get_all_comment_data_dict_by_id(cell_comment.id, session=session)
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
        get_all_comment_data_dict_by_id(table_comment.id, session=session)
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
    return get_all_comment_data_dict_by_id(comment.id, session=session)


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
    return get_all_comment_data_dict_by_id(comment.id, session=session)


@with_session
def get_thread_comments(parent_comment_id: int, session=None):
    comments = (
        session.query(Comment)
        .filter(Comment.parent_comment_id == parent_comment_id)
        .order_by(Comment.created_at)
        .all()
    )
    return [
        get_all_comment_data_dict_by_id(comment.id, session=session)
        for comment in comments
    ]


@with_session
def add_thread_comment(parent_comment_id: int, uid: int, text, session=None):
    comment = Comment.create(
        {"created_by": uid, "text": text, "parent_comment_id": parent_comment_id},
        session=session,
    )
    return get_all_comment_data_dict_by_id(comment.id, session=session)


@with_session
def edit_comment(comment_id: int, session=None, **fields):
    comment = Comment.update(
        id=comment_id,
        fields=fields,
        field_names=["text"],
        commit=True,
        session=session,
    )
    return get_all_comment_data_dict_by_id(comment.id)


@with_session
def remove_comment(comment_id: int, session=None):
    # TODO: update to archive - will do as last pr before merge (bc alembic)
    Comment.delete(
        comment_id,
        session=session,
    )


@with_session
def add_reaction(comment_id: int, reaction: str, uid: int, session=None):
    reaction = CommentReaction.create(
        {"comment_id": comment_id, "reaction": reaction, "created_by": uid},
        session=session,
    )
    return reaction


@with_session
def remove_reaction(reaction_id: int, session=None):
    CommentReaction.delete(
        reaction_id,
        session=session,
    )
