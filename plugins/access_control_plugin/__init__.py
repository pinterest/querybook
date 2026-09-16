# Override `check_restricted_query_access` to control access to environments
# and query engines that are outside the SAFE_ENVIRONMENTS / SAFE_QUERY_ENGINES
# allowlists. The function is called with the ids of the resources being
# accessed as keyword arguments (`environment_ids` and/or `query_engine_ids`)
# and runs inside a Flask request context, so `flask.request` and
# `flask_login.current_user` are available for inspecting the request. Accept
# `**kwargs` to stay forward-compatible with future keyword arguments.
#
# Return True to allow the request, False to deny it.
#
# Example: only allow access when an API access token is NOT used
# (i.e. restrict API token requests to the safe allowlists while letting
# normal browser sessions through unrestricted):
#
# from flask import request
#
# def check_restricted_query_access(**kwargs) -> bool:
#     return request.headers.get("api-access-token") is None
