from unittest import TestCase

from lib.celery.cron import validate_cron


class ValidateCronTestCase(TestCase):
    def test_valid_expressions(self):
        for expression in [
            "* * * * *",
            "0 0 * * *",
            "*/5 * * * *",
            "0 22 * * 1-5",
            "0 0 29 2 *",  # leap-year Feb 29 stays valid
            "0 0 30 2,3 *",  # March saves the impossible Feb 30
            "0 0 31 * *",  # some month has a 31st
        ]:
            self.assertTrue(validate_cron(expression), f"expected valid: {expression}")

    def test_impossible_dates_are_invalid(self):
        for expression in [
            "0 0 30 2 *",  # Feb 30
            "0 0 31 2 *",  # Feb 31
            "0 0 31 4 *",  # Apr 31
            "0 0 31 6 *",  # Jun 31
            "0 0 31 9 *",  # Sep 31
            "0 0 31 11 *",  # Nov 31
            "0 0 30 2 1",  # never fires even with a weekday set
        ]:
            self.assertFalse(
                validate_cron(expression), f"expected invalid: {expression}"
            )

    def test_malformed_expressions_are_invalid(self):
        for expression in [
            "not a cron",
            "* * * *",  # only 4 fields
            "* * * * * *",  # 6 fields
            "0 0 * * 8",  # day-of-week out of range
            "70 0 * * *",  # minute out of range
            "0 25 * * *",  # hour out of range
            "0 0 0 * *",  # day-of-month below range
            "0 0 * 13 *",  # month out of range
        ]:
            self.assertFalse(
                validate_cron(expression), f"expected invalid: {expression}"
            )

    def test_non_string_input_is_invalid(self):
        self.assertFalse(validate_cron(None))
        self.assertFalse(validate_cron(12345))
        self.assertFalse(validate_cron(["0", "0", "*", "*", "*"]))
