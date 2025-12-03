from flask import Blueprint, request, jsonify, send_from_directory, Response, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app.models.mongo_models import Song, mongo
import os
from app.config import Config
from bson import ObjectId

song_bp = Blueprint('songs', __name__)
ALLOWED_EXTENSIONS = {'mp3', 'flac'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@song_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_song():
    user_id = get_jwt_identity()
    if 'file' not in request.files:
        return jsonify({'error': 'Keine Datei'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Keine Datei ausgewählt'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Nur MP3/FLAC erlaubt'}), 400
    # Use request.content_length for overall request size checking
    max_len = current_app.config.get('MAX_CONTENT_LENGTH', 50 * 1024 * 1024)
    if request.content_length and request.content_length > max_len:
        return jsonify({'error': f'Größe überschritten (≤{max_len} bytes)'}), 400
    
    filename = secure_filename(file.filename)
    # Ensure upload folder exists
    upload_dir = current_app.config.get('UPLOAD_FOLDER')
    if not os.path.isabs(upload_dir):
        upload_dir = os.path.abspath(upload_dir)
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, f"{user_id}_{filename}")  # User-specific
    try:
        file.save(file_path)
    except Exception as e:
        return jsonify({'error': 'Datei konnte nicht gespeichert werden', 'detail': str(e)}), 500
    
    data = request.form.to_dict()
    song_data = {
        'title': data.get('title', filename),
        'artist': data.get('artist', 'Unbekannt'),
        'album': data.get('album', ''),
        'genre': data.get('genre', ''),
        'file_path': file_path,
        'user_id': user_id
    }
    song = Song.create(song_data)
    
    return jsonify({'message': 'Upload erfolgreich', 'song': song.to_dict()}), 201

@song_bp.route('/<song_id>/stream', methods=['GET'])
@jwt_required()
def stream_song(song_id):
    user_id = get_jwt_identity()
    song = Song.get_by_id(song_id)
    if not song or song.user_id != user_id:
        return jsonify({'error': 'Song nicht gefunden'}), 404
    
    range_header = request.headers.get('Range', None)
    file_path = song.file_path
    file_size = os.path.getsize(file_path)
    mimetype = 'audio/flac' if file_path.lower().endswith('.flac') else 'audio/mpeg'
    
    if not range_header:
        return send_from_directory(os.path.dirname(file_path), os.path.basename(file_path), mimetype=mimetype)
    
    byte1, byte2 = 0, file_size - 1
    if range_header:
        b1, b2 = range_header.replace('bytes=', '').split('-')
        byte1 = int(b1)
        byte2 = int(b2) if b2 else file_size - 1
    
    length = byte2 - byte1 + 1
    with open(file_path, 'rb') as f:
        f.seek(byte1)
        data = f.read(length)
    
    rv = Response(
        data,
        206,
        mimetype=mimetype,
        direct_passthrough=True
    )
    rv.headers['Content-Range'] = f'bytes {byte1}-{byte2}/{file_size}'
    rv.headers['Accept-Ranges'] = 'bytes'
    return rv

@song_bp.route('/<song_id>/download', methods=['GET'])
@jwt_required()
def download_song(song_id):
    user_id = get_jwt_identity()
    song = Song.get_by_id(song_id)
    if not song or song.user_id != user_id:
        return jsonify({'error': 'Song nicht verfügbar'}), 404
    
    return send_from_directory(
        os.path.dirname(song.file_path),
        os.path.basename(song.file_path),
        as_attachment=True
    )

@song_bp.route('/list', methods=['GET'])
@jwt_required()
def list_songs():
    user_id = get_jwt_identity()
    songs = Song.get_by_user(user_id)
    return jsonify([s.to_dict() for s in songs]), 200