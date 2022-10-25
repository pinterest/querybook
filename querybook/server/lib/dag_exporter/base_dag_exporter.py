from abc import ABCMeta, abstractmethod
from logic.admin import get_query_engines_by_ids
from models.datadoc import DataCell


class BaseDAGExporter(metaclass=ABCMeta):
    @property
    @abstractmethod
    def dag_exporter_name(self) -> str:
        """Name of the dag exporter that will be shown on the frontend"""
        raise NotImplementedError()

    @property
    @abstractmethod
    def dag_exporter_engines(self) -> list[int]:
        """Supprted engine ids of the dag exporter"""
        raise NotImplementedError()

    @property
    def dag_exporter_engine_names(self) -> list[str]:
        """Get the supported engine names"""
        query_engines = get_query_engines_by_ids(self.dag_exporter_engines)
        return [engine.name for engine in query_engines]

    # TODO: update documentation
    @property
    @abstractmethod
    def dag_exporter_meta(self):
        """
        Plug-in specific options for exporting.
        Must use one of AllFormField classes

        Returns Dict
        """
        raise NotImplementedError()

    def is_engine_supported(self, query_cell: DataCell) -> bool:
        """Helper function to validate if a query cell's engine is supported"""
        engine_id = query_cell.meta.get("engine")
        return engine_id in self.dag_exporter_engines

    @abstractmethod
    def export(self, nodes, edges, meta, cell_by_id):
        """
        This function exports the dag graph.

        Arguments:
            nodes: dag nodes
            edges: dag edges
            meta: plug-in specific form options and values
            cell_by_id: Dict of query cell data by cell id

        Returns Dict {
            data: (string) Markdown string
        }
        """
        raise NotImplementedError()

    def to_dict(self):
        return {
            "name": self.dag_exporter_name,
            "engines": self.dag_exporter_engines,
            "meta": self.dag_exporter_meta,
        }
