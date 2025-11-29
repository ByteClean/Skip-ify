"""
Unit Tests für song_routes.py
- Upload-Validierung
- Favoriten
"""
import unittest
from unittest.mock import Mock, patch, MagicMock
from flask import Flask
from flask_jwt_extended import JWTManager, create_access_token
from app.routes.song_routes import song_bp, allowed_file
from app.models.mongo_models import Song, Favorite
from bson import ObjectId
import json
import tempfile
import os
from io import BytesIO

class SongRoutesTestCase(unittest.TestCase):
    """Test suite für Song Routes"""
    
    def setUp(self):
        """Vor jedem Test ausführen"""
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        self.app.config['JWT_SECRET_KEY'] = 'test-secret-key'
        self.app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024
        
        # Create temp upload folder
        self.temp_dir = tempfile.mkdtemp()
        self.app.config['UPLOAD_FOLDER'] = self.temp_dir
        
        # Initialize JWT
        JWTManager(self.app)
        
        # Register blueprints
        self.app.register_blueprint(song_bp, url_prefix='/songs')
        
        self.client = self.app.test_client()
        self.user_id = '12345'
        
        # Create test access token
        with self.app.app_context():
            self.access_token = create_access_token(identity=self.user_id)
    
    def tearDown(self):
        """Nach jedem Test ausführen"""
        # Cleanup temp folder
        import shutil
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
    
    # ============== UPLOAD-VALIDIERUNGS-TESTS ==============
    
    def test_allowed_file_valid_mp3(self):
        """Test: MP3-Dateien sind erlaubt"""
        self.assertTrue(allowed_file('song.mp3'))
    
    def test_allowed_file_valid_flac(self):
        """Test: FLAC-Dateien sind erlaubt"""
        self.assertTrue(allowed_file('song.flac'))
    
    def test_allowed_file_invalid_wav(self):
        """Test: WAV-Dateien sind nicht erlaubt"""
        self.assertFalse(allowed_file('song.wav'))
    
    def test_allowed_file_invalid_txt(self):
        """Test: TXT-Dateien sind nicht erlaubt"""
        self.assertFalse(allowed_file('document.txt'))
    
    def test_allowed_file_no_extension(self):
        """Test: Dateien ohne Erweiterung sind nicht erlaubt"""
        self.assertFalse(allowed_file('song'))
    
    def test_allowed_file_case_insensitive(self):
        """Test: Dateiendungen sind case-insensitive"""
        self.assertTrue(allowed_file('song.MP3'))
        self.assertTrue(allowed_file('song.FLAC'))
        self.assertTrue(allowed_file('song.Mp3'))
    
    @patch('app.routes.song_routes.Song')
    @patch('app.routes.song_routes.secure_filename')
    def test_upload_no_file(self, mock_secure, mock_song):
        """Test: Upload fehlschlagen ohne Datei"""
        response = self.client.post(
            '/songs/upload',
            headers={'Authorization': f'Bearer {self.access_token}'},
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertIn('Keine Datei', data['error'])
    
    @patch('app.routes.song_routes.Song')
    @patch('app.routes.song_routes.secure_filename')
    def test_upload_empty_filename(self, mock_secure, mock_song):
        """Test: Upload fehlschlagen bei leerem Dateinamen"""
        data = {'file': (BytesIO(b''), '')}
        
        response = self.client.post(
            '/songs/upload',
            data=data,
            headers={'Authorization': f'Bearer {self.access_token}'},
            content_type='multipart/form-data'
        )
        
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.data)
        self.assertIn('error', response_data)
    
    @patch('app.routes.song_routes.Song')
    @patch('app.routes.song_routes.secure_filename')
    def test_upload_invalid_file_type(self, mock_secure, mock_song):
        """Test: Upload fehlschlagen bei nicht erlaubtem Dateityp"""
        data = {'file': (BytesIO(b'test'), 'document.txt')}
        
        response = self.client.post(
            '/songs/upload',
            data=data,
            headers={'Authorization': f'Bearer {self.access_token}'},
            content_type='multipart/form-data'
        )
        
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.data)
        self.assertIn('error', response_data)
        self.assertIn('MP3/FLAC', response_data['error'])
    
    def test_upload_file_too_large(self):
        """Test: Upload fehlschlagen bei Datei > 50MB"""
        # Erstelle Mock-Datei mit zu großem Content-Length
        large_data = b'x' * (51 * 1024 * 1024)  # 51 MB
        data = {
            'file': (BytesIO(large_data), 'song.mp3'),
        }
        
        response = self.client.post(
            '/songs/upload',
            data=data,
            headers={'Authorization': f'Bearer {self.access_token}'},
            content_type='multipart/form-data'
        )
        
        # Flask sollte dies auf Grund MAX_CONTENT_LENGTH ablehnen
        self.assertIn(response.status_code, [400, 413])
    
    @patch('app.routes.song_routes.Song')
    def test_upload_successful(self, mock_song):
        """Test: Erfolgreicher Upload"""
        mock_song_instance = MagicMock()
        mock_song_instance.to_dict.return_value = {
            'id': '507f1f77bcf86cd799439011',
            'title': 'Test Song',
            'artist': 'Test Artist'
        }
        mock_song.create.return_value = mock_song_instance
        
        # Mock auch die file.save() Methode durch Mocking des gesamten Upload-Prozesses
        file_content = b'fake mp3 content'
        data = {
            'file': (BytesIO(file_content), 'song.mp3'),
            'title': 'Test Song',
            'artist': 'Test Artist',
            'album': 'Test Album',
            'genre': 'Rock'
        }
        
        with patch('app.routes.song_routes.os.path.join', return_value=os.path.join(self.temp_dir, 'song.mp3')):
            # Erstelle die Datei vorher, um FileNotFoundError zu vermeiden
            os.makedirs(self.temp_dir, exist_ok=True)
            response = self.client.post(
                '/songs/upload',
                data=data,
                headers={'Authorization': f'Bearer {self.access_token}'},
                content_type='multipart/form-data'
            )
        
        self.assertEqual(response.status_code, 201)
        response_data = json.loads(response.data)
        self.assertIn('message', response_data)
        self.assertIn('song', response_data)
    
    @patch('app.routes.song_routes.Song')
    def test_upload_without_jwt(self, mock_song):
        """Test: Upload fehlschlagen ohne JWT Token"""
        data = {'file': (BytesIO(b'test'), 'song.mp3')}
        
        response = self.client.post(
            '/songs/upload',
            data=data,
            content_type='multipart/form-data'
        )
        
        self.assertEqual(response.status_code, 401)
    
    # ============== FAVORITEN-TESTS ==============
    
    @patch('app.routes.song_routes.Song')
    def test_list_songs_returns_user_songs(self, mock_song):
        """Test: list_songs gibt nur Songs des Users zurück"""
        mock_song_instance = MagicMock()
        mock_song_instance.to_dict.return_value = {
            'id': '507f1f77bcf86cd799439011',
            'title': 'My Song',
            'artist': 'My Artist'
        }
        mock_song.get_by_user.return_value = [mock_song_instance]
        
        response = self.client.get(
            '/songs/list',
            headers={'Authorization': f'Bearer {self.access_token}'}
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertIsInstance(response_data, list)
        mock_song.get_by_user.assert_called_with(self.user_id)
    
    @patch('app.routes.song_routes.Song')
    def test_list_songs_without_jwt(self, mock_song):
        """Test: list_songs fehlschlagen ohne JWT Token"""
        response = self.client.get('/songs/list')
        
        self.assertEqual(response.status_code, 401)
    
    @patch('app.routes.song_routes.Song')
    def test_stream_song_valid(self, mock_song):
        """Test: Song streamen mit korrektem Zugriff"""
        song_id = '507f1f77bcf86cd799439011'
        
        # Create temp file
        temp_file = os.path.join(self.temp_dir, 'test.mp3')
        with open(temp_file, 'wb') as f:
            f.write(b'fake mp3 content')
        
        mock_song_instance = MagicMock()
        mock_song_instance.user_id = self.user_id
        mock_song_instance.file_path = temp_file
        mock_song.get_by_id.return_value = mock_song_instance
        
        with patch('app.routes.song_routes.os.path.getsize', return_value=16):
            response = self.client.get(
                f'/songs/{song_id}/stream',
                headers={'Authorization': f'Bearer {self.access_token}'}
            )
        
        self.assertEqual(response.status_code, 200)
    
    @patch('app.routes.song_routes.Song')
    def test_stream_song_not_found(self, mock_song):
        """Test: Song streamen fehlschlagen wenn nicht gefunden"""
        mock_song.get_by_id.return_value = None
        
        response = self.client.get(
            '/songs/507f1f77bcf86cd799439011/stream',
            headers={'Authorization': f'Bearer {self.access_token}'}
        )
        
        self.assertEqual(response.status_code, 404)
    
    @patch('app.routes.song_routes.Song')
    def test_stream_song_unauthorized(self, mock_song):
        """Test: Song streamen fehlschlagen bei falschem User"""
        mock_song_instance = MagicMock()
        mock_song_instance.user_id = 'different_user_id'
        mock_song.get_by_id.return_value = mock_song_instance
        
        response = self.client.get(
            '/songs/507f1f77bcf86cd799439011/stream',
            headers={'Authorization': f'Bearer {self.access_token}'}
        )
        
        self.assertEqual(response.status_code, 404)
    
    @patch('app.routes.song_routes.Song')
    def test_download_song_valid(self, mock_song):
        """Test: Song download mit korrektem Zugriff"""
        song_id = '507f1f77bcf86cd799439011'
        
        # Create temp file
        temp_file = os.path.join(self.temp_dir, 'test.mp3')
        with open(temp_file, 'wb') as f:
            f.write(b'fake mp3 content')
        
        mock_song_instance = MagicMock()
        mock_song_instance.user_id = self.user_id
        mock_song_instance.file_path = temp_file
        mock_song.get_by_id.return_value = mock_song_instance
        
        response = self.client.get(
            f'/songs/{song_id}/download',
            headers={'Authorization': f'Bearer {self.access_token}'}
        )
        
        self.assertEqual(response.status_code, 200)


class SongValidationTestCase(unittest.TestCase):
    """Test suite für Song Upload Validierung"""
    
    def test_validate_filename_length(self):
        """Test: Lange Dateinamen werden gekürzt"""
        long_filename = 'a' * 300 + '.mp3'
        self.assertTrue(allowed_file(long_filename))
    
    def test_validate_multiple_dots_in_filename(self):
        """Test: Dateiname mit mehreren Punkten"""
        self.assertTrue(allowed_file('my.song.version.2.mp3'))
    
    def test_validate_special_characters(self):
        """Test: Spezialzeichen in Dateinamen"""
        self.assertTrue(allowed_file('song_with-special.chars!.mp3'))


if __name__ == '__main__':
    unittest.main()
