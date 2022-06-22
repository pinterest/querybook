def construct_suggest_user_query(
    prefix: str,
    limit: int,
):
    return {
        "suggest": {
            "suggest": {
                "text": (prefix or "").lower(),
                "completion": {"field": "suggest", "size": limit},
            }
        },
    }
