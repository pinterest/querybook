from abc import ABCMeta, abstractmethod
from typing import Dict, Union
from enum import Enum


class FormFieldType(Enum):
    String = "string"
    Boolean = "boolean"
    Number = "number"


class CompositeFormFieldType(Enum):
    # expandable key value pair
    # Just commenting this one out since
    # it is almost the same as List[string, Field]
    # Dict = 'dict'

    # expandable list
    List = "list"

    # Fixed key dictionary
    Struct = "struct"


class AbstractFormField(metaclass=ABCMeta):
    @abstractmethod
    def to_dict(self):
        pass


class FormField(AbstractFormField):
    def __init__(
        self,
        field_type: FormFieldType = FormFieldType.String,
        required: bool = False,
        description: str = "",
        helper: str = "",
        # These two only applies to string field
        regex: str = None,
        hidden: bool = False,
    ):
        """Initialize the form field
        Keyword Arguments:
            field_type {FormFieldType} -- can be string, boolean, number, defaults to String
            required {bool} -- [If true, the field input cannot be empty] (default: {False})
            description {str} -- [Input's placeholder] (default: {None})
            helper {str} -- [Additional helper info that would show on toggle] (default: {None})

            These are only applicable if field_type is string
            hidden {bool} -- [field type is password if hidden is set to true] (default: {False})
            regex {str} -- [If supplied, field's string input must match regex] (default: {None})

        """
        self.required = required
        self.description = description
        self.regex = regex
        self.helper = helper
        self.hidden = hidden
        self.field_type = field_type

    def to_dict(self):
        return {
            "required": self.required,
            "description": self.description,
            "regex": self.regex,
            "helper": self.helper,
            "hidden": self.hidden,
            "field_type": self.field_type.value,
        }


class ExpandableFormField(AbstractFormField):
    def __init__(self, of: "AllFormField", min: int = None, max: int = None):
        self.of = of
        self.min = min
        self.max = max

    def to_dict(self):
        return {
            "field_type": CompositeFormFieldType.List.value,
            "of": self.of.to_dict(),
            "min": self.min,
            "max": self.max,
        }


class StructFormField(AbstractFormField):
    def __init__(self, **kwargs: Dict[str, "AllFormField"]):
        self.kwargs = kwargs

    def to_dict(self):
        return {
            "field_type": CompositeFormFieldType.Struct.value,
            "fields": {key: value.to_dict() for key, value in self.kwargs.items()},
        }


AllFormField = Union[FormField, ExpandableFormField, StructFormField]
