from typing import NamedTuple


class UserGroup(NamedTuple):
    name: str
    display_name: str
    description: str
    email: str
    # list of user names
    members: list[str]
