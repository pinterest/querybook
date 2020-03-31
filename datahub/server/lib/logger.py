import logging


def get_logger(module):
    logging.basicConfig(
        format='[%(asctime)s] - %(name)s - %(levelname)-8s"%(message)s"',
        datefmt="%Y-%m-%d %a %H:%M:%S",
    )
    log = logging.getLogger(module)
    log.setLevel(logging.INFO)
    return log
