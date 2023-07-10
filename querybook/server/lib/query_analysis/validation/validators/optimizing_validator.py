from typing import List, Tuple, Callable, Optional
from lib.query_analysis.validation.base_query_validator import (
    BaseQueryValidator,
    QueryValidationResult,
    QueryValidationSeverity,
    QueryValidationResultObjectType,
    QueryDiff,
    DiffOpcode,
)
from sqlglot import exp, parse_one, expressions
import re
import difflib
from lib.logger import get_logger
import abc

LOG = get_logger(__file__)


class SqlglotTransformer(metaclass=abc.ABCMeta):
    @property
    @abc.abstractmethod  # This is the way to define an abstract attribute
    def message(self):
        pass

    @staticmethod
    def recursive_transform(
        expression: expressions.Expression,
        transformer: Callable[[expressions.Expression], expressions.Expression],
    ) -> expressions.Expression:
        """
        Apply the transform until the expression no longer changes
        """
        old_expression = expression.copy()
        while True:
            expression = expression.transform(transformer)
            if old_expression == expression:
                break
            old_expression = expression.copy()
        return expression

    @staticmethod
    def opcodes_to_lines(
        opcodes: List[Tuple], original_string: str
    ) -> Tuple[Tuple[int, int]]:
        """
        Determine in the original which line and character in the line
        each opcode starts
        """
        newline_positions = (
            [0]
            + [i for i, c in enumerate(original_string) if c == "\n"]
            + [
                len(original_string) + 1,
            ]
        )

        results = []

        for o in opcodes:
            i1_line = [i for i, l in enumerate(newline_positions) if o[1] < l][0] - 1
            i1_chr = o[1] - newline_positions[i1_line]
            results.append(((i1_line, i1_chr)))

        return results

    @abc.abstractmethod
    def transform(self, query: expressions.Expression) -> expressions.Expression:
        pass

    def __call__(self, query: str) -> Optional[QueryValidationResult]:
        expression_tree = parse_one(query)
        if query != expression_tree.sql():
            LOG.warning("Cannot optimize query because it is not well-formatted.")
            return None

        new_query = self.recursive_transform(expression_tree, self.transform).sql()

        opcodes = difflib.SequenceMatcher(
            isjunk=None, a=query, b=new_query
        ).get_opcodes()
        if (
            re.sub("\s", "", query).lower() == re.sub("\s", "", new_query).lower()
        ):  # No changes were made
            return None
        diff = QueryDiff(
            a=query,
            b=new_query,
            opcodes=[DiffOpcode(*i) for i in opcodes],
        )

        opcode_lines = self.opcodes_to_lines(opcodes=opcodes, original_string=query)

        return QueryValidationResult(
            line=opcode_lines[0][0],
            ch=opcode_lines[0][1],
            severity=QueryValidationSeverity.WARNING,
            message=self.message,
            obj_type=QueryValidationResultObjectType.OPTIMIZATION,
            diff=diff,
        )


class UnionAllSqlglotTransformer(SqlglotTransformer):
    message = "Combining multiple LIKEs into one REGEXP_LIKE will execute faster"

    def transform(self, node):
        """
        UNION -> UNION ALL
        """
        if isinstance(node, exp.Union):
            node.args["distinct"] = False
            return node
        else:
            return node


class RegexplikeSqlglotTransformer(SqlglotTransformer):
    message = "Combining multiple LIKEs into one REGEXP_LIKE will execute faster"

    def transform(self, node):
        """
        a LIKE 'b' OR a LIKE 'c' -> REGEXP_LIKE(a, 'b|c')
        """

        if not isinstance(node, exp.Or):
            return node

        left, right = node.args["this"], node.args["expression"]

        if not (
            (isinstance(left, exp.Like) or isinstance(left, exp.RegexpLike))
            and (
                isinstance(right, exp.Like) or isinstance(right, exp.RegexpLike)
            )  # composition of LIKE or REGEXP_LIKE expressions
            and (left.this == right.this)  # Operating on the same column
            and (
                right.expression.args["is_string"] == True
                and left.expression.args["is_string"] == True
            )  # Comparing to a string
        ):
            return node

        op = "|"

        return exp.RegexpLike(
            this=left.this,
            expression=exp.Literal(
                this=left.expression.this + op + right.expression.this, is_string=True
            ),
            comment=node.comment if hasattr(node, "comment") else None,
        )


class ApproxDistinctSqlglotTransformer(SqlglotTransformer):
    message = "APPROX_DISTINCT can execute much faster than COUNT(DISTINCT ...), if you don't need an exact result"

    def transform(self, node):
        """
        COUNT(DISTINCT x) -> APPROX_DISTINCT(X)
        """

        def _remove_distinct(node):
            if isinstance(node, exp.Distinct):
                return node.args["expressions"]
            else:
                return node

        if isinstance(node, exp.Count) and isinstance(
            node.args.get("this"), exp.Distinct
        ):
            new_args = node.args
            new_args["this"] = new_args["this"].transform(_remove_distinct)
            return node.replace(exp.ApproxDistinct(**new_args))
        else:
            return node


TRANSFORMERS = (
    UnionAllSqlglotTransformer,
    RegexplikeSqlglotTransformer,
    ApproxDistinctSqlglotTransformer,
)


class OptimizingValidator(BaseQueryValidator):
    def languages(self):
        return ["presto", "trino", "sqlite"]

    def validate(
        self,
        query: str,
        uid: int,  # who is doing the syntax check
        engine_id: int,  # which engine they are checking against
    ) -> List[QueryValidationResult]:
        results = []

        results = [transformer()(query=query) for transformer in TRANSFORMERS]
        results = [x for x in results if x is not None]
        return results
