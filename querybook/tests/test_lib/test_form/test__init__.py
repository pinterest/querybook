from unittest import TestCase
from lib.form import (
    validate_form,
    FormField,
    ExpandableFormField,
    StructFormField,
    FormFieldType,
)


class ValidateFormTestCase(TestCase):
    def test_null_field(self):
        # Code coverage test cases

        # Null case test
        self.assertEqual(
            validate_form(FormField(required=True), None),
            (False, "Required field is missing"),
        )
        self.assertEqual(validate_form(FormField(), None), (True, ""))

    def test_unknown_field(self):
        self.assertEqual(validate_form(None, None), (False, "Unexpected form type"))

    def test_string_field(self):
        # String Tests
        self.assertEqual(
            validate_form(FormField(), 123), (False, "Field value is not a string")
        )
        self.assertEqual(validate_form(FormField(), "123"), (True, ""))

        self.assertEqual(
            validate_form(FormField(regex="^[a-z]+$"), "querybook2"),
            (False, "Field value does not match regex"),
        )
        self.assertEqual(
            validate_form(FormField(regex="^[a-z]+$"), "querybook"), (True, "")
        )

    def test_number_field(self):
        self.assertEqual(
            validate_form(FormField(field_type=FormFieldType.Number), "123"),
            (False, "Field value is not a number"),
        )
        self.assertEqual(
            validate_form(FormField(field_type=FormFieldType.Number), 123), (True, "")
        )
        self.assertEqual(
            validate_form(FormField(field_type=FormFieldType.Number), 123.123),
            (True, ""),
        )

    def test_bool_field(self):
        self.assertEqual(
            validate_form(FormField(field_type=FormFieldType.Boolean), "123"),
            (False, "Field value is not a boolean"),
        )
        self.assertEqual(
            validate_form(FormField(field_type=FormFieldType.Boolean), 123),
            (False, "Field value is not a boolean"),
        )
        self.assertEqual(
            validate_form(FormField(field_type=FormFieldType.Boolean), True), (True, "")
        )

    def test_array_field(self):
        form = ExpandableFormField(of=FormField(), min=2, max=4)
        self.assertEqual(
            validate_form(form, "123"),
            (False, "Field value is not an array"),
        )
        self.assertEqual(
            validate_form(form, ["123"]),
            (False, "Field value less than allowed length"),
        )
        self.assertEqual(
            validate_form(form, ["123"] * 5),
            (False, "Field value more than allowed length"),
        )
        self.assertEqual(
            validate_form(form, ["123", "123", 123]),
            (False, "Field value is not a string"),
        )
        self.assertEqual(validate_form(form, ["123", "456", "789"]), (True, ""))

    def test_dict_field(self):
        form = StructFormField(
            ("name", FormField()),
            ("phone_numbers", ExpandableFormField(of=FormField(), min=1, max=2)),
        )
        self.assertEqual(
            validate_form(form, "123"),
            (False, "Field value is not a dictionary"),
        )
        self.assertEqual(
            validate_form(form, {"phone_numbers": [1234], "name": "bob"}),
            (False, "Field value is not a string"),
        )
        self.assertEqual(
            validate_form(form, {"phone_numbers": ["1234"] * 3, "name": "bob"}),
            (False, "Field value more than allowed length"),
        )
        self.assertEqual(
            validate_form(form, {"phone_numbers": ["1234"], "name": "bob"}),
            (True, ""),
        )
        self.assertEqual(
            validate_form(
                form,
                {
                    "phone_numbers": ["1234"],
                },
            ),
            (True, ""),
        )
