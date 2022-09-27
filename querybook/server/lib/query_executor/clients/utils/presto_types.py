import re
from abc import ABC, abstractmethod
from collections import Counter, OrderedDict
from dataclasses import dataclass
from typing import Any, ClassVar, Dict, List, Optional


def rename_duplicate_names(names: List[str]) -> List[str]:
    duplicates: Dict[str, List[int]] = {
        name: list(reversed(range(1, count + 1)))
        for name, count in Counter(names).items()
        if count > 1
    }

    renamed_names = []
    for column in names:
        if column in duplicates:
            renamed_names.append(f"{column}_{duplicates[column].pop()}")
        else:
            renamed_names.append(column)
    return renamed_names


class PrestoType(ABC):
    @staticmethod
    @abstractmethod
    def from_string(value: str) -> "PrestoType":
        for type_ in [RowType, ArrayType, MapType]:
            if re.match(type_.REGEX, value):
                return type_.from_string(value)
        return AtomicType.from_string(value)

    @abstractmethod
    def format_data(self, data):
        pass


@dataclass
class RowType(PrestoType):
    fields: OrderedDict[str, PrestoType]

    REGEX: ClassVar[str] = r"\s*row\((?P<subfields>.*)\)\s*"

    @classmethod
    def from_string(cls, value: str) -> "RowType":
        if row_match := re.match(cls.REGEX, value):
            subfields = row_match.group("subfields")
        else:
            raise ValueError(f"Failed to parse row value: {value}")

        fields = [
            (name, PrestoType.from_string(" ".join(type_)))
            for name, *type_ in [  # Presto supports multi-word types like 'timestamp with time zone'
                _bracket_aware_split(field.strip(), " ")
                for field in _bracket_aware_split(subfields, ",")
            ]
        ]
        return RowType(
            OrderedDict(
                zip(
                    rename_duplicate_names(  # Cannot store duplicated keys in OrderedDict
                        [field[0] for field in fields]
                    ),
                    [field[1] for field in fields],
                )
            )
        )

    def format_data(self, data: Optional[List]) -> Optional[Dict]:
        if data is None:
            return data

        return {
            name: type_.format_data(dat)
            for (name, type_), dat in zip(self.fields.items(), data)
        }


@dataclass
class ArrayType(PrestoType):
    element_type: PrestoType

    REGEX: ClassVar[str] = r"\s*array\((?P<element_type>.*)\)\s*"

    @classmethod
    def from_string(cls, value: str) -> "ArrayType":
        if row_match := re.match(cls.REGEX, value):
            return ArrayType(PrestoType.from_string(row_match.group("element_type")))
        else:
            raise ValueError(f"Failed to parse array value: {value}")

    def format_data(self, data: Optional[List]) -> Optional[List]:
        if data is None:
            return data
        return list(map(self.element_type.format_data, data))


@dataclass
class MapType(PrestoType):
    key_type: PrestoType
    value_type: PrestoType

    REGEX: ClassVar[str] = r"\s*map\((?P<key_value_types>.*)\)\s*"

    @classmethod
    def from_string(cls, value: str) -> "MapType":
        if row_match := re.match(cls.REGEX, value):
            key, val = _bracket_aware_split(row_match.group("key_value_types"), ",")
            return MapType(
                PrestoType.from_string(key.strip()), PrestoType.from_string(val.strip())
            )
        else:
            raise ValueError(f"Failed to parse map value: {value}")

    def format_data(self, data: Optional[Dict]) -> Optional[Dict]:
        if data is None:
            return data
        return {k: self.value_type.format_data(v) for k, v in data.items()}


@dataclass
class AtomicType(PrestoType):
    type_: str

    @classmethod
    def from_string(cls, value: str) -> "AtomicType":
        return AtomicType(value.strip())

    def format_data(self, data: Any) -> Any:
        return data


def _bracket_aware_split(value: str, delimiter: str) -> List[str]:
    if len(delimiter) != 1:
        raise ValueError("Only works for single-character delimiters")

    result = []
    brackets = 0
    buffer = []

    for c in value + delimiter:
        if c == delimiter and brackets == 0:
            result.append("".join(buffer))
            buffer = []
        else:
            if c == "(":
                brackets += 1
            elif c == ")":
                brackets -= 1
            buffer.append(c)

    if brackets:
        raise ValueError(f"Brackets aren't balanced in the provided value: {value}")

    return result
