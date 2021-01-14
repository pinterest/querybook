# import pytest
from lib.utils.utf8 import (
    is_start_byte,
    is_bytes_valid_utf8_char,
    split_by_last_invalid_utf8_char,
)


def test_is_start_byte():
    assert list(map(is_start_byte, "哦한¢".encode("utf-8"))) == [
        True,
        False,
        False,
        True,
        False,
        False,
        True,
        False,
    ]


def test_is_bytes_valid_utf8_char():
    assert is_bytes_valid_utf8_char("哦".encode("utf-8"))
    assert is_bytes_valid_utf8_char("한".encode("utf-8"))
    assert is_bytes_valid_utf8_char("a".encode("utf-8"))
    assert is_bytes_valid_utf8_char("𐍈".encode("utf-8"))

    # 2 Chars
    assert not is_bytes_valid_utf8_char("哦한".encode("utf-8"))
    assert not is_bytes_valid_utf8_char(b"\xe5\x93")
    assert not is_bytes_valid_utf8_char(b"\xe5\x93\xa6\xa6")


def test_split_by_last_invalid_utf8_char():
    assert ["hellow".encode("utf-8"), b""] == split_by_last_invalid_utf8_char(
        "hellow".encode("utf-8")
    )

    # "你好" b'\xe4\xbd\xa0\xe5\xa5\xbd'
    assert [b"\xe4\xbd\xa0\xe5\xa5\xbd", b""] == split_by_last_invalid_utf8_char(
        b"\xe4\xbd\xa0\xe5\xa5\xbd"
    )
    # with 1 char removed
    assert [b"\xe4\xbd\xa0", b"\xe5\xa5"] == split_by_last_invalid_utf8_char(
        b"\xe4\xbd\xa0\xe5\xa5"
    )
    # with 2 char removed
    assert [b"\xe4\xbd\xa0", b"\xe5"] == split_by_last_invalid_utf8_char(
        b"\xe4\xbd\xa0\xe5"
    )
