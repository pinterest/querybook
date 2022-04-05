from unittest import TestCase

from lib.data_doc.data_cell import get_valid_meta, check_type_match


class CheckTypeMatchTestCase(TestCase):
    def test_check_same(self):
        self.assertTrue(check_type_match(1, 2))
        self.assertTrue(check_type_match(1.5, 1.0))
        self.assertTrue(check_type_match(1, 0.0))
        self.assertTrue(check_type_match("a", "b"))
        self.assertTrue(check_type_match({"a": 1}, {"b": 2}))
        self.assertTrue(check_type_match([0, 1, 2], [3, 4, 5]))

    def test_check_different(self):
        self.assertFalse(check_type_match(0.0, 1))
        self.assertFalse(check_type_match(1, "1"))
        self.assertFalse(check_type_match({}, {"a"}))


class GetValidMetaTestCase(TestCase):
    def test_simple(self):
        self.assertEqual(get_valid_meta(2, 1), 2)
        self.assertEqual(get_valid_meta("Hello", "World"), "Hello")
        self.assertEqual(get_valid_meta(1, 1.5), 1)
        self.assertEqual(get_valid_meta(0.5, 1.5), 0.5)

    def test_default(self):
        self.assertEqual(get_valid_meta(None, 1.5, 0.5), 0.5)
        self.assertEqual(
            get_valid_meta(
                {"a": 2, "b": None}, {"a": 1, "b": ""}, {"a": 100, "b": "Hello"}
            ),
            {"a": 2, "b": "Hello"},
        )

    def test_invalid(self):
        with self.assertRaises(ValueError):
            get_valid_meta("a", 1)

        with self.assertRaises(ValueError):
            get_valid_meta(1, "a")

        with self.assertRaises(ValueError):
            get_valid_meta(1.5, 1)

    def test_nested_dict(self):
        meta = {"title": "Test", "engine": 20, "meta": {"field1": "a", "field2": "b"}}
        meta_type = {"title": "", "engine": 0, "meta": {"field1": "", "field2": ""}}
        self.assertEqual(
            get_valid_meta(meta, meta_type),
            meta,
        )

        # Missing
        meta = {"title": "Test2"}
        self.assertEqual(
            get_valid_meta(meta, meta_type),
            meta,
        )

        # Extra
        meta = {"title": "Test3", "newProp": 2}
        self.assertEqual(
            get_valid_meta(meta, meta_type),
            {"title": "Test3"},
        )

    def test_nested_array(self):
        self.assertEqual(
            get_valid_meta(
                [
                    {"title": "Test", "price": 1},
                    {"title": "Hello", "price": None},
                    {"title": None, "price": 3},
                ],
                [{"title": "", "price": 0}],
                [{"title": "World", "price": 2}],
            ),
            [
                {"title": "Test", "price": 1},
                {"title": "Hello", "price": 2},
                {"title": "World", "price": 3},
            ],
        )

    def test_series(self):
        series_meta = {
            "series": {
                "0": {"source": 2, "color": 1},
                "1": {"source": 3, "color": 4},
                "3": {"source": 5, "color": 6},
            }
        }
        series_meta_type = {"series": {0: {"source": 0, "color": 0}}}
        self.assertDictEqual(get_valid_meta(series_meta, series_meta_type), series_meta)
