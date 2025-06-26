from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import json
import requests
import time
import os
from typing import Dict, List, Optional

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database configuration
DATABASE_PATH = 'dictionary.db'

class DictionaryAPI:
    def __init__(self):
        self.init_database()
    
    def init_database(self):
        """Initialize SQLite database with dictionary table"""
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Create dictionary table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS dictionary (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                word TEXT UNIQUE NOT NULL,
                definitions TEXT NOT NULL,
                phonetic TEXT,
                part_of_speech TEXT,
                example TEXT,
                etymology TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create index for faster word lookups
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_word ON dictionary(word)')
        
        conn.commit()
        conn.close()
        
        # Populate with initial common words if database is empty
        if self.get_word_count() == 0:
            self.populate_initial_words()
    
    def get_word_count(self) -> int:
        """Get total number of words in database"""
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM dictionary')
        count = cursor.fetchone()[0]
        conn.close()
        return count
    
    def populate_initial_words(self):
        """Populate database with common English words"""
        print("Populating database with initial words...")
        
        # Common English words to start with
        common_words = [
            "hello", "world", "computer", "python", "programming", "game", "play",
            "word", "definition", "dictionary", "language", "english", "learn",
            "study", "book", "read", "write", "speak", "listen", "understand",
            "knowledge", "wisdom", "intelligent", "smart", "clever", "brilliant",
            "amazing", "wonderful", "beautiful", "excellent", "fantastic", "great",
            "good", "bad", "terrible", "awful", "horrible", "nice", "pleasant",
            "happy", "sad", "angry", "excited", "calm", "peaceful", "quiet",
            "loud", "big", "small", "large", "tiny", "huge", "massive", "little",
            "red", "blue", "green", "yellow", "orange", "purple", "pink", "black",
            "white", "gray", "brown", "silver", "gold", "bronze", "copper",
            "run", "walk", "jump", "swim", "fly", "drive", "ride", "travel",
            "eat", "drink", "sleep", "wake", "work", "rest", "exercise", "dance",
            "sing", "laugh", "cry", "smile", "think", "remember", "forget",
            "love", "like", "hate", "enjoy", "prefer", "choose", "decide",
            "house", "home", "school", "office", "hospital", "store", "market",
            "restaurant", "hotel", "library", "museum", "park", "beach", "mountain",
            "river", "lake", "ocean", "forest", "desert", "city", "town", "village",
            "car", "bus", "train", "plane", "ship", "boat", "bicycle", "motorcycle",
            "dog", "cat", "bird", "fish", "horse", "cow", "pig", "sheep", "chicken",
            "apple", "banana", "orange", "grape", "strawberry", "watermelon", "bread",
            "water", "milk", "coffee", "tea", "juice", "wine", "beer", "soup"
        ]
        
        for word in common_words:
            try:
                definition_data = self.fetch_word_definition(word)
                if definition_data:
                    self.store_word(word, definition_data)
                    print(f"Added: {word}")
                time.sleep(0.1)  # Rate limiting
            except Exception as e:
                print(f"Error adding {word}: {e}")
                # Add a basic entry if API fails
                self.store_word(word, {
                    'definitions': [f'A common English word: {word}'],
                    'phonetic': '',
                    'part_of_speech': 'unknown',
                    'example': '',
                    'etymology': ''
                })
    
    def fetch_word_definition(self, word: str) -> Optional[Dict]:
        """Fetch word definition from Free Dictionary API"""
        try:
            url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{word.lower()}"
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    entry = data[0]
                    
                    # Extract definitions
                    definitions = []
                    part_of_speech = ""
                    example = ""
                    
                    if 'meanings' in entry:
                        for meaning in entry['meanings']:
                            if not part_of_speech and 'partOfSpeech' in meaning:
                                part_of_speech = meaning['partOfSpeech']
                            
                            if 'definitions' in meaning:
                                for defn in meaning['definitions']:
                                    if 'definition' in defn:
                                        definitions.append(defn['definition'])
                                    if not example and 'example' in defn:
                                        example = defn['example']
                    
                    return {
                        'definitions': definitions,
                        'phonetic': entry.get('phonetic', ''),
                        'part_of_speech': part_of_speech,
                        'example': example,
                        'etymology': ''  # Not available in this API
                    }
            return None
        except Exception as e:
            print(f"Error fetching definition for {word}: {e}")
            return None
    
    def store_word(self, word: str, definition_data: Dict):
        """Store word and definition in database"""
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT OR REPLACE INTO dictionary 
                (word, definitions, phonetic, part_of_speech, example, etymology)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                word.lower(),
                json.dumps(definition_data['definitions']),
                definition_data.get('phonetic', ''),
                definition_data.get('part_of_speech', ''),
                definition_data.get('example', ''),
                definition_data.get('etymology', '')
            ))
            conn.commit()
        except Exception as e:
            print(f"Error storing word {word}: {e}")
        finally:
            conn.close()
    
    def get_word(self, word: str) -> Optional[Dict]:
        """Get word definition from database"""
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT word, definitions, phonetic, part_of_speech, example, etymology
            FROM dictionary WHERE word = ? LIMIT 1
        ''', (word.lower(),))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                'word': row[0],
                'definitions': json.loads(row[1]) if row[1] else [],
                'phonetic': row[2],
                'part_of_speech': row[3],
                'example': row[4],
                'etymology': row[5]
            }
        return None
    
    def search_words(self, pattern: str, limit: int = 50) -> List[str]:
        """Search for words matching pattern"""
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT word FROM dictionary 
            WHERE word LIKE ? 
            ORDER BY word 
            LIMIT ?
        ''', (f'%{pattern.lower()}%', limit))
        
        words = [row[0] for row in cursor.fetchall()]
        conn.close()
        return words
    
    def get_random_words(self, count: int = 10) -> List[Dict]:
        """Get random words from database"""
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT word, definitions, phonetic, part_of_speech, example
            FROM dictionary 
            ORDER BY RANDOM() 
            LIMIT ?
        ''', (count,))
        
        words = []
        for row in cursor.fetchall():
            words.append({
                'word': row[0],
                'definitions': json.loads(row[1]) if row[1] else [],
                'phonetic': row[2],
                'part_of_speech': row[3],
                'example': row[4]
            })
        
        conn.close()
        return words

# Initialize dictionary API
dictionary_api = DictionaryAPI()

@app.route('/')
def home():
    """API documentation endpoint"""
    return jsonify({
        'message': 'Dictionary API for MultigameApp',
        'endpoints': {
            '/api/word/<word>': 'GET - Get definition for a specific word',
            '/api/search': 'GET - Search words (query parameter: q)',
            '/api/random': 'GET - Get random words (query parameter: count)',
            '/api/stats': 'GET - Get database statistics',
            '/api/add-word': 'POST - Add a new word to database'
        },
        'total_words': dictionary_api.get_word_count()
    })

@app.route('/api/word/<word>')
def get_word_definition(word):
    """Get definition for a specific word"""
    try:
        # First check database
        definition = dictionary_api.get_word(word)
        
        if not definition:
            # If not in database, try to fetch from API
            definition_data = dictionary_api.fetch_word_definition(word)
            if definition_data:
                dictionary_api.store_word(word, definition_data)
                definition = dictionary_api.get_word(word)
        
        if definition:
            return jsonify({
                'success': True,
                'data': definition
            })
        else:
            return jsonify({
                'success': False,
                'message': f'Word "{word}" not found'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

@app.route('/api/search')
def search_words():
    """Search for words matching pattern"""
    try:
        query = request.args.get('q', '')
        limit = min(int(request.args.get('limit', 50)), 100)  # Max 100 results
        
        if len(query) < 2:
            return jsonify({
                'success': False,
                'message': 'Query must be at least 2 characters long'
            }), 400
        
        words = dictionary_api.search_words(query, limit)
        
        return jsonify({
            'success': True,
            'data': {
                'query': query,
                'count': len(words),
                'words': words
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

@app.route('/api/random')
def get_random_words():
    """Get random words from database"""
    try:
        count = min(int(request.args.get('count', 10)), 50)  # Max 50 words
        words = dictionary_api.get_random_words(count)
        
        return jsonify({
            'success': True,
            'data': {
                'count': len(words),
                'words': words
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

@app.route('/api/stats')
def get_stats():
    """Get database statistics"""
    try:
        total_words = dictionary_api.get_word_count()
        
        return jsonify({
            'success': True,
            'data': {
                'total_words': total_words,
                'database_size': f"{os.path.getsize(DATABASE_PATH) / 1024 / 1024:.2f} MB" if os.path.exists(DATABASE_PATH) else "0 MB"
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

@app.route('/api/add-word', methods=['POST'])
def add_word():
    """Add a new word to the database"""
    try:
        data = request.get_json()
        
        if not data or 'word' not in data:
            return jsonify({
                'success': False,
                'message': 'Word is required'
            }), 400
        
        word = data['word'].strip().lower()
        
        # Check if word already exists
        existing = dictionary_api.get_word(word)
        if existing:
            return jsonify({
                'success': False,
                'message': f'Word "{word}" already exists in database'
            }), 409
        
        # Try to fetch definition
        definition_data = dictionary_api.fetch_word_definition(word)
        
        if definition_data:
            dictionary_api.store_word(word, definition_data)
            return jsonify({
                'success': True,
                'message': f'Word "{word}" added successfully',
                'data': dictionary_api.get_word(word)
            })
        else:
            return jsonify({
                'success': False,
                'message': f'Could not find definition for "{word}"'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

if __name__ == '__main__':
    print("Starting Dictionary API...")
    print(f"Database has {dictionary_api.get_word_count()} words")
    app.run(debug=True, host='0.0.0.0', port=5000)
