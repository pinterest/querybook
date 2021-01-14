import enum

# Keep this the samee as impression_items.py


class ImpressionItemType(enum.Enum):
    DATA_DOC = 0
    DATA_TABLE = 1


# the max date range of impression to account for in DAYS
# TODO: generalize for different scenarios, maybe move to
# environment variable?
IMPRESSION_RETENTION_DELTA = 60
