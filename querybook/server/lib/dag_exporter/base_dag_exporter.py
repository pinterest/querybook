from abc import ABCMeta, abstractmethod


class BaseDAGExporter(metaclass=ABCMeta):
    @property
    @abstractmethod
    def dag_exporter_name(self) -> str:
        """Name of the dag exporter that will be shown on the frontend"""
        raise NotImplementedError()

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
            "meta": self.dag_exporter_meta,
        }
