import time

import pytest

from lib.utils.utils import GeventTimeout, SignalTimeout, TimeoutError


def test_gevent_timeout():
    with pytest.raises(TimeoutError):
        with GeventTimeout(0.1):
            time.sleep(0.2)


def test_gevent_no_timeout():
    try:
        with GeventTimeout(0.2):
            time.sleep(0.1)
    except TimeoutError:
        pytest.fail("TimeoutError raised when it shouldn't")


def test_signal_timeout():
    with pytest.raises(TimeoutError):
        with SignalTimeout(0.1):
            time.sleep(0.2)


def test_signal_no_timeout():
    try:
        with SignalTimeout(0.2):
            time.sleep(0.1)
    except TimeoutError:
        pytest.fail("TimeoutError raised when it shouldn't")
