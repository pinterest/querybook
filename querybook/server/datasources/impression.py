from app.datasource import register
from logic import impression as logic


@register("/impression/<item_type>/<item_id>/count/", methods=["GET"])
def get_impression_item_impression_count(item_type, item_id):
    return logic.get_viewers_count_by_item_after_date(
        item_type, item_id, logic.get_last_impressions_date()
    )


@register("/impression/<item_type>/<item_id>/timeseries/", methods=["GET"])
def get_impression_item_impression_timeseries(item_type, item_id):
    return logic.get_item_timeseries_after_date(
        item_type, item_id, logic.get_last_impressions_date()
    )


@register("/impression/<item_type>/<item_id>/users/", methods=["GET"])
def get_impression_item_impression_users(item_type, item_id):
    return logic.get_viewers_by_item_after_date(
        item_type, item_id, logic.get_last_impressions_date()
    )
