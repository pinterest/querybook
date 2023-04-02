from lib.stats_logger.base_stats_logger import BaseStatsLogger


class NullStatsLogger(BaseStatsLogger):
    """A stats logger which does nothing."""

    @property
    def logger_name(self) -> str:
        return "null"

    def incr(self, key: str, tags: dict[str, str] = None) -> None:
        pass

    def decr(self, key: str, tags: dict[str, str] = None) -> None:
        pass

    def timing(self, key: str, value: float, tags: dict[str, str] = None) -> None:
        pass

    def gauge(self, key: str, value: float, tags: dict[str, str] = None) -> None:
        pass
