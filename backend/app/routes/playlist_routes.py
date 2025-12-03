from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.mongo_models import Playlist, mongo
from bson import ObjectId

playlist_bp = Blueprint('playlists', __name__)

@playlist_bp.route('/create', methods=['POST'])
@jwt_required()
def create_playlist():
    user_id = get_jwt_identity()
    data = request.get_json()
    name = data.get('name')
    songs = data.get('songs', [])  # List of song_ids
    
    if not name:
        return jsonify({'error': 'Ungültiger Playlist-Name'}), 400
    
    playlist_data = {
        'name': name,
        'user_id': user_id,
        'songs': [ObjectId(s) for s in songs if ObjectId.is_valid(s)]
    }
    playlist = Playlist.create(playlist_data)
    return jsonify({'message': 'Playlist erstellt', 'playlist': playlist.to_dict()}), 201

@playlist_bp.route('/<playlist_id>', methods=['PUT'])
@jwt_required()
def update_playlist(playlist_id):
    user_id = get_jwt_identity()
    playlist = Playlist.get_by_id(playlist_id)
    if not playlist or playlist.user_id != user_id:
        return jsonify({'error': 'Playlist nicht gefunden oder Zugriff verweigert'}), 404
    
    data = request.get_json()
    updates = {}
    if 'name' in data:
        updates['name'] = data['name']
    if 'songs' in data:
        updates['songs'] = [ObjectId(s) for s in data['songs'] if ObjectId.is_valid(s)]
    
    if updates:
        Playlist.update(playlist_id, updates)
    
    return jsonify({'message': 'Playlist aktualisiert'}), 200

@playlist_bp.route('/<playlist_id>', methods=['DELETE'])
@jwt_required()
def delete_playlist(playlist_id):
    user_id = get_jwt_identity()
    playlist = Playlist.get_by_id(playlist_id)
    if not playlist or playlist.user_id != user_id:
        return jsonify({'error': 'Playlist nicht gefunden oder Zugriff verweigert'}), 404
    
    Playlist.delete(playlist_id)
    return jsonify({'message': 'Playlist gelöscht'}), 200

@playlist_bp.route('/list', methods=['GET'])
@jwt_required()
def list_playlists():
    user_id = get_jwt_identity()
    playlists = Playlist.get_by_user(user_id)
    # small debug log to help frontend troubleshooting
    print(f"[playlist_routes] list_playlists user={user_id} count={len(playlists)}")
    return jsonify([p.to_dict() for p in playlists]), 200