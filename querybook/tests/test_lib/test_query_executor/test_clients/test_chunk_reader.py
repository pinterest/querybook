from unittest import TestCase
from clients.common import ChunkReader

MOCK_RAW_CSV = "foo,bar,baz\nhello,world\na,b,c,d"
MOCK_CSV_LINES = ["foo,bar,baz", "hello,world", "a,b,c,d"]


class MockChunkReaderDerivedClass(ChunkReader):
    def __init__(
        self,
        read_size=5,
        max_read_size=20,
    ):
        self._curr_char = 0
        super(MockChunkReaderDerivedClass, self).__init__(
            read_size=read_size, max_read_size=max_read_size
        )

    def read(self):
        next_chunk = MOCK_RAW_CSV[self._curr_char : self._curr_char + self._read_size]
        self._curr_char += self._read_size
        return next_chunk


class ChunkReaderTestCase(TestCase):
    def test_max_read_size_set_to_none(self):
        reader = MockChunkReaderDerivedClass(max_read_size=None)
        self.assertEqual(reader.read_lines(), MOCK_CSV_LINES)

    def test_max_read_size_not_set(self):
        reader = MockChunkReaderDerivedClass()
        self.assertEqual(reader.read_lines(), MOCK_CSV_LINES[:1])

    def test_set_max_read_size_set(self):
        reader = MockChunkReaderDerivedClass(max_read_size=25)
        self.assertEqual(reader.read_lines(), MOCK_CSV_LINES[:2])
