"""
Unit Tests für playlist_routes.py
- CRUD-Operationen (Create, Read, Update, Delete)
"""
import unittest
from unittest.mock import Mock, patch, MagicMock
from flask import Flask
from flask_jwt_extended import JWTManager, create_access_token
from app.routes.playlist_routes import playlist_bp
from app.models.mongo_models import Playlist
from bson import ObjectId
import json

class PlaylistRoutesTestCase(unittest.TestCase):
    """Test suite für Playlist CRUD Operations"""
    
    def setUp(self):
        """Vor jedem Test ausführen"""
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        self.app.config['JWT_SECRET_KEY'] = 'test-secret-key'
        
        # Initialize JWT
        JWTManager(self.app)
        
        # Register blueprints
        self.app.register_blueprint(playlist_bp, url_prefix='/playlists')
        
        self.client = self.app.test_client()
        self.user_id = 'user_12345'
        self.playlist_id = str(ObjectId())
        
        # Create test access token
        with self.app.app_context():
            self.access_token = create_access_token(identity=self.user_id)
    
    # ============== CREATE-TESTS ==============
    
    @patch('app.routes.playlist_routes.Playlist')
    def test_create_playlist_valid(self, mock_playlist_class):
        """Test: Erfolgreiche Playlist-Erstellung"""
        mock_playlist_instance = MagicMock()
        mock_playlist_instance.to_dict.return_value = {
            'id': self.playlist_id,
            'name': 'Meine Lieblingssongs',
            'user_id': self.user_id,
            'songs': []
        }
        mock_playlist_class.create.return_value = mock_playlist_instance
        
        payload = {
            'name': 'Meine Lieblingssongs',
            'songs': []
        }
        
        response = self.client.post(
            '/playlists/create',
            data=json.dumps(payload),
            headers={'Authorization': f'Bearer {self.access_token}'},
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 201)
        response_data = json.loads(response.data)
        self.assertIn('message', response_data)
        self.assertEqual(response_data['message'], 'Playlist erstellt')
        self.assertIn('playlist', response_data)
    
    @patch('app.routes.playlist_routes.Playlist')
    def test_create_playlist_with_songs(self, mock_playlist_class):
        """Test: Playlist-Erstellung mit Songs"""
        song_id_1 = str(ObjectId())
        song_id_2 = str(ObjectId())
        
        mock_playlist_instance = MagicMock()
        mock_playlist_instance.to_dict.return_value = {
            'id': self.playlist_id,
            'name': 'Rock Classics',
            'user_id': self.user_id,
            'songs': [song_id_1, song_id_2]
        }
        mock_playlist_class.create.return_value = mock_playlist_instance
        
        payload = {
            'name': 'Rock Classics',
            'songs': [song_id_1, song_id_2]
        }
        
        response = self.client.post(
            '/playlists/create',
            data=json.dumps(payload),
            headers={'Authorization': f'Bearer {self.access_token}'},
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 201)
        response_data = json.loads(response.data)
        self.assertIn('playlist', response_data)
    
    @patch('app.routes.playlist_routes.Playlist')
    def test_create_playlist_missing_name(self, mock_playlist_class):
        """Test: Playlist-Erstellung fehlschlagen ohne Namen"""
        payload = {
            'songs': []
        }
        
        response = self.client.post(
            '/playlists/create',
            data=json.dumps(payload),
            headers={'Authorization': f'Bearer {self.access_token}'},
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.data)
        self.assertIn('error', response_data)
    
    @patch('app.routes.playlist_routes.Playlist')
    def test_create_playlist_empty_name(self, mock_playlist_class):
        """Test: Playlist-Erstellung fehlschlagen bei leerem Namen"""
        payload = {
            'name': '',
            'songs': []
        }
        
        response = self.client.post(
            '/playlists/create',
            data=json.dumps(payload),
            headers={'Authorization': f'Bearer {self.access_token}'},
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.data)
        self.assertIn('error', response_data)
    
    def test_create_playlist_without_jwt(self):
        """Test: Playlist-Erstellung fehlschlagen ohne JWT Token"""
        payload = {
            'name': 'Meine Playlist'
        }
        
        response = self.client.post(
            '/playlists/create',
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 401)
    
    # ============== READ-TESTS ==============
    
    @patch('app.routes.playlist_routes.Playlist')
    def test_list_playlists(self, mock_playlist_class):
        """Test: Alle Playlists des Users abrufen"""
        mock_playlist_1 = MagicMock()
        mock_playlist_1.to_dict.return_value = {
            'id': self.playlist_id,
            'name': 'Playlist 1',
            'songs': []
        }
        mock_playlist_2 = MagicMock()
        mock_playlist_2.to_dict.return_value = {
            'id': str(ObjectId()),
            'name': 'Playlist 2',
            'songs': []
        }
        
        mock_playlist_class.get_by_user.return_value = [mock_playlist_1, mock_playlist_2]
        
        response = self.client.get(
            '/playlists/list',
            headers={'Authorization': f'Bearer {self.access_token}'}
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertIsInstance(response_data, list)
        self.assertEqual(len(response_data), 2)
        mock_playlist_class.get_by_user.assert_called_with(self.user_id)
    
    @patch('app.routes.playlist_routes.Playlist')
    def test_list_playlists_empty(self, mock_playlist_class):
        """Test: Leere Playlists-Liste zurückgeben"""
        mock_playlist_class.get_by_user.return_value = []
        
        response = self.client.get(
            '/playlists/list',
            headers={'Authorization': f'Bearer {self.access_token}'}
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertIsInstance(response_data, list)
        self.assertEqual(len(response_data), 0)
    
    def test_list_playlists_without_jwt(self):
        """Test: Playlists abrufen fehlschlagen ohne JWT Token"""
        response = self.client.get('/playlists/list')
        
        self.assertEqual(response.status_code, 401)
    
    # ============== UPDATE-TESTS ==============
    
    @patch('app.routes.playlist_routes.Playlist')
    def test_update_playlist_name(self, mock_playlist_class):
        """Test: Playlist-Namen aktualisieren"""
        mock_playlist_instance = MagicMock()
        mock_playlist_instance.user_id = self.user_id
        mock_playlist_class.get_by_id.return_value = mock_playlist_instance
        
        payload = {
            'name': 'Neuer Playlist Name'
        }
        
        response = self.client.put(
            f'/playlists/{self.playlist_id}',
            data=json.dumps(payload),
            headers={'Authorization': f'Bearer {self.access_token}'},
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertEqual(response_data['message'], 'Playlist aktualisiert')
        mock_playlist_class.update.assert_called_once()
    
    @patch('app.routes.playlist_routes.Playlist')
    def test_update_playlist_songs(self, mock_playlist_class):
        """Test: Songs in Playlist aktualisieren"""
        song_id_1 = str(ObjectId())
        song_id_2 = str(ObjectId())
        
        mock_playlist_instance = MagicMock()
        mock_playlist_instance.user_id = self.user_id
        mock_playlist_class.get_by_id.return_value = mock_playlist_instance
        
        payload = {
            'songs': [song_id_1, song_id_2]
        }
        
        response = self.client.put(
            f'/playlists/{self.playlist_id}',
            data=json.dumps(payload),
            headers={'Authorization': f'Bearer {self.access_token}'},
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        mock_playlist_class.update.assert_called_once()
    
    @patch('app.routes.playlist_routes.Playlist')
    def test_update_playlist_name_and_songs(self, mock_playlist_class):
        """Test: Name und Songs zusammen aktualisieren"""
        song_id = str(ObjectId())
        
        mock_playlist_instance = MagicMock()
        mock_playlist_instance.user_id = self.user_id
        mock_playlist_class.get_by_id.return_value = mock_playlist_instance
        
        payload = {
            'name': 'Updated Playlist',
            'songs': [song_id]
        }
        
        response = self.client.put(
            f'/playlists/{self.playlist_id}',
            data=json.dumps(payload),
            headers={'Authorization': f'Bearer {self.access_token}'},
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        mock_playlist_class.update.assert_called_once()
    
    @patch('app.routes.playlist_routes.Playlist')
    def test_update_playlist_not_found(self, mock_playlist_class):
        """Test: Update fehlschlagen wenn Playlist nicht existiert"""
        mock_playlist_class.get_by_id.return_value = None
        
        payload = {'name': 'Neuer Name'}
        
        response = self.client.put(
            f'/playlists/{self.playlist_id}',
            data=json.dumps(payload),
            headers={'Authorization': f'Bearer {self.access_token}'},
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 404)
    
    @patch('app.routes.playlist_routes.Playlist')
    def test_update_playlist_unauthorized(self, mock_playlist_class):
        """Test: Update fehlschlagen bei falschem User"""
        mock_playlist_instance = MagicMock()
        mock_playlist_instance.user_id = 'different_user_id'
        mock_playlist_class.get_by_id.return_value = mock_playlist_instance
        
        payload = {'name': 'Neuer Name'}
        
        response = self.client.put(
            f'/playlists/{self.playlist_id}',
            data=json.dumps(payload),
            headers={'Authorization': f'Bearer {self.access_token}'},
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 404)
    
    def test_update_playlist_without_jwt(self):
        """Test: Update fehlschlagen ohne JWT Token"""
        payload = {'name': 'Neuer Name'}
        
        response = self.client.put(
            f'/playlists/{self.playlist_id}',
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 401)
    
    # ============== DELETE-TESTS ==============
    
    @patch('app.routes.playlist_routes.Playlist')
    def test_delete_playlist(self, mock_playlist_class):
        """Test: Playlist erfolgreich löschen"""
        mock_playlist_instance = MagicMock()
        mock_playlist_instance.user_id = self.user_id
        mock_playlist_class.get_by_id.return_value = mock_playlist_instance
        
        response = self.client.delete(
            f'/playlists/{self.playlist_id}',
            headers={'Authorization': f'Bearer {self.access_token}'}
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertEqual(response_data['message'], 'Playlist gelöscht')
        mock_playlist_class.delete.assert_called_once_with(self.playlist_id)
    
    @patch('app.routes.playlist_routes.Playlist')
    def test_delete_playlist_not_found(self, mock_playlist_class):
        """Test: Delete fehlschlagen wenn Playlist nicht existiert"""
        mock_playlist_class.get_by_id.return_value = None
        
        response = self.client.delete(
            f'/playlists/{self.playlist_id}',
            headers={'Authorization': f'Bearer {self.access_token}'}
        )
        
        self.assertEqual(response.status_code, 404)
        mock_playlist_class.delete.assert_not_called()
    
    @patch('app.routes.playlist_routes.Playlist')
    def test_delete_playlist_unauthorized(self, mock_playlist_class):
        """Test: Delete fehlschlagen bei falschem User"""
        mock_playlist_instance = MagicMock()
        mock_playlist_instance.user_id = 'different_user_id'
        mock_playlist_class.get_by_id.return_value = mock_playlist_instance
        
        response = self.client.delete(
            f'/playlists/{self.playlist_id}',
            headers={'Authorization': f'Bearer {self.access_token}'}
        )
        
        self.assertEqual(response.status_code, 404)
        mock_playlist_class.delete.assert_not_called()
    
    def test_delete_playlist_without_jwt(self):
        """Test: Delete fehlschlagen ohne JWT Token"""
        response = self.client.delete(
            f'/playlists/{self.playlist_id}'
        )
        
        self.assertEqual(response.status_code, 401)


class PlaylistValidationTestCase(unittest.TestCase):
    """Test suite für Playlist Validierung"""
    
    def setUp(self):
        """Vor jedem Test ausführen"""
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        self.app.config['JWT_SECRET_KEY'] = 'test-secret-key'
        
        JWTManager(self.app)
        self.app.register_blueprint(playlist_bp, url_prefix='/playlists')
        
        self.client = self.app.test_client()
        self.user_id = 'user_12345'
        
        with self.app.app_context():
            self.access_token = create_access_token(identity=self.user_id)
    
    @patch('app.routes.playlist_routes.Playlist')
    def test_invalid_object_id_in_songs(self, mock_playlist_class):
        """Test: Ungültige ObjectIds in Songs werden gefiltert"""
        mock_playlist_instance = MagicMock()
        mock_playlist_instance.to_dict.return_value = {
            'id': str(ObjectId()),
            'name': 'Test',
            'songs': []
        }
        mock_playlist_class.create.return_value = mock_playlist_instance
        
        invalid_id = 'not-a-valid-id'
        valid_id = str(ObjectId())
        
        payload = {
            'name': 'Test Playlist',
            'songs': [invalid_id, valid_id]
        }
        
        response = self.client.post(
            '/playlists/create',
            data=json.dumps(payload),
            headers={'Authorization': f'Bearer {self.access_token}'},
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 201)
    
    @patch('app.routes.playlist_routes.Playlist')
    def test_empty_songs_list_valid(self, mock_playlist_class):
        """Test: Leere Songs-Liste ist valid"""
        mock_playlist_instance = MagicMock()
        mock_playlist_instance.to_dict.return_value = {
            'id': str(ObjectId()),
            'name': 'Empty Playlist',
            'songs': []
        }
        mock_playlist_class.create.return_value = mock_playlist_instance
        
        payload = {
            'name': 'Empty Playlist',
            'songs': []
        }
        
        response = self.client.post(
            '/playlists/create',
            data=json.dumps(payload),
            headers={'Authorization': f'Bearer {self.access_token}'},
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 201)


if __name__ == '__main__':
    unittest.main()
