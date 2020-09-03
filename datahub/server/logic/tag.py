import datetime
from app.db import with_session
from models.tag import Tag, TagItem
from logic.metastore import update_es_tables_by_id


@with_session
def get_tag_items_by_table_id(table_id, session=None):
    return (
        session.query(TagItem)
        .join(Tag)
        .filter(TagItem.table_id == table_id)
        .order_by(Tag.count.desc())
        .all()
    )


@with_session
def get_tags_by_prefix(prefix, limit=5, session=None):
    return (
        session.query(Tag).filter(Tag.name.like("%" + prefix + "%")).limit(limit).all()
    )


@with_session
def create_or_update_tag(tag_name, commit=True, session=None):
    tag = Tag.get(name=tag_name, session=session)

    if not tag:
        tag = Tag.create({"name": tag_name, "count": 1}, commit=commit, session=session)
    else:
        tag = Tag.update(
            id=tag.id,
            fields={"updated_at": datetime.datetime.now(), "count": tag.count + 1},
            field_names=["updated_at", "count"],
            commit=commit,
            session=session,
        )

    return tag


@with_session
def create_tag_item(table_id, tag_name, uid, session=None):
    existing_tag_item = TagItem.get(
        table_id=table_id, tag_name=tag_name, session=session
    )

    if existing_tag_item:
        return

    tag = create_or_update_tag(tag_name=tag_name, session=session)

    tag_item = TagItem.create(
        {"tag_name": tag.name, "table_id": table_id, "uid": uid}, session=session
    )
    update_es_tables_by_id(table_id)

    return tag_item


@with_session
def delete_tag_item(tag_item_id, commit=True, session=None):
    tag_item = TagItem.get(id=tag_item_id, session=session)

    tag_item.tag.count = tag_item.tag.count - 1
    tag_item.tag.update_at = datetime.datetime.now()

    session.delete(tag_item)

    if commit:
        session.commit()
        update_es_tables_by_id(tag_item.table_id)
    else:
        session.flush()
