import datetime
from app.db import with_session
from models.tag import Tag, TagItem
from logic.metastore import update_es_tables_by_id


@with_session
def get_tag_items_by_table_id(table_id, session=None):
    return session.query(TagItem).filter(TagItem.table_id == table_id).all()


@with_session
def get_tags_by_prefix(prefix, limit=5, session=None):
    return (
        session.query(Tag).filter(Tag.name.like("%" + prefix + "%")).limit(limit).all()
    )


@with_session
def get_tag_item_by_id(tag_id, session=None):
    return session.query(TagItem).filter(TagItem.id == tag_id).first()


@with_session
def get_tag_by_name(tag_name, session=None):
    return session.query(Tag).filter(Tag.name == tag_name).first()


@with_session
def create_or_update_tag(tag_name, is_delete=False, commit=True, session=None):
    tag = get_tag_by_name(tag_name=tag_name, session=session)

    if not tag and not is_delete:
        tag = Tag(name=tag_name, count=1,)
        session.add(tag)
    else:
        tag.updated_at = datetime.datetime.now()
        tag.count = tag.count - 1 if is_delete else tag.count + 1

    if commit:
        session.commit()
    else:
        session.flush()

    return tag


@with_session
def create_tag_item(table_id, tag_name, uid, session=None):
    existing_tag_item = (
        session.query(TagItem).filter_by(table_id=table_id, tag_name=tag_name).first()
    )
    if existing_tag_item:
        return

    tag = create_or_update_tag(tag_name=tag_name, session=session)

    tag_item = TagItem(tag_name=tag.name, table_id=table_id, uid=uid,)
    session.add(tag_item)

    session.commit()
    update_es_tables_by_id(table_id)

    return tag_item


@with_session
def delete_tag_item(tag_item_id, commit=True, session=None):
    tag_item = get_tag_item_by_id(tag_item_id)

    create_or_update_tag(tag_name=tag_item.tag_name, is_delete=True, session=session)

    session.delete(tag_item)

    if commit:
        session.commit()
        update_es_tables_by_id(tag_item.table_id)
    else:
        session.flush()
