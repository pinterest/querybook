from lib.stats_logger.base_stats_logger import BaseStatsLogger
from datadog import initialize, statsd
from env import QuerybookSettings
from lib.logger import get_logger

LOG = get_logger(__file__)


class DatadogStatsLogger(BaseStatsLogger):
    metric_prefix = ""
    dd_tags = []

    def metric_prefix_helper(self, key):
        return self.metric_prefix + "." + key

    def tag_helper(self, tags):
        if tags:
            return [f"{k}:{v}" for k, v in tags.items()]
        return []

    def initialize(self):
        if QuerybookSettings.DD_AGENT_HOST and QuerybookSettings.DD_DOGSTATSD_PORT:
            LOG.info("Initializing Datadog")

            self.dd_tags = (
                QuerybookSettings.DD_TAGS.split(",")
                if QuerybookSettings.DD_TAGS
                else []
            )
            self.metric_prefix = (
                QuerybookSettings.DD_PREFIX or QuerybookSettings.DD_SERVICE
            )

            options = {
                "statsd_host": QuerybookSettings.DD_AGENT_HOST,
                "statsd_port": QuerybookSettings.DD_DOGSTATSD_PORT,
                "statsd_constant_tags": self.dd_tags,
            }

            initialize(**options)
        else:
            LOG.info("Datadog environment variables are not set")

    @property
    def logger_name(self) -> str:
        return "datadog"

    def incr(self, key: str, tags: dict[str, str] = None) -> None:
        statsd.increment(
            self.metric_prefix_helper(key),
            1,
            tags=self.tag_helper(tags),
        )

    def decr(self, key: str, tags: dict[str, str] = None) -> None:
        statsd.decrement(
            self.metric_prefix_helper(key),
            1,
            tags=self.tag_helper(tags),
        )

    def timing(self, key: str, value: float, tags: dict[str, str] = None) -> None:
        statsd.histogram(
            self.metric_prefix_helper(key), value, tags=self.tag_helper(tags)
        )

    def gauge(self, key: str, value: float, tags: dict[str, str] = None) -> None:
        statsd.gauge(self.metric_prefix_helper(key), value, tags=self.tag_helper(tags))
