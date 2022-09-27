from collections import OrderedDict
from typing import Any, List, Optional, Type

import pytest

from lib.query_executor.clients.utils.presto_types import (
    ArrayType,
    AtomicType,
    MapType,
    PrestoType,
    RowType,
    _bracket_aware_split,
)


@pytest.mark.parametrize(
    "string_definition, exp_type",
    [
        ("integer", AtomicType(type_="integer")),
        ("  integer  ", AtomicType(type_="integer")),
        ("array(integer)", ArrayType(element_type=AtomicType(type_="integer"))),
        ("  array(  integer  )  ", ArrayType(element_type=AtomicType(type_="integer"))),
        (
            "map(integer, integer)",
            MapType(
                key_type=AtomicType(type_="integer"),
                value_type=AtomicType(type_="integer"),
            ),
        ),
        (
            "  map(  integer  ,  integer  )  ",
            MapType(
                key_type=AtomicType(type_="integer"),
                value_type=AtomicType(type_="integer"),
            ),
        ),
        (
            "map(integer,integer)",
            MapType(
                key_type=AtomicType(type_="integer"),
                value_type=AtomicType(type_="integer"),
            ),
        ),
        (
            "row(id integer, name string)",
            RowType(
                fields=OrderedDict(
                    [
                        ("id", AtomicType(type_="integer")),
                        ("name", AtomicType(type_="string")),
                    ]
                )
            ),
        ),
        (
            "row(id integer, date timestamp with time zone)",
            RowType(
                fields=OrderedDict(
                    [
                        ("id", AtomicType(type_="integer")),
                        ("date", AtomicType(type_="timestamp with time zone")),
                    ]
                )
            ),
        ),
        (
            " row( id integer  ,  name string ) ",
            RowType(
                fields=OrderedDict(
                    [
                        ("id", AtomicType(type_="integer")),
                        ("name", AtomicType(type_="string")),
                    ]
                )
            ),
        ),
        (
            "row(id integer,name string )",
            RowType(
                fields=OrderedDict(
                    [
                        ("id", AtomicType(type_="integer")),
                        ("name", AtomicType(type_="string")),
                    ]
                )
            ),
        ),
        (
            "row(array array(row(name string)))",
            RowType(
                fields=OrderedDict(
                    [
                        (
                            "array",
                            ArrayType(
                                element_type=RowType(
                                    fields=OrderedDict(
                                        [("name", AtomicType(type_="string"))]
                                    )
                                )
                            ),
                        )
                    ]
                )
            ),
        ),
        (
            "row(map map(string, row(name string)))",
            RowType(
                fields=OrderedDict(
                    [
                        (
                            "map",
                            MapType(
                                key_type=AtomicType(type_="string"),
                                value_type=RowType(
                                    fields=OrderedDict(
                                        [("name", AtomicType(type_="string"))]
                                    )
                                ),
                            ),
                        )
                    ]
                )
            ),
        ),
        (
            "array(map(string, array(string)))",
            ArrayType(
                element_type=MapType(
                    key_type=AtomicType(type_="string"),
                    value_type=ArrayType(element_type=AtomicType(type_="string")),
                )
            ),
        ),
        (
            "array(row(array array(string)))",
            ArrayType(
                element_type=RowType(
                    fields=OrderedDict(
                        [("array", ArrayType(element_type=AtomicType("string")))]
                    )
                )
            ),
        ),
        (
            "map(string, array(map(string, string)))",
            MapType(
                key_type=AtomicType(type_="string"),
                value_type=ArrayType(
                    element_type=MapType(
                        key_type=AtomicType(type_="string"),
                        value_type=AtomicType(type_="string"),
                    )
                ),
            ),
        ),
        (
            # select MAP(ARRAY[ARRAY['foo'], ARRAY['bar']], ARRAY[CAST(ROW(1, 2.0) AS ROW(x BIGINT, y DOUBLE)), CAST(ROW(3, 4.0) AS ROW(x BIGINT, y DOUBLE))])
            "map(array(string), row(x bigint, y double))",
            MapType(
                key_type=ArrayType(element_type=AtomicType(type_="string")),
                value_type=RowType(
                    fields=OrderedDict(
                        [
                            (
                                "x",
                                AtomicType(type_="bigint"),
                            ),
                            (
                                "y",
                                AtomicType(type_="double"),
                            ),
                        ]
                    )
                ),
            ),
        ),
        (
            "map(string, row(map map(string, string)))",
            MapType(
                key_type=AtomicType(type_="string"),
                value_type=RowType(
                    fields=OrderedDict(
                        [
                            (
                                "map",
                                MapType(
                                    key_type=AtomicType(type_="string"),
                                    value_type=AtomicType(type_="string"),
                                ),
                            )
                        ]
                    )
                ),
            ),
        ),
    ],
)
def test_parse_from_string(string_definition: str, exp_type: PrestoType) -> None:
    assert PrestoType.from_string(string_definition) == exp_type


@pytest.mark.parametrize(
    "presto_type, data, exp_formatted_data",
    [
        (AtomicType(type_="integer"), 1, 1),
        (
            ArrayType(element_type=AtomicType(type_="string")),
            ["a", "b", "c"],
            ["a", "b", "c"],
        ),
        (
            ArrayType(
                element_type=MapType(
                    key_type=AtomicType(type_="string"),
                    value_type=AtomicType(type_="integer"),
                )
            ),
            [{"a": 111, "b": 222}, {"c": 333}],
            [{"a": 111, "b": 222}, {"c": 333}],
        ),
        (
            ArrayType(
                element_type=RowType(
                    fields=OrderedDict([("id", AtomicType(type_="integer"))])
                )
            ),
            [(123,), (456,)],
            [{"id": 123}, {"id": 456}],
        ),
        (
            MapType(
                key_type=AtomicType(type_="string"),
                value_type=AtomicType(type_="integer"),
            ),
            {"a": 111, "b": 222},
            {"a": 111, "b": 222},
        ),
        (
            MapType(
                key_type=AtomicType(type_="string"),
                value_type=ArrayType(element_type=AtomicType(type_="integer")),
            ),
            {"a": [1, 2, 3]},
            {"a": [1, 2, 3]},
        ),
        (
            MapType(
                key_type=AtomicType(type_="string"),
                value_type=RowType(
                    fields=OrderedDict([("id", AtomicType(type_="integer"))])
                ),
            ),
            {"a": (123,)},
            {"a": {"id": 123}},
        ),
        (
            RowType(fields=OrderedDict([("id", AtomicType(type_="integer"))])),
            (123,),
            {"id": 123},
        ),
        (
            RowType(
                fields=OrderedDict(
                    [("arr", ArrayType(element_type=AtomicType(type_="integer")))]
                )
            ),
            ([1, 2, 3],),
            {"arr": [1, 2, 3]},
        ),
        (
            RowType(
                fields=OrderedDict(
                    [
                        (
                            "map",
                            MapType(
                                key_type=AtomicType(type_="string"),
                                value_type=AtomicType(type_="integer"),
                            ),
                        )
                    ]
                )
            ),
            ({"a": 111, "b": 222},),
            {"map": {"a": 111, "b": 222}},
        ),
        (
            # select MAP(ARRAY[ARRAY['foo' ], ARRAY['bar']], ARRAY[CAST(ROW(1, 2.0) AS ROW(x BIGINT, y DOUBLE)), CAST(ROW(3, 4.0) AS ROW(x BIGINT, y DOUBLE))])
            MapType(
                key_type=ArrayType(element_type=AtomicType(type_="string")),
                value_type=RowType(
                    fields=OrderedDict(
                        [
                            (
                                "x",
                                AtomicType(type_="bigint"),
                            ),
                            (
                                "y",
                                AtomicType(type_="double"),
                            ),
                        ]
                    )
                ),
            ),
            {"[foo]": [1, 2.0], "[bar]": [3, 4.0]},
            {"[foo]": {"x": 1, "y": 2.0}, "[bar]": {"x": 3, "y": 4.0}},
        ),
    ],
)
def test_format_data(
    presto_type: PrestoType, data: Any, exp_formatted_data: Any
) -> None:
    assert presto_type.format_data(data) == exp_formatted_data


@pytest.mark.parametrize(
    "text, delimiter, exp_result, exp_ok, exp_error",
    [
        ("a,b,c", ",", ["a", "b", "c"], True, None),
        ("a b c", " ", ["a", "b", "c"], True, None),
        ("a, b, c(a, b, c), d", ",", ["a", " b", " c(a, b, c)", " d"], True, None),
        ("a((), b", ",", None, False, ValueError),
        ("a && b && c", "&&", None, False, ValueError),
    ],
)
def test_bracket_aware_split(
    text: str,
    delimiter: str,
    exp_result: Optional[List[str]],
    exp_ok: bool,
    exp_error: Optional[Type[Exception]],
) -> None:
    try:
        assert _bracket_aware_split(value=text, delimiter=delimiter) == exp_result
    except Exception as e:
        if not exp_ok:
            assert type(e) == exp_error  # checking exact error type
        else:
            raise e
