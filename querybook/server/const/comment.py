from typing import List, Optional, TypedDict

from querybook.server.models.comment import Comment, CommentReaction


class CommentDict(TypedDict):
    id: int
    created_at: int
    updated_at: int
    created_by: str
    text: str
    parent_comment_id: Optional[int]
    # this should be CommentDict but i dont think it can self-ref
    child_comments: Optional[List[Comment]]
    reactions: List[CommentReaction]
