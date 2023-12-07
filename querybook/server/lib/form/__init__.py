from multiprocessing.dummy import Array
import re
from abc import ABCMeta, abstractmethod
from typing import Dict, Union
from enum import Enum


class FormFieldType(Enum):
    String = "string"
    Boolean = "boolean"
    Number = "number"
    Select = "select"


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
        options: Array = None,
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
        self.options = options

    def to_dict(self):
        return {
            "required": self.required,
            "description": self.description,
            "regex": self.regex,
            "helper": self.helper,
            "hidden": self.hidden,
            "field_type": self.field_type.value,
            "options": self.options,
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
    def __init__(
        self,
        *fields: list[tuple[str, "AllFormField"]],
        # deprecated do not use
        **kwargs: Dict[str, "AllFormField"]
    ):
        self.fields = list(fields) + list(kwargs.items())

    def to_dict(self):
        return {
            "field_type": CompositeFormFieldType.Struct.value,
            "fields": [(field[0], field[1].to_dict()) for field in self.fields],
        }

    @property
    def dict_fields(self):
        return dict(self.fields)


AllFormField = Union[FormField, ExpandableFormField, StructFormField]


def validate_form(form: AllFormField, form_value) -> tuple[bool, str]:
    """Checks if the form is valid

    Arguments:
        form {AllFormField} -- The form structure
        form_value {Any} -- The corresponding form value

    Returns:
        [bool, str] -- True if valid otherwise False, and the reason why it's invalid
    """
    if isinstance(form, StructFormField):
        if not isinstance(form_value, dict):
            return False, "Field value is not a dictionary"

        for key, subform in form.fields:
            valid, reason = validate_form(subform, form_value.get(key, None))
            if not valid:
                return valid, reason
        return True, ""
    elif isinstance(form, ExpandableFormField):
        if not isinstance(form_value, list):
            return False, "Field value is not an array"
        if form.min is not None and len(form_value) < form.min:
            return False, "Field value less than allowed length"
        if form.max is not None and len(form_value) > form.max:
            return False, "Field value more than allowed length"
        for child_form_value in form_value:
            valid, reason = validate_form(form.of, child_form_value)
            if not valid:
                return valid, reason
        return True, ""

    elif isinstance(form, FormField):
        if form_value is None:
            if form.required:
                return False, "Required field is missing"
            return True, ""

        if form.field_type == FormFieldType.String:
            if not isinstance(form_value, str):
                return False, "Field value is not a string"
            if form.regex is not None:
                if not re.match(form.regex, form_value):
                    return False, "Field value does not match regex"
            return True, ""
        elif form.field_type == FormFieldType.Number:
            if not isinstance(form_value, (int, float)):
                return False, "Field value is not a number"
            return True, ""
        elif form.field_type == FormFieldType.Boolean:
            if not isinstance(form_value, bool):
                return False, "Field value is not a boolean"
            return True, ""
    return False, "Unexpected form type"
