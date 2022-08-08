from sqlalchemy import String as _String
from sqlalchemy.sql.expression import BinaryExpression, literal
from sqlalchemy.sql.operators import custom_op
from env import QuerybookSettings
from sqlalchemy.engine.url import make_url

__all__ = ["RegexString"]


class RegexString(_String):
    """Enchanced version of standard SQLAlchemy's :class:`String`.
    Supports additional operators that can be used while constructing
    filter expressions.
    """

    class comparator_factory(_String.comparator_factory):
        """Contains implementation of :class:`String` operators
        related to regular expressions.
        """

        def regexp(self, other):
            url = make_url(QuerybookSettings.DATABASE_CONN)
            dialect_name = url.get_dialect().name
            db_custop_operator = "REGEXP" if dialect_name == "mysql" else "~"
            return BinaryExpression(
                self.expr, literal(other), custom_op(db_custop_operator)
            )
