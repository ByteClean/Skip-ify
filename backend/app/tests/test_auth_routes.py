"""
Unit Tests für auth_routes.py
- Registrierung
- Login
- Passwort-Hashing
"""
import unittest
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from app.models.mysql_user import db, User
from app.routes.auth_routes import auth_bp
from werkzeug.security import generate_password_hash, check_password_hash
import json
import os

class AuthRoutesTestCase(unittest.TestCase):
    """Test suite für Authentifizierung"""
    
    def setUp(self):
        """Vor jedem Test ausführen"""
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['JWT_SECRET_KEY'] = 'test-secret-key'
        self.app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        
        # Initialize extensions
        db.init_app(self.app)
        JWTManager(self.app)
        
        # Register blueprints
        self.app.register_blueprint(auth_bp, url_prefix='/auth')
        
        # Create app context and tables
        self.app.app_context().push()
        db.create_all()
        
        self.client = self.app.test_client()
    
    def tearDown(self):
        """Nach jedem Test ausführen"""
        with self.app.app_context():
            db.session.remove()
            db.drop_all()
    
    # ============== REGISTRIERUNGS-TESTS ==============
    
    def test_register_valid_user(self):
        """Test: Erfolgreiche Registrierung mit gültigen Daten"""
        payload = {
            'name': 'Max Mustermann',
            'email': 'max@example.com',
            'password': 'SecurePass123'
        }
        response = self.client.post(
            '/auth/register',
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertIn('message', data)
        self.assertEqual(data['message'], 'Konto erstellt')
        self.assertIn('user', data)
        self.assertEqual(data['user']['email'], 'max@example.com')
    
    def test_register_missing_name(self):
        """Test: Registrierung fehlschlagen ohne Namen"""
        payload = {
            'email': 'test@example.com',
            'password': 'SecurePass123'
        }
        response = self.client.post(
            '/auth/register',
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn('error', data)
    
    def test_register_missing_email(self):
        """Test: Registrierung fehlschlagen ohne E-Mail"""
        payload = {
            'name': 'Max Mustermann',
            'password': 'SecurePass123'
        }
        response = self.client.post(
            '/auth/register',
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn('error', data)
    
    def test_register_missing_password(self):
        """Test: Registrierung fehlschlagen ohne Passwort"""
        payload = {
            'name': 'Max Mustermann',
            'email': 'test@example.com'
        }
        response = self.client.post(
            '/auth/register',
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn('error', data)
    
    def test_register_password_too_short(self):
        """Test: Registrierung fehlschlagen bei Passwort < 8 Zeichen"""
        payload = {
            'name': 'Max Mustermann',
            'email': 'test@example.com',
            'password': 'short'  # Zu kurz
        }
        response = self.client.post(
            '/auth/register',
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn('error', data)
    
    def test_register_email_already_exists(self):
        """Test: Registrierung fehlschlagen bei duplizierten E-Mail"""
        # Erste Registrierung
        payload = {
            'name': 'Max Mustermann',
            'email': 'duplicate@example.com',
            'password': 'SecurePass123'
        }
        self.client.post(
            '/auth/register',
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        # Zweite Registrierung mit gleicher E-Mail
        response = self.client.post(
            '/auth/register',
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 409)
        data = json.loads(response.data)
        self.assertIn('error', data)
    
    # ============== LOGIN-TESTS ==============
    
    def test_login_valid_credentials(self):
        """Test: Erfolgreicher Login mit korrekten Anmeldedaten"""
        # User registrieren
        register_payload = {
            'name': 'Max Mustermann',
            'email': 'max@example.com',
            'password': 'SecurePass123'
        }
        self.client.post(
            '/auth/register',
            data=json.dumps(register_payload),
            content_type='application/json'
        )
        
        # Login mit korrekten Daten
        login_payload = {
            'email': 'max@example.com',
            'password': 'SecurePass123'
        }
        response = self.client.post(
            '/auth/login',
            data=json.dumps(login_payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('access_token', data)
        self.assertIn('user', data)
        self.assertEqual(data['user']['email'], 'max@example.com')
    
    def test_login_wrong_password(self):
        """Test: Login fehlschlagen bei falschem Passwort"""
        # User registrieren
        register_payload = {
            'name': 'Max Mustermann',
            'email': 'max@example.com',
            'password': 'SecurePass123'
        }
        self.client.post(
            '/auth/register',
            data=json.dumps(register_payload),
            content_type='application/json'
        )
        
        # Login mit falschem Passwort
        login_payload = {
            'email': 'max@example.com',
            'password': 'WrongPassword'
        }
        response = self.client.post(
            '/auth/login',
            data=json.dumps(login_payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.data)
        self.assertIn('error', data)
    
    def test_login_user_not_found(self):
        """Test: Login fehlschlagen bei nicht existierendem User"""
        login_payload = {
            'email': 'nonexistent@example.com',
            'password': 'SomePassword123'
        }
        response = self.client.post(
            '/auth/login',
            data=json.dumps(login_payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.data)
        self.assertIn('error', data)
    
    def test_login_missing_email(self):
        """Test: Login fehlschlagen ohne E-Mail"""
        login_payload = {
            'password': 'SomePassword123'
        }
        response = self.client.post(
            '/auth/login',
            data=json.dumps(login_payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 401)
    
    # ============== PASSWORT-HASHING-TESTS ==============
    
    def test_password_hashing_on_creation(self):
        """Test: Passwort wird gehasht beim User erstellen"""
        user = User(name='Test User', email='test@example.com')
        password = 'MySecurePassword123'
        user.set_password(password)
        
        # Passwort sollte nicht im Klartext gespeichert sein
        self.assertNotEqual(user.password_hash, password)
        # Passwort Hash sollte nicht leer sein
        self.assertIsNotNone(user.password_hash)
        self.assertTrue(len(user.password_hash) > 0)
    
    def test_password_check_correct(self):
        """Test: check_password gibt True zurück bei korrektem Passwort"""
        user = User(name='Test User', email='test@example.com')
        password = 'MySecurePassword123'
        user.set_password(password)
        
        self.assertTrue(user.check_password(password))
    
    def test_password_check_incorrect(self):
        """Test: check_password gibt False zurück bei falschem Passwort"""
        user = User(name='Test User', email='test@example.com')
        user.set_password('CorrectPassword123')
        
        self.assertFalse(user.check_password('WrongPassword123'))
    
    def test_password_hashing_different_salts(self):
        """Test: Gleiche Passwörter erzeugen unterschiedliche Hashes"""
        user1 = User(name='User 1', email='user1@example.com')
        user2 = User(name='User 2', email='user2@example.com')
        password = 'SamePassword123'
        
        user1.set_password(password)
        user2.set_password(password)
        
        # Hashes sollten unterschiedlich sein (verschiedene Salts)
        self.assertNotEqual(user1.password_hash, user2.password_hash)
        # Aber beide sollten das Passwort prüfen können
        self.assertTrue(user1.check_password(password))
        self.assertTrue(user2.check_password(password))
    
    def test_user_to_dict(self):
        """Test: User.to_dict gibt keine sensiblen Daten zurück"""
        user = User(name='Test User', email='test@example.com')
        user.set_password('SecurePassword123')
        db.session.add(user)
        db.session.commit()
        
        user_dict = user.to_dict()
        
        # Sollte nur sichere Daten enthalten
        self.assertIn('id', user_dict)
        self.assertIn('name', user_dict)
        self.assertIn('email', user_dict)
        # Passwort-Hash sollte NICHT dabei sein
        self.assertNotIn('password_hash', user_dict)


if __name__ == '__main__':
    unittest.main()
