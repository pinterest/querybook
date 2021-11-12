from const.query_execution import QueryExecutionErrorType
from lib.query_executor.base_executor import QueryExecutorBaseClass
from lib.query_executor.clients.salesforce_cdp import SalesforceCdpClient
from lib.query_executor.executor_template.templates import salesforce_cdp_template


class SalesforceCdpExecutor(QueryExecutorBaseClass):
    @classmethod
    def EXECUTOR_NAME(cls):
        return "Salesforce CDP"

    @classmethod
    def EXECUTOR_LANGUAGE(cls):
        return "Salesforce CDP"

    @classmethod
    def _get_client(cls, client_setting):
        return SalesforceCdpClient(**client_setting)

    @classmethod
    def EXECUTOR_TEMPLATE(cls):
        return salesforce_cdp_template
