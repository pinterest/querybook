from typing import List, Tuple
from lib.query_analysis.validation.base_query_validator import (
    BaseQueryValidator,
    QueryValidationResult,
    QueryValidationSeverity,
)
import difflib
from dataclasses import dataclass, asdict
from sqlglot import exp, parse_one, expressions


@dataclass
class DiffOpcode:
    tag: str  # one of replace, delete, insert, equal
    #  Would use an enum, but it's hard to make into a string with asdict()
    #  Python 3.11's StrEnum will fix this
    a_start: int
    a_end: int
    b_start: int
    b_end: int


@dataclass
class Diff:
    a: str  # The original string
    b: str  #  The new string
    opcodes: List[
        DiffOpcode
    ]  # The list of operations to turn a into b, in the opcode format of difflib.SequenceMatcher


class BaseOptimization:
    pass


class ApplyTableSampleOptimization(BaseOptimization):
    # TODO: do not rapply if already applied
    sample_percent: int = 10

    def optimize(self, query: str) -> str:
        def transformer(node):
            if isinstance(node, exp.Table):
                t = expressions.TableSample()
                t.args["method"] = "SYSTEM"
                t.args["size"] = str(self.sample_percent)
                t.args["kind"] = "TABLESAMPLE"
                t.args["this"] = node
                node = t
                return node
            else:
                return node

        expression_tree = parse_one(query)
        transformed_tree = expression_tree.transform(transformer)
        return transformed_tree.sql()


class RemoveTableSampleOptimization(BaseOptimization):
    def optimize(self, query: str) -> str:
        def transformer(node):
            if isinstance(node, exp.TableSample):
                return node.args["this"]
            else:
                return node

        expression_tree = parse_one(query)
        transformed_tree = expression_tree.transform(transformer)
        return transformed_tree.sql()


class OptimizingValidator(BaseQueryValidator):
    optimizers: List[BaseOptimization] = [ApplyTableSampleOptimization()]

    def languages(self):
        return ["presto", "trino", "sqlite"]

    def validate(
        self,
        query: str,
        uid: int,  # who is doing the syntax check
        engine_id: int,  # which engine they are checking against
    ) -> List[QueryValidationResult]:
        # TODO: different validators depending on engine
        validation_errors = []

        new_query = query
        for o in self.optimizers:
            new_query = o.optimize(query)

        cruncher = difflib.SequenceMatcher(isjunk=None, a=query, b=new_query)

        #  The output format of SequenceMatcher is an unnamed tuple, so make it legible
        #  https://github.com/python/cpython/blob/3.11/Lib/difflib.py#L495
        diff = Diff(
            a=query,
            b=new_query,
            opcodes=[DiffOpcode(*i) for i in cruncher.get_opcodes()],
        )
        validation_errors = [
            QueryValidationResult(
                0,
                0,
                QueryValidationSeverity.ERROR,  # TODO: Should there be a new type in QueryValidationResultObjectType for optmization suggestions/diffs?
                "A WILD ERROR APPEARS!",
                diff=asdict(diff),
            )
        ]
        return validation_errors
