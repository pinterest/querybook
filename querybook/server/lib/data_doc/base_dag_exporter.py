from abc import ABCMeta, abstractmethod


class BaseDAGExporter(metaclass=ABCMeta):
    @property
    @abstractmethod
    def dag_exporter_name(self) -> str:
        """Name of the dag exporter that will be shown on the frontend"""
        raise NotImplementedError()

    @property
    @abstractmethod
    def dag_exporter_type(self) -> str:
        # Can be one of 'url' | 'text' | 'none'
        # Url exports returns a url for user to open
        # Text exports opens up a copy paste modal for user to copy
        # None returns nothing since the result is exported without anything to track
        raise NotImplementedError()

    # TODO: update documentation
    @property
    @abstractmethod
    def dag_exporter_meta(self):
        """
        Plug-in specific options for exporting

        Returns Dict
        """
        raise NotImplementedError()

    @abstractmethod
    def export(self, nodes, edges, meta):
        """
        This function exports the dag graph.

        Arguments:
            nodes: dag nodes
            edges: dag edges
            meta: plug-in specific form options and values
        """
        raise NotImplementedError()

    def to_dict(self):
        return {
            "name": self.dag_exporter_name,
            "meta": self.dag_exporter_meta,
            "type": self.dag_exporter_type,
        }
