#!/usr/bin/env python3
"""
Comprehensive Dictionary Setup and Population Script
Downloads and processes multiple dictionary sources to create a complete English dictionary
"""

import os
import sys
import json
import sqlite3
import requests
import zipfile
import csv
from pathlib import Path
import time
import logging
from typing import Dict, List, Set, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
import argparse

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ComprehensiveDictionaryBuilder:
    """
    Builds a comprehensive English dictionary from multiple sources
    """
    
    def __init__(self, database_path: str = "dictionary.db"):
        self.database_path = database_path
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Educational Dictionary Builder/1.0'
        })
        
        # Dictionary sources
        self.sources = {
            'wordnet': {
                'url': 'https://wordnetcode.princeton.edu/wn3.1.dict.tar.gz',
                'type': 'wordnet'
            },
            'moby': {
                'url': 'https://raw.githubusercontent.com/words/moby/master/words.txt',
                'type': 'wordlist'
            },
            'enable': {
                'url': 'https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt',
                'type': 'wordlist'
            },
            'common_words': {
                'url': 'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english.txt',
                'type': 'frequency_list'
            }
        }
        
        self.processed_words = set()
        self.init_database()
    
    def init_database(self):
        """Initialize the database with proper schema"""
        logger.info("Initializing database...")
        
        conn = sqlite3.connect(self.database_path)
        cursor = conn.cursor()
        
        # Drop existing table if exists (for fresh start)
        cursor.execute('DROP TABLE IF EXISTS dictionary')
        cursor.execute('DROP TABLE IF EXISTS dictionary_fts')
        
        # Create enhanced dictionary table
        cursor.execute('''
            CREATE TABLE dictionary (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                word TEXT UNIQUE NOT NULL,
                word_lowercase TEXT NOT NULL,
                definitions TEXT NOT NULL DEFAULT '[]',
                phonetic TEXT DEFAULT '',
                part_of_speech TEXT DEFAULT '',
                example TEXT DEFAULT '',
                etymology TEXT DEFAULT '',
                difficulty_level INTEGER DEFAULT 1,
                word_length INTEGER NOT NULL,
                is_common BOOLEAN DEFAULT 0,
                frequency_rank INTEGER DEFAULT 999999,
                syllable_count INTEGER DEFAULT 1,
                source TEXT DEFAULT 'unknown',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create indexes for performance
        indexes = [
            'CREATE INDEX idx_word_lowercase ON dictionary(word_lowercase)',
            'CREATE INDEX idx_part_of_speech ON dictionary(part_of_speech)',
            'CREATE INDEX idx_difficulty ON dictionary(difficulty_level)',
            'CREATE INDEX idx_word_length ON dictionary(word_length)',
            'CREATE INDEX idx_is_common ON dictionary(is_common)',
            'CREATE INDEX idx_frequency_rank ON dictionary(frequency_rank)'
        ]
        
        for index in indexes:
            cursor.execute(index)
        
        # Create FTS virtual table
        cursor.execute('''
            CREATE VIRTUAL TABLE dictionary_fts USING fts5(
                word, definitions, example, content='dictionary', content_rowid='id'
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("Database initialized successfully")
    
    def download_file(self, url: str, filename: str) -> bool:
        """Download a file from URL"""
        try:
            logger.info(f"Downloading {filename} from {url}")
            response = self.session.get(url, stream=True, timeout=30)
            response.raise_for_status()
            
            with open(filename, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            logger.info(f"Downloaded {filename} successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to download {filename}: {e}")
            return False
    
    def get_common_words_list(self) -> Set[str]:
        """Get list of most common English words"""
        common_words = {
            "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with",
            "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her",
            "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up",
            "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time",
            "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", "could",
            "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think",
            "also", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even",
            "new", "want", "because", "any", "these", "give", "day", "most", "us", "is", "was", "are",
            "been", "has", "had", "were", "said", "each", "which", "do", "how", "their", "if", "will",
            "up", "other", "about", "out", "many", "then", "them", "these", "so", "some", "her", "would",
            "make", "like", "into", "him", "time", "has", "two", "more", "very", "what", "know", "just",
            "first", "get", "over", "think", "where", "much", "go", "well", "were", "right", "too", "any",
            "old", "see", "now", "way", "who", "may", "come", "could", "day", "work", "use", "year", "back",
            "through", "still", "want", "should", "also", "after", "being", "now", "made", "before", "here",
            "through", "when", "much", "before", "some", "me", "back", "other", "many", "than", "then",
            "them", "these", "so", "some", "her", "would", "make", "like", "into", "him", "time", "has",
            "two", "more", "very", "what", "know", "water", "than", "call", "first", "who", "may", "down",
            "side", "been", "now", "find", "any", "new", "work", "part", "take", "get", "place", "made",
            "live", "where", "after", "back", "little", "only", "round", "man", "year", "came", "show",
            "every", "good", "me", "give", "our", "under", "name", "very", "through", "just", "form",
            "sentence", "great", "think", "say", "help", "low", "line", "differ", "turn", "cause", "much",
            "mean", "before", "move", "right", "boy", "old", "too", "same", "tell", "does", "set", "three",
            "want", "air", "well", "also", "play", "small", "end", "put", "home", "read", "hand", "port",
            "large", "spell", "add", "even", "land", "here", "must", "big", "high", "such", "follow",
            "act", "why", "ask", "men", "change", "went", "light", "kind", "off", "need", "house", "picture",
            "try", "us", "again", "animal", "point", "mother", "world", "near", "build", "self", "earth",
            "father", "head", "stand", "own", "page", "should", "country", "found", "answer", "school",
            "grow", "study", "still", "learn", "plant", "cover", "food", "sun", "four", "between", "state",
            "keep", "eye", "never", "last", "let", "thought", "city", "tree", "cross", "farm", "hard",
            "start", "might", "story", "saw", "far", "sea", "draw", "left", "late", "run", "dont", "while",
            "press", "close", "night", "real", "life", "few", "north", "open", "seem", "together", "next",
            "white", "children", "begin", "got", "walk", "example", "ease", "paper", "group", "always",
            "music", "those", "both", "mark", "often", "letter", "until", "mile", "river", "car", "feet",
            "care", "second", "book", "carry", "took", "science", "eat", "room", "friend", "began", "idea",
            "fish", "mountain", "stop", "once", "base", "hear", "horse", "cut", "sure", "watch", "color",
            "face", "wood", "main", "enough", "plain", "girl", "usual", "young", "ready", "above", "ever",
            "red", "list", "though", "feel", "talk", "bird", "soon", "body", "dog", "family", "direct",
            "leave", "song", "measure", "door", "product", "black", "short", "numeral", "class", "wind",
            "question", "happen", "complete", "ship", "area", "half", "rock", "order", "fire", "south",
            "problem", "piece", "told", "knew", "pass", "since", "top", "whole", "king", "space", "heard",
            "best", "hour", "better", "during", "hundred", "five", "remember", "step", "early", "hold",
            "west", "ground", "interest", "reach", "fast", "verb", "sing", "listen", "six", "table",
            "travel", "less", "morning", "ten", "simple", "several", "vowel", "toward", "war", "lay",
            "against", "pattern", "slow", "center", "love", "person", "money", "serve", "appear", "road",
            "map", "rain", "rule", "govern", "pull", "cold", "notice", "voice", "unit", "power", "town",
            "fine", "certain", "fly", "fall", "lead", "cry", "dark", "machine", "note", "wait", "plan",
            "figure", "star", "box", "noun", "field", "rest", "correct", "able", "pound", "done", "beauty",
            "drive", "stood", "contain", "front", "teach", "week", "final", "gave", "green", "oh", "quick",
            "develop", "ocean", "warm", "free", "minute", "strong", "special", "mind", "behind", "clear",
            "tail", "produce", "fact", "street", "inch", "multiply", "nothing", "course", "stay", "wheel",
            "full", "force", "blue", "object", "decide", "surface", "deep", "moon", "island", "foot",
            "system", "busy", "test", "record", "boat", "common", "gold", "possible", "plane", "stead",
            "dry", "wonder", "laugh", "thousands", "ago", "ran", "check", "game", "shape", "equate",
            "hot", "miss", "brought", "heat", "snow", "tire", "bring", "yes", "distant", "fill", "east",
            "paint", "language", "among"
        }
        
        return common_words
    
    def process_wordlist_file(self, filename: str, source_name: str) -> int:
        """Process a simple wordlist file"""
        added_count = 0
        
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                words = [line.strip().lower() for line in f if line.strip()]
            
            logger.info(f"Processing {len(words)} words from {source_name}")
            
            conn = sqlite3.connect(self.database_path)
            cursor = conn.cursor()
            
            common_words = self.get_common_words_list()
            
            for i, word in enumerate(words):
                if (len(word) >= 2 and word.isalpha() and 
                    word not in self.processed_words):
                    
                    is_common = word in common_words
                    frequency_rank = i + 1 if source_name == 'common_words' else 999999
                    difficulty = min(max(1, len(word) // 2), 10)
                    
                    try:
                        cursor.execute('''
                            INSERT OR IGNORE INTO dictionary 
                            (word, word_lowercase, word_length, is_common, 
                             frequency_rank, difficulty_level, source)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        ''', (
                            word, word.lower(), len(word), 
                            1 if is_common else 0, frequency_rank, 
                            difficulty, source_name
                        ))
                        
                        if cursor.rowcount > 0:
                            added_count += 1
                            self.processed_words.add(word)
                        
                    except sqlite3.Error as e:
                        logger.warning(f"Error inserting word {word}: {e}")
                
                if i % 1000 == 0:
                    conn.commit()
                    logger.info(f"Processed {i} words from {source_name}")
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error processing {filename}: {e}")
        
        return added_count
    
    def fetch_definitions_from_api(self, words: List[str], max_workers: int = 5) -> int:
        """Fetch definitions for words from dictionary API"""
        added_definitions = 0
        
        logger.info(f"Fetching definitions for {len(words)} words...")
        
        def fetch_single_definition(word: str) -> bool:
            try:
                url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}"
                response = self.session.get(url, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if data and len(data) > 0:
                        entry = data[0]
                        
                        definitions = []
                        part_of_speech = ""
                        example = ""
                        phonetic = entry.get('phonetic', '')
                        
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
                        
                        # Update database
                        conn = sqlite3.connect(self.database_path)
                        cursor = conn.cursor()
                        
                        cursor.execute('''
                            UPDATE dictionary 
                            SET definitions = ?, phonetic = ?, part_of_speech = ?, 
                                example = ?, updated_at = CURRENT_TIMESTAMP
                            WHERE word_lowercase = ?
                        ''', (
                            json.dumps(definitions), phonetic, 
                            part_of_speech, example, word.lower()
                        ))
                        
                        conn.commit()
                        conn.close()
                        
                        return True
                
                time.sleep(0.1)  # Rate limiting
                return False
                
            except Exception as e:
                logger.warning(f"Error fetching definition for {word}: {e}")
                return False
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_word = {
                executor.submit(fetch_single_definition, word): word 
                for word in words
            }
            
            for future in as_completed(future_to_word):
                word = future_to_word[future]
                try:
                    if future.result():
                        added_definitions += 1
                    
                    if added_definitions % 50 == 0:
                        logger.info(f"Added definitions for {added_definitions} words")
                        
                except Exception as e:
                    logger.error(f"Error processing {word}: {e}")
        
        return added_definitions
    
    def get_words_without_definitions(self, limit: int = 1000) -> List[str]:
        """Get words that don't have definitions yet"""
        conn = sqlite3.connect(self.database_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT word FROM dictionary 
            WHERE definitions = '[]' OR definitions = '' OR definitions IS NULL
            ORDER BY is_common DESC, frequency_rank ASC, word_length ASC
            LIMIT ?
        ''', (limit,))
        
        words = [row[0] for row in cursor.fetchall()]
        conn.close()
        
        return words
    
    def update_fts_table(self):
        """Update the full-text search table"""
        logger.info("Updating full-text search table...")
        
        conn = sqlite3.connect(self.database_path)
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM dictionary_fts')
        cursor.execute('''
            INSERT INTO dictionary_fts(rowid, word, definitions, example)
            SELECT id, word, definitions, example FROM dictionary
        ''')
        
        conn.commit()
        conn.close()
        
        logger.info("Full-text search table updated")
    
    def get_statistics(self) -> Dict:
        """Get current database statistics"""
        conn = sqlite3.connect(self.database_path)
        cursor = conn.cursor()
        
        stats = {}
        
        # Total words
        cursor.execute('SELECT COUNT(*) FROM dictionary')
        stats['total_words'] = cursor.fetchone()[0]
        
        # Words with definitions
        cursor.execute('''
            SELECT COUNT(*) FROM dictionary 
            WHERE definitions != '[]' AND definitions != '' AND definitions IS NOT NULL
        ''')
        stats['words_with_definitions'] = cursor.fetchone()[0]
        
        # Common words
        cursor.execute('SELECT COUNT(*) FROM dictionary WHERE is_common = 1')
        stats['common_words'] = cursor.fetchone()[0]
        
        # By difficulty
        cursor.execute('''
            SELECT difficulty_level, COUNT(*) FROM dictionary 
            GROUP BY difficulty_level ORDER BY difficulty_level
        ''')
        stats['by_difficulty'] = dict(cursor.fetchall())
        
        # By part of speech
        cursor.execute('''
            SELECT part_of_speech, COUNT(*) FROM dictionary 
            WHERE part_of_speech != '' AND part_of_speech IS NOT NULL
            GROUP BY part_of_speech ORDER BY COUNT(*) DESC
        ''')
        stats['by_part_of_speech'] = dict(cursor.fetchall())
        
        conn.close()
        return stats
    
    def build_dictionary(self, fetch_definitions: bool = True, max_definition_requests: int = 1000):
        """Main method to build the comprehensive dictionary"""
        logger.info("Starting comprehensive dictionary build...")
        
        # Download and process word sources
        for source_name, source_info in self.sources.items():
            try:
                filename = f"{source_name}.txt"
                
                if source_info['type'] in ['wordlist', 'frequency_list']:
                    if self.download_file(source_info['url'], filename):
                        added = self.process_wordlist_file(filename, source_name)
                        logger.info(f"Added {added} words from {source_name}")
                        
                        # Clean up downloaded file
                        try:
                            os.remove(filename)
                        except:
                            pass
                
            except Exception as e:
                logger.error(f"Error processing source {source_name}: {e}")
        
        # Add built-in common words if not already added
        common_words = self.get_common_words_list()
        conn = sqlite3.connect(self.database_path)
        cursor = conn.cursor()
        
        for word in common_words:
            if word not in self.processed_words:
                try:
                    cursor.execute('''
                        INSERT OR IGNORE INTO dictionary 
                        (word, word_lowercase, word_length, is_common, 
                         frequency_rank, difficulty_level, source)
                        VALUES (?, ?, ?, 1, 1, ?, 'builtin')
                    ''', (word, word.lower(), len(word), min(max(1, len(word) // 2), 10)))
                    
                    if cursor.rowcount > 0:
                        self.processed_words.add(word)
                
                except sqlite3.Error:
                    pass
        
        conn.commit()
        conn.close()
        
        # Fetch definitions from API
        if fetch_definitions:
            words_without_defs = self.get_words_without_definitions(max_definition_requests)
            if words_without_defs:
                added_defs = self.fetch_definitions_from_api(words_without_defs)
                logger.info(f"Added definitions for {added_defs} words")
        
        # Update FTS table
        self.update_fts_table()
        
        # Print final statistics
        stats = self.get_statistics()
        logger.info("Dictionary build complete!")
        logger.info(f"Final statistics: {json.dumps(stats, indent=2)}")

def main():
    parser = argparse.ArgumentParser(description='Build comprehensive English dictionary')
    parser.add_argument('--database', default='dictionary.db', 
                       help='Database file path (default: dictionary.db)')
    parser.add_argument('--no-definitions', action='store_true',
                       help='Skip fetching definitions from API')
    parser.add_argument('--max-definitions', type=int, default=1000,
                       help='Maximum number of definitions to fetch (default: 1000)')
    
    args = parser.parse_args()
    
    builder = ComprehensiveDictionaryBuilder(args.database)
    builder.build_dictionary(
        fetch_definitions=not args.no_definitions,
        max_definition_requests=args.max_definitions
    )

if __name__ == "__main__":
    main()
