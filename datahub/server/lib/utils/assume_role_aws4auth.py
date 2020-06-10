from requests_aws4auth import AWS4Auth


class AssumeRoleAWS4Auth(AWS4Auth):
    """
    Subclass of AWS4Auth which accepts botocore credentials as its first argument
    Which allows us to handle assumed role sessions transparently
    Original Author: zen4ever
    Source: https://gist.github.com/zen4ever/5103a4091de28f2f53be2ab8de2ae905
    """

    def __init__(self, credentials, region, service, **kwargs):
        self.credentials = credentials

        frozen_credentials = self.get_credentials()

        super(AssumeRoleAWS4Auth, self).__init__(
            frozen_credentials.access_key,
            frozen_credentials.secret_key,
            region,
            service,
            session_token=frozen_credentials.token,
            **kwargs
        )

    def get_credentials(self):
        if hasattr(self.credentials, "get_frozen_credentials"):
            return self.credentials.get_frozen_credentials()
        return self.credentials

    def __call__(self, req):
        if (
            hasattr(self.credentials, "refresh_needed")
            and self.credentials.refresh_needed()
        ):

            frozen_credentials = self.get_credentials()

            self.access_id = frozen_credentials.access_key
            self.session_token = frozen_credentials.token
            self.regenerate_signing_key(secret_key=frozen_credentials.secret_key)
        return super(AssumeRoleAWS4Auth, self).__call__(req)

    def handle_date_mismatch(self, req):
        req_datetime = self.get_request_date(req)
        new_key_date = req_datetime.strftime("%Y%m%d")

        frozen_credentials = self.get_credentials()

        self.access_id = frozen_credentials.access_key
        self.session_token = frozen_credentials.token
        self.regenerate_signing_key(
            date=new_key_date, secret_key=frozen_credentials.secret_key
        )
