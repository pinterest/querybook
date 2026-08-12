import hashlib

from fastmcp.server.auth import AccessToken, TokenVerifier

from app.db import DBSession
from models.admin import APIAccessToken


class QuerybookTokenVerifier(TokenVerifier):
    """Validate Querybook API keys (SHA-512 hashed) against the database."""

    async def verify_token(self, token: str) -> AccessToken | None:
        token_hash = hashlib.sha512(token.encode("utf-8")).hexdigest()
        with DBSession() as session:
            api_token = (
                session.query(APIAccessToken)
                .filter(APIAccessToken.token == token_hash)
                .filter(APIAccessToken.enabled.is_(True))
                .first()
            )
            if api_token is None:
                return None
            return AccessToken(
                token=token,
                client_id=str(api_token.creator_uid),
                scopes=[],
                expires_at=None,
                claims={"creator_uid": api_token.creator_uid},
            )
