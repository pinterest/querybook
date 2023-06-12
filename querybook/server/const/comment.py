from typing import List, Optional, TypedDict
from models.comment import CommentReaction


class CommentDict(TypedDict):
    id: int
    created_at: int
    updated_at: int
    created_by: str
    text: str
    parent_comment_id: Optional[int]
    child_comment_count: int
    reactions: List[CommentReaction]
