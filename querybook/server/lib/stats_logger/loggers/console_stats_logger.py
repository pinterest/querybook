from lib.stats_logger.base_stats_logger import BaseStatsLogger
from lib.logger import get_logger

LOG = get_logger(__file__)

COLOR_YELLOW = "\x1b[33;20m"
COLOR_RESET = "\x1b[0m"


class ConsoleStatsLogger(BaseStatsLogger):
    """Print stats logs to console. This is more for debugging purpose."""

    @property
    def logger_name(self) -> str:
        return "console"

    def incr(self, key: str, tags: dict[str, str] = None) -> None:
        LOG.debug(COLOR_YELLOW + f"[stats_logger] (incr) {key} | {tags}" + COLOR_RESET)

    def decr(self, key: str, tags: dict[str, str] = None) -> None:
        LOG.debug(COLOR_YELLOW + f"[stats_logger] (decr) {key} | {tags}" + COLOR_RESET)

    def timing(self, key: str, value: float, tags: dict[str, str] = None) -> None:
        LOG.debug(
            COLOR_YELLOW
            + f"[stats_logger] (timing) {key} | {value} | {tags}"
            + COLOR_RESET
        )

    def gauge(self, key: str, value: float, tags: dict[str, str] = None) -> None:
        LOG.debug(
            COLOR_YELLOW
            + f"[stats_logger] (gauge) {key} | {value} | {tags}"
            + COLOR_RESET
        )
