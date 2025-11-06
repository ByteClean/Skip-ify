# app/__init__.py
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.config import Config
from app.models.mysql_user import db
from app.models.mongo_models import mongo  # ← Importiere mongo

# Importiere Blueprints
from app.routes.auth_routes import auth_bp
from app.routes.song_routes import song_bp
from app.routes.playlist_routes import playlist_bp
from app.routes.favorite_routes import favorite_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Init Extensions
    db.init_app(app)
    CORS(app)
    JWTManager(app)

    # MongoDB verbinden (im App-Kontext!)
    with app.app_context():
        mongo.connect()

    # Blueprints registrieren
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(song_bp, url_prefix='/songs')
    app.register_blueprint(playlist_bp, url_prefix='/playlists')
    app.register_blueprint(favorite_bp, url_prefix='/favorites')

    # MySQL Tabellen erstellen
    with app.app_context():
        db.create_all()

    return app