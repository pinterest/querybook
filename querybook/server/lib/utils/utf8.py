from typing import Tuple


def is_start_byte(b: int) -> bool:
    """Check if b is a start character byte in utf8
       See https://en.wikipedia.org/wiki/UTF-8
       for encoding details
    Args:
        b (int): a utf8 byte

    Returns:
        bool: whether or not b is a valid starting byte
    """

    # a non-start char has encoding 10xxxxxx
    return (b >> 6) != 2


CHAR_POS_TO_STR_LENGTH = {7: 1, 5: 2, 4: 3, 3: 4}


def is_bytes_valid_utf8_char(bs: bytes) -> bool:
    """Check if bs is a valid utf8 character

    Args:
        bs (bytes): The bytes string

    Returns:
        bool: Whether or not bs represents 1 utf8 char
    """
    if not is_start_byte(bs[0]):
        return False

    first_zero_char_pos = None
    # Four possible variations
    # 0, 110, 1110, 11110
    for i in range(7, 2, -1):
        if (bs[0] & (1 << i)) == 0:
            first_zero_char_pos = i
            break

    valid_len = CHAR_POS_TO_STR_LENGTH.get(first_zero_char_pos, 0)
    if len(bs) != valid_len:
        return False

    if any(is_start_byte(bs[i]) for i in range(1, len(bs))):
        return False

    return True


def split_by_last_invalid_utf8_char(binary_s: bytes) -> Tuple[bytes, bytes]:
    """Given a utf8 bytes string, we want to ensure we can take substring of
        the byte string and get back a valid utf8 string, so given substring a, b
        we want to break a into a + a', and we would get 2 valid utf8 substring
        a and a' + b

    Args:
        binary_s (bytes): utf8 encoded bytes string which the last char might not be
                          valid

    Returns:
        Tuple[bytes, bytes]: The first bytes are valid prefix, the second bytes is the invalid suffix
    """

    last_start_byte = len(binary_s) - 1
    while last_start_byte >= 0:
        if is_start_byte(binary_s[last_start_byte]):
            break
        last_start_byte -= 1

    # We went thru the entire string and found no valid start byte
    if last_start_byte < 0:
        return [b"", binary_s]

    last_start_char = binary_s[last_start_byte:]

    # The whole string is valid
    if is_bytes_valid_utf8_char(last_start_char):
        return [binary_s, b""]

    return [binary_s[:last_start_byte], last_start_char]
