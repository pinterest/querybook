from unittest import TestCase
from lib.query_executor.connection_string.presto import (
    get_presto_connection_conf,
    PrestoConnectionConf,
)


class GetPrestoConnectionConfTestCase(TestCase):
    def test_minimal(self):
        conf = get_presto_connection_conf("presto://foobar.com")
        self.assertEqual(conf.host, "foobar.com")
        self.assertEqual(conf.protocol, "http")

    def test_parts(self):
        conf = get_presto_connection_conf("presto://foobar.com:443/spam")
        self.assertEqual(conf.catalog, "spam")
        conf = get_presto_connection_conf("presto://foobar.com:443/spam/egg")
        self.assertEqual(conf.schema, "egg")

    def test_full(self):
        self.assertEqual(
            get_presto_connection_conf(
                "presto://www.foobar.com:443/spam/egg?hello=world&SSL=true&foo=#bar"
            ),
            PrestoConnectionConf(
                host="www.foobar.com",
                port=443,
                catalog="spam",
                schema="egg",
                protocol="https",
                properties={"hello": "world", "foo": "#bar"},
            ),
        )

    def test_multi_hosts(self):
        conf = get_presto_connection_conf(
            "presto://www.foobar.com:443,www.baz.com:80/spam/egg?SSL=true&foo=bar"
        )
        self.assertIn(
            (conf.host, conf.port), [("www.foobar.com", 443), ("www.baz.com", 80)]
        )
