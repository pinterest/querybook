import datetime

from sqlalchemy import or_
from app.db import with_session
from const.elasticsearch import ElasticsearchItem
from models.board import Board, BoardItem, BoardEditor
from models.access_request import AccessRequest
from lib.sqlalchemy import update_model_fields
from tasks.sync_elasticsearch import sync_elasticsearch


@with_session
def get_user_boards(uid, environment_id, filter_str="", session=None):
    query = session.query(Board).filter_by(
        owner_uid=uid, environment_id=environment_id, deleted_at=None
    )
    if filter_str:
        query = query.filter(Board.name.like("%" + filter_str + "%"))
    return query.all()


@with_session
def create_board(
    name,
    environment_id,
    owner_uid,
    description=None,
    public=None,
    board_type="",
    commit=True,
    session=None,
):
    board = Board.create(
        {
            "name": name,
            "environment_id": environment_id,
            "owner_uid": owner_uid,
            "description": description,
            "public": public,
            "board_type": board_type,
        },
        commit=commit,
        session=session,
    )

    if commit:
        update_es_boards_by_id(board.id)

    return board


@with_session
def update_board(id, commit=True, session=None, **fields):
    board = Board.update(
        id,
        fields=fields,
        field_names=["name", "description", "public"],
        commit=commit,
        session=session,
    )

    if commit:
        update_es_boards_by_id(board.id)

    return board


def item_type_to_id_type(item_type):
    assert item_type in ["data_doc", "table", "board", "query"], "Invalid item type"
    return item_type + "_execution_id" if item_type == "query" else item_type + "_id"


@with_session
def add_item_to_board(board_id, item_id, item_type, session=None):  # data_doc or table
    board = Board.get(id=board_id, session=session)
    assert board, "Invalid board id"

    # Avoid duplication
    board_item = (
        session.query(BoardItem)
        .filter_by(
            **{"parent_board_id": board_id, item_type_to_id_type(item_type): item_id}
        )
        .first()
    )

    if not board_item:
        board_item = BoardItem(
            parent_board_id=board_id,
            item_order=board.get_max_item_order(session=session) + 1,
        )
        setattr(board_item, item_type_to_id_type(item_type), item_id)
        session.add(board_item)
        session.commit()
        board_item.id
        update_es_boards_by_id(board_id)

    return board_item


@with_session
def move_item_order(board_id, from_index, to_index, commit=True, session=None):
    if from_index == to_index:
        return  # NOOP

    board = Board.get(id=board_id, session=session)
    board_items = board.items
    assert 0 <= from_index < len(board_items) and 0 <= to_index < len(
        board_items
    ), "Invalid index"
    board_item = board_items[from_index]
    from_item_order = board_item.item_order
    to_item_order = board_items[to_index].item_order

    is_move_down = from_item_order < to_item_order
    if is_move_down:
        session.query(BoardItem).filter(BoardItem.parent_board_id == board_id).filter(
            BoardItem.item_order <= to_item_order
        ).filter(BoardItem.item_order > from_item_order).update(
            {BoardItem.item_order: BoardItem.item_order - 1}
        )
    else:
        # moving up
        session.query(BoardItem).filter(BoardItem.parent_board_id == board_id).filter(
            BoardItem.item_order >= to_item_order
        ).filter(BoardItem.item_order < from_item_order).update(
            {BoardItem.item_order: BoardItem.item_order + 1}
        )
    # Move item to the right place
    board_item.item_order = to_item_order
    board.updated_at = datetime.datetime.now()

    if commit:
        session.commit()
    else:
        session.flush()
    return board


@with_session
def get_item_from_board(board_id, item_id, item_type, session=None):
    return (
        session.query(BoardItem)
        .filter_by(
            **{"parent_board_id": board_id, item_type_to_id_type(item_type): item_id}
        )
        .first()
    )


@with_session
def remove_item_from_board(board_id, item_id, item_type, commit=True, session=None):
    item = get_item_from_board(board_id, item_id, item_type, session=session)
    if item:
        session.delete(item)
        if commit:
            session.commit()
            update_es_boards_by_id(board_id)


@with_session
def get_board_ids_from_board_item(item_type, item_id, environment_id, session=None):
    return list(
        map(
            lambda id_tuple: id_tuple[0],
            session.query(Board.id)
            .join(BoardItem, Board.id == BoardItem.parent_board_id)
            .filter(getattr(BoardItem, item_type_to_id_type(item_type)) == item_id)
            .filter(Board.environment_id == environment_id)
            .all(),
        )
    )


@with_session
def get_boards_from_board_item(
    item_type, item_id, environment_id, current_user_id, session=None
):
    return (
        session.query(Board)
        .join(BoardItem, Board.id == BoardItem.parent_board_id)
        .filter(getattr(BoardItem, item_type_to_id_type(item_type)) == item_id)
        .filter(Board.environment_id == environment_id)
        .filter(
            or_(
                Board.public.is_(True),
                Board.owner_uid == current_user_id,
                # TODO (kgopal492): Account for board sharing
            )
        )
        .all()
    )


def update_es_boards_by_id(board_id: int):
    sync_elasticsearch.apply_async(args=[ElasticsearchItem.boards.value, board_id])


@with_session
def get_all_public_boards(environment_id, session=None):
    return (
        session.query(Board)
        .filter(Board.public.is_(True))
        .filter(Board.environment_id == environment_id)
        .all()
    )


@with_session
def update_board_item(id, session=None, **fields):
    board = BoardItem.update(
        id,
        fields=fields,
        field_names=["description", "meta"],
        session=session,
    )

    return board


"""
    ----------------------------------------------------------------------------------------------------------
    BOARD EDITOR
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def get_board_editor_by_id(id, session=None):
    return session.query(BoardEditor).get(id)


@with_session
def get_board_editors_by_board_id(board_id, session=None):
    return session.query(BoardEditor).filter_by(board_id=board_id).all()


@with_session
def create_board_editor(
    board_id, uid, read=False, write=False, commit=True, session=None
):
    editor = BoardEditor(board_id=board_id, uid=uid, read=read, write=write)

    session.add(editor)
    if commit:
        session.commit()
        update_es_boards_by_id(editor.board_id)
    else:
        session.flush()
    session.refresh(editor)
    return editor


@with_session
def update_board_editor(
    id,
    read=None,
    write=None,
    commit=True,
    session=None,
    **fields,
):
    editor = get_board_editor_by_id(id, session=session)
    if editor:
        updated = update_model_fields(
            editor, skip_if_value_none=True, read=read, write=write
        )

        if updated:
            if commit:
                session.commit()
            else:
                session.flush()
            session.refresh(editor)
        return editor


@with_session
def delete_board_editor(id, board_id, session=None, commit=True):
    session.query(BoardEditor).filter_by(id=id).delete()
    if commit:
        session.commit()
        update_es_boards_by_id(board_id)


"""
    ----------------------------------------------------------------------------------------------------------
    BOARD ACCESS REQUESTS
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def get_board_access_requests_by_board_id(board_id, session=None):
    return session.query(AccessRequest).filter_by(board_id=board_id).all()


@with_session
def get_board_access_request_by_board_id(board_id, uid, session=None):
    return session.query(AccessRequest).filter_by(board_id=board_id, uid=uid).first()


@with_session
def create_board_access_request(board_id, uid, commit=True, session=None):
    request = AccessRequest(uid=uid, board_id=board_id)
    session.add(request)
    if commit:
        session.commit()
    else:
        session.flush()
    session.refresh(request)
    return request


@with_session
def remove_board_access_request(board_id, uid, session=None, commit=True):
    session.query(AccessRequest).filter_by(board_id=board_id, uid=uid).delete()
    if commit:
        session.commit()
