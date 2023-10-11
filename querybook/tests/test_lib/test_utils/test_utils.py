import time

import pytest

from lib.utils.utils import GeventTimeout, TimeoutError


def test_timeout():
    with pytest.raises(TimeoutError):
        with GeventTimeout(0.1):
            time.sleep(1)
