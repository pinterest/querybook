import datetime
from app.db import with_session
from models.tag import Tag, TagItem


@with_session
def get_tag_items_by_table_id(table_id, session=None):
    return session.query(TagItem).filter(TagItem.table_id == table_id).all()


@with_session
def get_tag_item_by_id(tag_id, session=None):
    return session.query(TagItem).filter(TagItem.id == tag_id).first()


@with_session
def get_tag_by_name(tag_name, session=None):
    return session.query(Tag).filter(Tag.name == tag_name).first()


@with_session
def create_tag_item(table_id, tag_name, uid, session=None):
    tag_item = (
        session.query(TagItem).filter_by(table_id=table_id, tag_name=tag_name).first()
    )
    if tag_item:
        return

    tag = get_tag_by_name(tag_name=tag_name, session=session)
    if tag:
        tag.updated_at = datetime.datetime.now()
        tag.count = tag.count + 1
    else:
        tag = Tag(
            name=tag_name,
            created_at=datetime.datetime.now(),
            updated_at=datetime.datetime.now(),
            count=1,
        )
        session.add(tag)

    tag_item = TagItem(
        created_at=datetime.datetime.now(),
        tag_name=tag.name,
        table_id=table_id,
        uid=uid,
    )
    session.add(tag_item)

    session.commit()
    return tag_item


@with_session
def delete_tag_item(tag_item_id, commit=True, session=None):
    tag_item = get_tag_item_by_id(tag_item_id)

    tag = get_tag_by_name(tag_item.tag_name)
    tag.updated_at = datetime.datetime.now()
    tag.count = tag.count - 1

    session.delete(tag_item)

    if commit:
        session.commit()
    else:
        session.flush()
