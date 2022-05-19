import datetime
from app.db import with_session
from models.tag import Tag, TagItem
from logic.metastore import update_es_tables_by_id


@with_session
def get_tag_by_table_id(table_id, session=None):
    return (
        session.query(Tag)
        .join(TagItem)
        .filter(TagItem.table_id == table_id)
        .order_by(Tag.count.desc())
        .all()
    )


@with_session
def get_tags_by_keyword(keyword, limit=10, session=None):
    return (
        session.query(Tag)
        .filter(Tag.name.like("%" + keyword + "%"))
        .order_by(Tag.count.desc())
        .offset(0)
        .limit(limit)
        .all()
    )


@with_session
def create_or_update_tag(tag_name, commit=True, session=None):
    tag = Tag.get(name=tag_name, session=session)

    if not tag:
        tag = Tag.create(
            {"name": tag_name, "count": 1, "meta": {}},
            commit=commit,
            session=session,
        )
    else:
        tag = Tag.update(
            id=tag.id,
            fields={"count": tag.count + 1},
            skip_if_value_none=True,
            commit=commit,
            session=session,
        )

    return tag


@with_session
def add_tag_to_table(table_id, tag_name, uid, user_is_admin=False, session=None):
    existing_tag_item = TagItem.get(
        table_id=table_id, tag_name=tag_name, session=session
    )

    if existing_tag_item:
        return

    tag = create_or_update_tag(tag_name=tag_name, commit=False, session=session)
    if (tag.meta or {}).get("admin"):
        assert user_is_admin, f"Tag {tag_name} can only be modified by admin"

    TagItem.create(
        {"tag_name": tag.name, "table_id": table_id, "uid": uid}, session=session
    )
    update_es_tables_by_id(table_id)

    return tag


@with_session
def delete_tag_from_table(
    table_id, tag_name, user_is_admin=False, commit=True, session=None
):
    tag_item = TagItem.get(table_id=table_id, tag_name=tag_name, session=session)
    tag = tag_item.tag

    tag.count = tag_item.tag.count - 1
    tag.update_at = datetime.datetime.now()
    if (tag.meta or {}).get("admin"):
        assert user_is_admin, f"Tag {tag_name} can only be modified by admin"

    session.delete(tag_item)

    if commit:
        session.commit()
        update_es_tables_by_id(tag_item.table_id)
    else:
        session.flush()
