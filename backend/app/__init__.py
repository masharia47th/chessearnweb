from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_cors import CORS
from config import Config

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
limiter = Limiter(key_func=get_remote_address)


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)
    CORS(
        app,
        origins=[
            "https://chessearn.com",
            "http://41.90.179.124",
            "http://192.168.100.4:5173",
        ],
        supports_credentials=True,
    )
    from app.routes.socket import init_socketio

    init_socketio(app)

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.profile import profile_bp
    from app.routes.game import game_bp
    from app.routes.mpesa import mpesa_bp

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(profile_bp, url_prefix="/profile")
    app.register_blueprint(game_bp, url_prefix="/game")
    app.register_blueprint(mpesa_bp, url_prefix="/mpesa")

    return app
