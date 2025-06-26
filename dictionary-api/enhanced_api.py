#!/usr/bin/env python3
"""
Enhanced Dictionary API Service
Provides comprehensive English dictionary functionality for static sites
"""

from flask import Flask, jsonify, request, render_template_string
from flask_cors import CORS
import sqlite3
import json
import requests
import time
import os
import logging
from typing import Dict, List, Optional, Tuple
from functools import wraps
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
DATABASE_PATH = os.getenv('DATABASE_PATH', 'dictionary.db')
API_PORT = int(os.getenv('API_PORT', 5000))
API_HOST = os.getenv('API_HOST', '0.0.0.0')
RATE_LIMIT_REQUESTS = int(os.getenv('RATE_LIMIT_REQUESTS', 100))
RATE_LIMIT_WINDOW = int(os.getenv('RATE_LIMIT_WINDOW', 60))

class EnhancedDictionaryAPI:
    def __init__(self):
        self.init_database()
        self.request_cache = {}
        self.rate_limit_cache = {}
    
    def init_database(self):
        """Initialize database if it doesn't exist"""
        if not os.path.exists(DATABASE_PATH):
            logger.info("Database not found, creating new database...")
            conn = sqlite3.connect(DATABASE_PATH)
            cursor = conn.cursor()
            
            # Enhanced dictionary table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS dictionary (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    word TEXT UNIQUE NOT NULL,
                    word_lowercase TEXT NOT NULL,
                    definitions TEXT NOT NULL,
                    phonetic TEXT,
                    part_of_speech TEXT,
                    example TEXT,
                    etymology TEXT,
                    difficulty_level INTEGER DEFAULT 1,
                    word_length INTEGER,
                    is_common BOOLEAN DEFAULT 0,
                    usage_frequency INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Create indexes
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_word_lowercase ON dictionary(word_lowercase)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_part_of_speech ON dictionary(part_of_speech)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_difficulty ON dictionary(difficulty_level)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_word_length ON dictionary(word_length)')
            
            # Create FTS virtual table
            cursor.execute('''
                CREATE VIRTUAL TABLE IF NOT EXISTS dictionary_fts USING fts5(
                    word, definitions, example, content='dictionary', content_rowid='id'
                )
            ''')
            
            conn.commit()
            conn.close()
            logger.info("Database created successfully")
    
    def get_database_connection(self):
        """Get database connection with row factory"""
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    
    def get_word_count(self) -> int:
        """Get total number of words in database"""
        with self.get_database_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) FROM dictionary')
            return cursor.fetchone()[0]
    
    def get_word_definition(self, word: str) -> Optional[Dict]:
        """Get word definition from database"""
        with self.get_database_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT word, definitions, phonetic, part_of_speech, example, 
                       etymology, difficulty_level, is_common
                FROM dictionary 
                WHERE word_lowercase = ? LIMIT 1
            ''', (word.lower(),))
            
            row = cursor.fetchone()
            if row:
                return {
                    'word': row['word'],
                    'definitions': json.loads(row['definitions']) if row['definitions'] else [],
                    'phonetic': row['phonetic'] or '',
                    'part_of_speech': row['part_of_speech'] or '',
                    'example': row['example'] or '',
                    'etymology': row['etymology'] or '',
                    'difficulty_level': row['difficulty_level'],
                    'is_common': bool(row['is_common'])
                }
        return None
    
    def search_words(self, pattern: str, limit: int = 50, exact_match: bool = False) -> List[str]:
        """Search for words matching pattern"""
        with self.get_database_connection() as conn:
            cursor = conn.cursor()
            
            if exact_match:
                cursor.execute('''
                    SELECT word FROM dictionary 
                    WHERE word_lowercase = ?
                    LIMIT ?
                ''', (pattern.lower(), limit))
            else:
                cursor.execute('''
                    SELECT word FROM dictionary 
                    WHERE word_lowercase LIKE ? 
                    ORDER BY 
                        CASE WHEN word_lowercase = ? THEN 1 
                             WHEN word_lowercase LIKE ? THEN 2 
                             ELSE 3 END,
                        is_common DESC,
                        usage_frequency DESC,
                        word_length
                    LIMIT ?
                ''', (f'%{pattern.lower()}%', pattern.lower(), f'{pattern.lower()}%', limit))
            
            return [row['word'] for row in cursor.fetchall()]
    
    def get_random_words(self, count: int = 10, difficulty: Optional[int] = None, 
                        common_only: bool = False) -> List[Dict]:
        """Get random words from database"""
        with self.get_database_connection() as conn:
            cursor = conn.cursor()
            
            base_query = '''
                SELECT word, definitions, phonetic, part_of_speech, example, 
                       difficulty_level, is_common
                FROM dictionary 
                WHERE definitions != '[]' AND definitions != ''
            '''
            params = []
            
            if difficulty:
                base_query += ' AND difficulty_level = ?'
                params.append(difficulty)
            
            if common_only:
                base_query += ' AND is_common = 1'
            
            base_query += ' ORDER BY RANDOM() LIMIT ?'
            params.append(count)
            
            cursor.execute(base_query, params)
            
            results = []
            for row in cursor.fetchall():
                results.append({
                    'word': row['word'],
                    'definitions': json.loads(row['definitions']) if row['definitions'] else [],
                    'phonetic': row['phonetic'] or '',
                    'part_of_speech': row['part_of_speech'] or '',
                    'example': row['example'] or '',
                    'difficulty_level': row['difficulty_level'],
                    'is_common': bool(row['is_common'])
                })
            
            return results
    
    def full_text_search(self, query: str, limit: int = 50) -> List[Dict]:
        """Perform full-text search on words and definitions"""
        with self.get_database_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT d.word, d.definitions, d.phonetic, d.part_of_speech, 
                       d.example, d.difficulty_level, d.is_common
                FROM dictionary_fts fts
                JOIN dictionary d ON d.id = fts.rowid
                WHERE dictionary_fts MATCH ?
                ORDER BY rank
                LIMIT ?
            ''', (query, limit))
            
            results = []
            for row in cursor.fetchall():
                results.append({
                    'word': row['word'],
                    'definitions': json.loads(row['definitions']) if row['definitions'] else [],
                    'phonetic': row['phonetic'] or '',
                    'part_of_speech': row['part_of_speech'] or '',
                    'example': row['example'] or '',
                    'difficulty_level': row['difficulty_level'],
                    'is_common': bool(row['is_common'])
                })
            
            return results
    
    def get_words_by_criteria(self, part_of_speech: Optional[str] = None, 
                             difficulty: Optional[int] = None,
                             min_length: Optional[int] = None,
                             max_length: Optional[int] = None,
                             common_only: bool = False,
                             limit: int = 100) -> List[Dict]:
        """Get words by specific criteria"""
        with self.get_database_connection() as conn:
            cursor = conn.cursor()
            
            base_query = '''
                SELECT word, definitions, phonetic, part_of_speech, example, 
                       difficulty_level, is_common, word_length
                FROM dictionary 
                WHERE definitions != '[]' AND definitions != ''
            '''
            params = []
            
            if part_of_speech:
                base_query += ' AND part_of_speech = ?'
                params.append(part_of_speech)
            
            if difficulty:
                base_query += ' AND difficulty_level = ?'
                params.append(difficulty)
            
            if min_length:
                base_query += ' AND word_length >= ?'
                params.append(min_length)
            
            if max_length:
                base_query += ' AND word_length <= ?'
                params.append(max_length)
            
            if common_only:
                base_query += ' AND is_common = 1'
            
            base_query += ' ORDER BY is_common DESC, usage_frequency DESC, word LIMIT ?'
            params.append(limit)
            
            cursor.execute(base_query, params)
            
            results = []
            for row in cursor.fetchall():
                results.append({
                    'word': row['word'],
                    'definitions': json.loads(row['definitions']) if row['definitions'] else [],
                    'phonetic': row['phonetic'] or '',
                    'part_of_speech': row['part_of_speech'] or '',
                    'example': row['example'] or '',
                    'difficulty_level': row['difficulty_level'],
                    'is_common': bool(row['is_common']),
                    'word_length': row['word_length']
                })
            
            return results
    
    def get_statistics(self) -> Dict:
        """Get comprehensive database statistics"""
        with self.get_database_connection() as conn:
            cursor = conn.cursor()
            
            stats = {}
            
            # Total words
            cursor.execute('SELECT COUNT(*) FROM dictionary')
            stats['total_words'] = cursor.fetchone()[0]
            
            # Words with definitions
            cursor.execute('SELECT COUNT(*) FROM dictionary WHERE definitions != "[]" AND definitions != ""')
            stats['words_with_definitions'] = cursor.fetchone()[0]
            
            # Words by part of speech
            cursor.execute('''
                SELECT part_of_speech, COUNT(*) 
                FROM dictionary 
                WHERE part_of_speech != '' 
                GROUP BY part_of_speech 
                ORDER BY COUNT(*) DESC
            ''')
            stats['by_part_of_speech'] = dict(cursor.fetchall())
            
            # Words by difficulty
            cursor.execute('''
                SELECT difficulty_level, COUNT(*) 
                FROM dictionary 
                GROUP BY difficulty_level 
                ORDER BY difficulty_level
            ''')
            stats['by_difficulty'] = dict(cursor.fetchall())
            
            # Word length distribution
            cursor.execute('''
                SELECT word_length, COUNT(*) 
                FROM dictionary 
                WHERE word_length IS NOT NULL
                GROUP BY word_length 
                ORDER BY word_length
            ''')
            stats['by_length'] = dict(cursor.fetchall())
            
            # Common words
            cursor.execute('SELECT COUNT(*) FROM dictionary WHERE is_common = 1')
            stats['common_words'] = cursor.fetchone()[0]
            
            # Recent additions
            cursor.execute('SELECT COUNT(*) FROM dictionary WHERE date(created_at) = date("now")')
            stats['added_today'] = cursor.fetchone()[0]
            
            return stats

# Initialize API instance
dictionary_api = EnhancedDictionaryAPI()

# Rate limiting decorator
def rate_limit(max_requests: int = RATE_LIMIT_REQUESTS, window: int = RATE_LIMIT_WINDOW):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            client_ip = request.environ.get('HTTP_X_FORWARDED_FOR') or request.environ.get('REMOTE_ADDR')
            current_time = time.time()
            
            if client_ip not in dictionary_api.rate_limit_cache:
                dictionary_api.rate_limit_cache[client_ip] = []
            
            # Clean old requests
            dictionary_api.rate_limit_cache[client_ip] = [
                req_time for req_time in dictionary_api.rate_limit_cache[client_ip]
                if current_time - req_time < window
            ]
            
            # Check rate limit
            if len(dictionary_api.rate_limit_cache[client_ip]) >= max_requests:
                return jsonify({
                    'success': False,
                    'error': 'Rate limit exceeded. Please try again later.',
                    'rate_limit': {
                        'max_requests': max_requests,
                        'window_seconds': window
                    }
                }), 429
            
            # Add current request
            dictionary_api.rate_limit_cache[client_ip].append(current_time)
            
            return f(*args, **kwargs)
        return wrapper
    return decorator

# API Routes
@app.route('/')
def api_documentation():
    """API documentation page"""
    stats = dictionary_api.get_statistics()
    
    docs_html = '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Enhanced Dictionary API</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
            .header { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            .endpoint { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
            .method { background: #007bff; color: white; padding: 3px 8px; border-radius: 3px; font-size: 12px; }
            .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
            .stat-card { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
            pre { background: #f4f4f4; padding: 10px; border-radius: 3px; overflow-x: auto; }
            code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🔤 Enhanced Dictionary API</h1>
            <p>Comprehensive English dictionary service for static websites and applications</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <h3>{{ stats.total_words }}</h3>
                <p>Total Words</p>
            </div>
            <div class="stat-card">
                <h3>{{ stats.words_with_definitions }}</h3>
                <p>With Definitions</p>
            </div>
            <div class="stat-card">
                <h3>{{ stats.common_words }}</h3>
                <p>Common Words</p>
            </div>
            <div class="stat-card">
                <h3>{{ stats.added_today }}</h3>
                <p>Added Today</p>
            </div>
        </div>
        
        <h2>📖 API Endpoints</h2>
        
        <div class="endpoint">
            <h3><span class="method">GET</span> /api/word/{word}</h3>
            <p>Get detailed definition for a specific word</p>
            <pre>GET /api/word/beautiful</pre>
        </div>
        
        <div class="endpoint">
            <h3><span class="method">GET</span> /api/search</h3>
            <p>Search for words matching a pattern</p>
            <p><strong>Parameters:</strong> q (query), limit (max results), exact (boolean)</p>
            <pre>GET /api/search?q=beau&limit=10&exact=false</pre>
        </div>
        
        <div class="endpoint">
            <h3><span class="method">GET</span> /api/random</h3>
            <p>Get random words from the dictionary</p>
            <p><strong>Parameters:</strong> count, difficulty (1-10), common_only (boolean)</p>
            <pre>GET /api/random?count=5&difficulty=3&common_only=true</pre>
        </div>
        
        <div class="endpoint">
            <h3><span class="method">GET</span> /api/search/full-text</h3>
            <p>Full-text search across words and definitions</p>
            <p><strong>Parameters:</strong> q (query), limit (max results)</p>
            <pre>GET /api/search/full-text?q=happiness&limit=20</pre>
        </div>
        
        <div class="endpoint">
            <h3><span class="method">GET</span> /api/words/criteria</h3>
            <p>Get words by specific criteria</p>
            <p><strong>Parameters:</strong> part_of_speech, difficulty, min_length, max_length, common_only, limit</p>
            <pre>GET /api/words/criteria?part_of_speech=noun&difficulty=2&min_length=5</pre>
        </div>
        
        <div class="endpoint">
            <h3><span class="method">GET</span> /api/stats</h3>
            <p>Get comprehensive database statistics</p>
            <pre>GET /api/stats</pre>
        </div>
        
        <h2>🔧 Setup Instructions</h2>
        <ol>
            <li>Install dependencies: <code>pip install -r requirements.txt</code></li>
            <li>Populate database: <code>python populate_dictionary.py</code></li>
            <li>Run API: <code>python enhanced_api.py</code></li>
        </ol>
        
        <h2>📊 Database Statistics</h2>
        <p><strong>Parts of Speech:</strong> {{ stats.by_part_of_speech }}</p>
        <p><strong>Difficulty Levels:</strong> {{ stats.by_difficulty }}</p>
    </body>
    </html>
    '''
    
    from jinja2 import Template
    template = Template(docs_html)
    return template.render(stats=stats)

@app.route('/api/word/<word>')
@rate_limit()
def get_word_definition(word):
    """Get definition for a specific word"""
    if not word or len(word.strip()) < 1:
        return jsonify({
            'success': False,
            'error': 'Word parameter is required'
        }), 400
    
    word_data = dictionary_api.get_word_definition(word.strip())
    
    if word_data:
        return jsonify({
            'success': True,
            'data': word_data
        })
    else:
        return jsonify({
            'success': False,
            'error': f'Word "{word}" not found'
        }), 404

@app.route('/api/search')
@rate_limit()
def search_words():
    """Search for words matching a pattern"""
    query = request.args.get('q', '').strip()
    limit = min(int(request.args.get('limit', 50)), 100)
    exact = request.args.get('exact', 'false').lower() == 'true'
    
    if len(query) < 2:
        return jsonify({
            'success': False,
            'error': 'Query must be at least 2 characters long'
        }), 400
    
    words = dictionary_api.search_words(query, limit, exact)
    
    return jsonify({
        'success': True,
        'data': {
            'query': query,
            'count': len(words),
            'exact_match': exact,
            'words': words
        }
    })

@app.route('/api/random')
@rate_limit()
def get_random_words():
    """Get random words from the database"""
    count = min(int(request.args.get('count', 10)), 50)
    difficulty = request.args.get('difficulty', type=int)
    common_only = request.args.get('common_only', 'false').lower() == 'true'
    
    words = dictionary_api.get_random_words(count, difficulty, common_only)
    
    return jsonify({
        'success': True,
        'data': {
            'count': len(words),
            'difficulty_filter': difficulty,
            'common_only': common_only,
            'words': words
        }
    })

@app.route('/api/search/full-text')
@rate_limit()
def full_text_search():
    """Full-text search across words and definitions"""
    query = request.args.get('q', '').strip()
    limit = min(int(request.args.get('limit', 50)), 100)
    
    if len(query) < 2:
        return jsonify({
            'success': False,
            'error': 'Query must be at least 2 characters long'
        }), 400
    
    results = dictionary_api.full_text_search(query, limit)
    
    return jsonify({
        'success': True,
        'data': {
            'query': query,
            'count': len(results),
            'results': results
        }
    })

@app.route('/api/words/criteria')
@rate_limit()
def get_words_by_criteria():
    """Get words by specific criteria"""
    part_of_speech = request.args.get('part_of_speech')
    difficulty = request.args.get('difficulty', type=int)
    min_length = request.args.get('min_length', type=int)
    max_length = request.args.get('max_length', type=int)
    common_only = request.args.get('common_only', 'false').lower() == 'true'
    limit = min(int(request.args.get('limit', 100)), 200)
    
    words = dictionary_api.get_words_by_criteria(
        part_of_speech, difficulty, min_length, max_length, common_only, limit
    )
    
    return jsonify({
        'success': True,
        'data': {
            'criteria': {
                'part_of_speech': part_of_speech,
                'difficulty': difficulty,
                'min_length': min_length,
                'max_length': max_length,
                'common_only': common_only
            },
            'count': len(words),
            'words': words
        }
    })

@app.route('/api/stats')
@rate_limit()
def get_statistics():
    """Get comprehensive database statistics"""
    stats = dictionary_api.get_statistics()
    
    return jsonify({
        'success': True,
        'data': stats
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found',
        'available_endpoints': [
            '/api/word/{word}',
            '/api/search',
            '/api/random',
            '/api/search/full-text',
            '/api/words/criteria',
            '/api/stats'
        ]
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

if __name__ == '__main__':
    logger.info(f"Starting Enhanced Dictionary API...")
    logger.info(f"Database: {DATABASE_PATH}")
    logger.info(f"Total words in database: {dictionary_api.get_word_count()}")
    
    app.run(
        host=API_HOST,
        port=API_PORT,
        debug=os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    )
