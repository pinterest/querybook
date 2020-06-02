from flask_login import current_user

from app.auth.permission import (
    verify_environment_permission,
    verify_query_engine_permission,
)
from app.datasource import register, api_assert
from app.db import DBSession
from logic import datadoc as logic
from logic import admin as admin_logic


@register("/query_snippet/<int:query_snippet_id>/", methods=["GET"])
def get_query_snippet_by_id(query_snippet_id):
    with DBSession() as session:
        query_snippet = logic.get_snippet_by_id(query_snippet_id, session=session)
        verify_query_engine_permission(query_snippet.engine_id, session=session)
        return query_snippet


@register("/query_snippet/<int:query_snippet_id>/", methods=["PUT"])
def update_query_snippet_by_id(
    query_snippet_id,
    context=None,
    title=None,
    description=None,
    engine_id=None,
    golden=None,
    is_public=None,
):
    updated_by = current_user.id

    with DBSession() as session:
        snippet = logic.get_snippet_by_id(query_snippet_id, session=session)

        api_assert(snippet, "Snippet not found")
        verify_query_engine_permission(snippet.engine_id, session=session)

        # Pre condition check
        if snippet.golden:  # Editing a golden snippet
            api_assert(
                current_user.is_admin, "Golden snippet can only be updated by Admin"
            )
        elif not snippet.is_public:  # Editing a private snippet
            api_assert(
                updated_by == snippet.created_by,
                "Private query can only be updated by creator",
            )

        # Post condition check
        if (
            is_public is not None and is_public != snippet.is_public
        ):  # Becomes public/private
            api_assert(
                updated_by == snippet.created_by,
                "Only creator can toggle public/private",
            )
        if golden is not None and golden != snippet.golden:  # Becomes golden
            api_assert(current_user.is_admin, "Only data gurus can make snippet golden")

        return logic.update_snippet_by_id(
            query_snippet_id,
            updated_by,
            context=context,
            title=title,
            engine_id=engine_id,
            description=description,
            is_public=is_public,
            golden=golden,
            session=session,
        )


@register("/query_snippet/", methods=["POST"])
def create_query_snippet(
    context=None,
    title=None,
    engine_id=None,
    description=None,
    is_public=None,
    golden=None,
):
    created_by = current_user.id

    api_assert(len(context) > 0, "No empty context")
    api_assert(len(title) > 0, "No empty title")
    api_assert(engine_id is not None, "Must specify engine")
    api_assert(
        not golden or current_user.is_admin, "Only data gurus can create golden snippet"
    )

    with DBSession() as session:
        verify_query_engine_permission(engine_id, session=session)

        return logic.create_snippet(
            created_by,
            context=context,
            title=title,
            engine_id=engine_id,
            description=description,
            is_public=is_public,
            golden=golden,
            session=session,
        )


@register("/query_snippet/<int:query_snippet_id>/", methods=["DELETE"])
def delete_query_snippet_by_id(query_snippet_id):
    deleted_by = current_user.id

    with DBSession() as session:
        snippet = logic.get_snippet_by_id(query_snippet_id, session=session)
        api_assert(snippet, "Snippet not found")

        api_assert(
            snippet.created_by == deleted_by or current_user.is_admin,
            "Only creator or Admin can delete this snippet",
        )
        verify_query_engine_permission(snippet.engine_id, session=session)

        logic.delete_snippet(query_snippet_id, deleted_by, session=session)


@register("/query_snippet_search/", methods=["GET"])
def search_query_snippet(environment_id, engine_id=None, is_public=False, golden=None):
    search_by = current_user.id

    with DBSession() as session:
        # TODO: Check if engine_id is under environment_id
        verify_environment_permission([environment_id])
        engine_ids = (
            [engine_id]
            if engine_id is not None
            else list(
                map(
                    lambda e: e.id,
                    admin_logic.get_query_engines_by_environment(environment_id),
                )
            )
        )

        query_snippets = logic.search_snippet(
            search_by=search_by,
            engine_ids=engine_ids,
            is_public=is_public,
            golden=golden,
            session=session,
        )

        query_snippet_dicts = [
            dict(id=snippet[0], title=snippet[1]) for snippet in query_snippets
        ]

        return query_snippet_dicts
