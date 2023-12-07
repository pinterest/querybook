from app.datasource import register


@register("/api_plugin/test/")
def demo_api_plugin():
    """This is a test API to demo how to add a new API endpoint.
    For overridding an existing API endpoint, please use the same path but different function name.
    """
    return "This is a response from the API plugin!"
