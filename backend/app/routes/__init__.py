# app/routes/__init__.py
from .auth_routes import auth_bp
from .song_routes import song_bp
from .playlist_routes import playlist_bp
from .favorite_routes import favorite_bp

__all__ = ['auth_bp', 'song_bp', 'playlist_bp', 'favorite_bp']