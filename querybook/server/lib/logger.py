import logging
import sys
from env import QuerybookSettings


def get_logger(module):
    log_format = '[%(asctime)s] - %(name)s - %(levelname)-8s"%(message)s"'
    date_format = "%Y-%m-%d %a %H:%M:%S"
    log = logging.getLogger(module)

    try:
        formatter = logging.Formatter(fmt=log_format, datefmt=date_format)

        log_stream_handler = logging.StreamHandler(sys.stderr)
        log_stream_handler.setFormatter(formatter)
        log.addHandler(log_stream_handler)

        if QuerybookSettings.LOG_LOCATION is not None:
            log_file_handler = logging.FileHandler(QuerybookSettings.LOG_LOCATION)
            log_file_handler.setFormatter(formatter)
            log.addHandler(log_file_handler)
    except IOError:
        print("{} not found".format(QuerybookSettings.LOG_LOCATION))
    finally:
        # Avoid debug logs in production
        log.setLevel(logging.INFO if QuerybookSettings.PRODUCTION else logging.DEBUG)
        return log
