from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.mongo_models import Favorite, Song, mongo
from bson import ObjectId

favorite_bp = Blueprint('favorites', __name__)

@favorite_bp.route('/mark', methods=['POST'])
@jwt_required()
def mark_favorite():
    user_id = get_jwt_identity()
    data = request.get_json()
    song_id = data.get('song_id')
    
    if not song_id:
        return jsonify({'error': 'song_id erforderlich'}), 400
    
    song = Song.get_by_id(song_id)
    if not song or song.user_id != user_id:
        return jsonify({'error': 'Song nicht gefunden oder Zugriff verweigert'}), 404
    
    # Check if already favorite
    favorites = Favorite.get_by_user(user_id)
    if ObjectId(song_id) in favorites:
        return jsonify({'error': 'Song ist bereits Favorit'}), 400
    
    Favorite.create(user_id, song_id)
    return jsonify({'message': 'Favorit markiert'}), 200

@favorite_bp.route('/unmark', methods=['DELETE'])
@jwt_required()
def unmark_favorite():
    user_id = get_jwt_identity()
    data = request.get_json()
    song_id = data.get('song_id')
    
    if not song_id:
        return jsonify({'error': 'song_id erforderlich'}), 400
    
    Favorite.delete(user_id, song_id)
    return jsonify({'message': 'Favorit entfernt'}), 200

@favorite_bp.route('/list', methods=['GET'])
@jwt_required()
def list_favorites():
    user_id = get_jwt_identity()
    song_ids = Favorite.get_by_user(user_id)
    songs = []
    for sid in song_ids:
        song = Song.get_by_id(str(sid))
        if song and song.user_id == user_id:
            songs.append(song.to_dict())
    return jsonify(songs), 200