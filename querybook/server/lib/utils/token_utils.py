from logic.user import get_user_by_id, update_user_properties
from .crypto_utils import encrypt_token, decrypt_token, DecryptionError
from app.auth.utils import AuthenticationError
from lib.logger import get_logger

LOG = get_logger(__file__)


class TokenManager:
    def __init__(self, token_type: str, encryption_key: str):
        """
        Initializes the TokenManager with a token type and its encryption key.

        Args:
            token_type (str): The key under which the token is stored (e.g., 'github_access_token').
            encryption_key (str): The encryption key as a string.
        """
        self.token_type = token_type
        self.encryption_key = encryption_key.encode()

    def save_token(self, user_id: int, token: str) -> None:
        encrypted_token = encrypt_token(token, self.encryption_key)
        try:
            update_user_properties(user_id, **{self.token_type: encrypted_token})
            LOG.debug(
                f"Saved encrypted token '{self.token_type}' for user ID {user_id}"
            )
        except Exception as e:
            LOG.error(f"Failed to update user properties: {e}")
            raise AuthenticationError(f"Failed to save token '{self.token_type}'")

    def get_token(self, user_id: int) -> str:
        user = get_user_by_id(user_id)
        if not user:
            LOG.error(f"User not found when retrieving '{self.token_type}' token")
            raise AuthenticationError("User not found")

        encrypted_token = user.properties.get(self.token_type)
        if not encrypted_token:
            LOG.error(f"Token '{self.token_type}' not found in user properties")
            raise AuthenticationError(f"Token '{self.token_type}' not found")

        try:
            token = decrypt_token(encrypted_token, self.encryption_key)
            return token
        except DecryptionError as e:
            LOG.error(f"Failed to decrypt token '{self.token_type}': {e}")
            self.invalidate_token(user_id)
            raise AuthenticationError(f"Invalid token '{self.token_type}'")

    def invalidate_token(self, user_id: int):
        try:
            update_user_properties(user_id, **{self.token_type: None})
            LOG.debug(f"Removed token '{self.token_type}' for user ID {user_id}")
        except Exception as e:
            LOG.error(
                f"Failed to remove token '{self.token_type}' for user ID {user_id}: {e}"
            )
