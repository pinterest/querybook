from typing import List, Optional, TypedDict
from models.comment import CommentReaction


class CommentDict(TypedDict):
    id: int
    created_at: int
    updated_at: int
    created_by: str
    text: str
    parent_comment_id: Optional[int]
    archived: bool
    child_comment_ids: Optional[List[int]]
    reactions: List[CommentReaction]
