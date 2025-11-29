"""
Pytest configuration und gemeinsame Test Fixtures
"""
import pytest
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager


@pytest.fixture
def app():
    """Flask app für Tests"""
    app = Flask(__name__)
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['JWT_SECRET_KEY'] = 'test-secret-key'
    
    return app


@pytest.fixture
def client(app):
    """Test client"""
    return app.test_client()
