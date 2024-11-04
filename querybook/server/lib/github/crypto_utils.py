from cryptography.fernet import Fernet
from env import QuerybookSettings
from lib.logger import get_logger

LOG = get_logger(__file__)


class EncryptionError(Exception):
    pass


class DecryptionError(Exception):
    pass


def get_cipher():
    key = QuerybookSettings.GITHUB_CRYPTO_SECRET.encode()
    return Fernet(key)


def encrypt_token(token: str) -> str:
    try:
        cipher = get_cipher()
        encrypted_token = cipher.encrypt(token.encode())
        return encrypted_token.decode()
    except Exception as e:
        LOG.error(f"Encryption failed: {e}")
        raise EncryptionError("Failed to encrypt token")


def decrypt_token(encrypted_token: str) -> str:
    try:
        cipher = get_cipher()
        decrypted_token = cipher.decrypt(encrypted_token.encode())
        return decrypted_token.decode()
    except Exception as e:
        LOG.error(f"Token decryption failed: {e}")
        raise DecryptionError("Failed to decrypt token")
