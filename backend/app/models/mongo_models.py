# app/models/mongo_models.py
from pymongo import MongoClient
from flask import current_app
from bson import ObjectId

class MongoDB:
    def __init__(self):
        self.client = None
        self.db = None
        self.playlists = None
        self.songs = None
        self.favorites = None

    def connect(self):
        if self.client is None:
            self.client = MongoClient(current_app.config['MONGO_URI'])
            self.db = self.client['skipify_music']
            self.playlists = self.db['playlists']
            self.songs = self.db['songs']
            self.favorites = self.db['favorites']
        return self

# Globale Instanz
mongo = MongoDB()

# ================= SONG =================
class Song:
    def __init__(self, title, artist, album, genre, file_path, user_id):
        self.title = title
        self.artist = artist
        self.album = album
        self.genre = genre
        self.file_path = file_path
        self.user_id = user_id
        self.id = None  # Wird nach Insert gesetzt

    def to_dict(self):
        return {
            'id': str(self.id) if self.id else None,
            'title': self.title,
            'artist': self.artist,
            'album': self.album,
            'genre': self.genre,
            'file_path': self.file_path,
            'user_id': self.user_id
        }

    @staticmethod
    def create(song_data):
        result = mongo.connect().songs.insert_one(song_data)
        song = Song(
            song_data['title'],
            song_data['artist'],
            song_data['album'],
            song_data['genre'],
            song_data['file_path'],
            song_data['user_id']
        )
        song.id = result.inserted_id
        return song

    @staticmethod
    def get_by_id(song_id):
        if not ObjectId.is_valid(song_id):
            return None
        data = mongo.connect().songs.find_one({'_id': ObjectId(song_id)})
        if data:
            song = Song(
                data['title'],
                data['artist'],
                data['album'],
                data['genre'],
                data['file_path'],
                data['user_id']
            )
            song.id = data['_id']
            return song
        return None

    @staticmethod
    def get_by_user(user_id):
        cursor = mongo.connect().songs.find({'user_id': user_id})
        songs = []
        for doc in cursor:
            song = Song(
                doc['title'],
                doc['artist'],
                doc['album'],
                doc['genre'],
                doc['file_path'],
                doc['user_id']
            )
            song.id = doc['_id']
            songs.append(song)
        return songs

# ================= PLAYLIST =================
class Playlist:
    def __init__(self, name, user_id, songs=None):
        self.name = name
        self.user_id = user_id
        self.songs = songs or []
        self.id = None

    def to_dict(self):
        return {
            'id': str(self.id) if self.id else None,
            'name': self.name,
            'user_id': self.user_id,
            'songs': [str(s) for s in self.songs]
        }

    @staticmethod
    def create(playlist_data):
        result = mongo.connect().playlists.insert_one(playlist_data)
        playlist = Playlist(
            playlist_data['name'],
            playlist_data['user_id'],
            playlist_data.get('songs', [])
        )
        playlist.id = result.inserted_id
        return playlist

    @staticmethod
    def get_by_id(playlist_id):
        if not ObjectId.is_valid(playlist_id):
            return None
        data = mongo.connect().playlists.find_one({'_id': ObjectId(playlist_id)})
        if data:
            playlist = Playlist(data['name'], data['user_id'], data.get('songs', []))
            playlist.id = data['_id']
            return playlist
        return None

    @staticmethod
    def update(playlist_id, updates):
        mongo.connect().playlists.update_one(
            {'_id': ObjectId(playlist_id)},
            {'$set': updates}
        )

    @staticmethod
    def delete(playlist_id):
        mongo.connect().playlists.delete_one({'_id': ObjectId(playlist_id)})

    @staticmethod
    def get_by_user(user_id):
        cursor = mongo.connect().playlists.find({'user_id': user_id})
        playlists = []
        for doc in cursor:
            playlist = Playlist(doc['name'], doc['user_id'], doc.get('songs', []))
            playlist.id = doc['_id']
            playlists.append(playlist)
        return playlists

# ================= FAVORITE =================
class Favorite:
    @staticmethod
    def create(user_id, song_id):
        mongo.connect().favorites.insert_one({
            'user_id': user_id,
            'song_id': ObjectId(song_id)
        })

    @staticmethod
    def delete(user_id, song_id):
        mongo.connect().favorites.delete_one({
            'user_id': user_id,
            'song_id': ObjectId(song_id)
        })

    @staticmethod
    def get_by_user(user_id):
        cursor = mongo.connect().favorites.find({'user_id': user_id})
        return [doc['song_id'] for doc in cursor]