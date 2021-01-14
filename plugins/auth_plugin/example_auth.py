# This is based on Airflow's user password model
import flask_login

login_manager = flask_login.LoginManager()
# ... some configs about login manager


def init_app(app):
    login_manager.init_app(app)
    # Do any custom action here


def login(request):
    # When you need to login the user
    pass
