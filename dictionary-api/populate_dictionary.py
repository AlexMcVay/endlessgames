#!/usr/bin/env python3
"""
Advanced Dictionary Population Service
Fetches words from multiple sources to create a comprehensive English dictionary
"""

import requests
import sqlite3
import json
import time
import logging
from typing import Dict, List, Optional, Set
import concurrent.futures
from dataclasses import dataclass
import re
import nltk
from nltk.corpus import words, wordnet
import threading

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class WordDefinition:
    word: str
    definitions: List[str]
    phonetic: str = ""
    part_of_speech: str = ""
    example: str = ""
    etymology: str = ""
    difficulty_level: int = 1
    is_common: bool = False

class DictionaryPopulator:
    def __init__(self, database_path: str = 'dictionary.db'):
        self.database_path = database_path
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'DictionaryAPI/1.0 Educational Use'
        })
        self.rate_limit_delay = 0.1  # 100ms between requests
        self.lock = threading.Lock()
        
        # Download required NLTK data
        self._setup_nltk()
        
        # Initialize database
        self.init_database()
    
    def _setup_nltk(self):
        """Download required NLTK datasets"""
        try:
            nltk.download('words', quiet=True)
            nltk.download('wordnet', quiet=True)
            nltk.download('omw-1.4', quiet=True)
        except Exception as e:
            logger.warning(f"Failed to download NLTK data: {e}")
    
    def init_database(self):
        """Initialize enhanced SQLite database"""
        conn = sqlite3.connect(self.database_path)
        cursor = conn.cursor()
        
        # Enhanced dictionary table with additional fields
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
        
        # Create indexes for better performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_word ON dictionary(word)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_word_lowercase ON dictionary(word_lowercase)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_part_of_speech ON dictionary(part_of_speech)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_difficulty ON dictionary(difficulty_level)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_word_length ON dictionary(word_length)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_is_common ON dictionary(is_common)')
        
        # Create full-text search virtual table
        cursor.execute('''
            CREATE VIRTUAL TABLE IF NOT EXISTS dictionary_fts USING fts5(
                word, definitions, example, content='dictionary', content_rowid='id'
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def get_nltk_words(self) -> Set[str]:
        """Get words from NLTK corpus"""
        try:
            word_list = set(words.words())
            logger.info(f"Retrieved {len(word_list)} words from NLTK corpus")
            return {word.lower() for word in word_list if len(word) >= 3 and word.isalpha()}
        except Exception as e:
            logger.error(f"Failed to get NLTK words: {e}")
            return set()
    
    def get_wordnet_words(self) -> Set[str]:
        """Get words from WordNet"""
        try:
            word_set = set()
            for synset in wordnet.all_synsets():
                for lemma in synset.lemmas():
                    word = lemma.name().replace('_', ' ').lower()
                    if len(word) >= 3 and re.match(r'^[a-z\s]+$', word):
                        word_set.add(word)
            logger.info(f"Retrieved {len(word_set)} words from WordNet")
            return word_set
        except Exception as e:
            logger.error(f"Failed to get WordNet words: {e}")
            return set()
    
    def get_common_words(self) -> List[str]:
        """Get most common English words"""
        return [
            # Top 1000 most common English words
            "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
            "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their",
            "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", "him",
            "know", "take", "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than", "then", "now", "look", "only",
            "come", "its", "over", "think", "also", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even", "new", "want",
            "because", "any", "these", "give", "day", "most", "us", "is", "was", "are", "been", "has", "had", "were", "said", "each", "which", "she",
            "do", "how", "their", "if", "will", "up", "other", "about", "out", "many", "then", "them", "these", "so", "some", "her", "would", "make",
            "like", "into", "him", "time", "has", "two", "more", "very", "what", "know", "just", "first", "get", "over", "think", "where", "much",
            "go", "well", "were", "right", "too", "any", "old", "see", "now", "way", "who", "oil", "sit", "but", "set", "man", "end", "why", "let",
            "great", "same", "big", "group", "begin", "seem", "country", "help", "talk", "turn", "ask", "show", "try", "last", "child", "need",
            "point", "hand", "high", "year", "part", "place", "right", "where", "going", "want", "school", "important", "until", "form", "food",
            "keep", "children", "feet", "land", "side", "without", "boy", "once", "animal", "life", "enough", "took", "sometimes", "four", "head",
            "above", "kind", "began", "almost", "live", "page", "got", "earth", "need", "far", "hand", "high", "year", "mother", "light", "country",
            "father", "let", "night", "picture", "being", "study", "second", "soon", "story", "since", "white", "ever", "paper", "hard", "near",
            "sentence", "better", "best", "across", "during", "today", "however", "sure", "knew", "it's", "try", "told", "young", "sun", "thing",
            "whole", "hear", "example", "heard", "several", "change", "answer", "room", "sea", "against", "top", "turned", "learn", "point",
            "city", "play", "toward", "five", "himself", "usually", "money", "seen", "didn't", "car", "morning", "i'm", "body", "upon", "family",
            "later", "turn", "move", "face", "door", "cut", "done", "group", "true", "leave", "few", "along", "while", "might", "close", "something",
            "seem", "next", "hard", "open", "example", "begin", "life", "always", "those", "both", "paper", "together", "got", "turn", "listed",
            "common", "turn", "simple", "set"
        ]
    
    def fetch_definition_from_api(self, word: str) -> Optional[WordDefinition]:
        """Fetch word definition from Free Dictionary API"""
        try:
            url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{word.lower()}"
            response = self.session.get(url, timeout=10)
            
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
                    
                    # Calculate difficulty based on word length and definition complexity
                    difficulty = min(max(1, len(word) // 2), 10)
                    
                    return WordDefinition(
                        word=word.lower(),
                        definitions=definitions,
                        phonetic=entry.get('phonetic', ''),
                        part_of_speech=part_of_speech,
                        example=example,
                        etymology='',
                        difficulty_level=difficulty,
                        is_common=word.lower() in self.get_common_words()
                    )
            
            return None
            
        except Exception as e:
            logger.error(f"Error fetching definition for {word}: {e}")
            return None
    
    def get_wordnet_definition(self, word: str) -> Optional[WordDefinition]:
        """Get definition from WordNet if API fails"""
        try:
            synsets = wordnet.synsets(word)
            if synsets:
                definitions = []
                part_of_speech = ""
                example = ""
                
                for synset in synsets[:3]:  # Take first 3 synsets
                    definition = synset.definition()
                    if definition:
                        definitions.append(definition)
                    
                    if not part_of_speech:
                        pos_map = {
                            'n': 'noun',
                            'v': 'verb',
                            'a': 'adjective',
                            's': 'adjective',
                            'r': 'adverb'
                        }
                        part_of_speech = pos_map.get(synset.pos(), 'unknown')
                    
                    if not example and synset.examples():
                        example = synset.examples()[0]
                
                if definitions:
                    difficulty = min(max(1, len(word) // 2), 10)
                    
                    return WordDefinition(
                        word=word.lower(),
                        definitions=definitions,
                        phonetic='',
                        part_of_speech=part_of_speech,
                        example=example,
                        etymology='',
                        difficulty_level=difficulty,
                        is_common=word.lower() in self.get_common_words()
                    )
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting WordNet definition for {word}: {e}")
            return None
    
    def store_word(self, word_def: WordDefinition):
        """Store word definition in database"""
        with self.lock:
            conn = sqlite3.connect(self.database_path)
            cursor = conn.cursor()
            
            try:
                cursor.execute('''
                    INSERT OR REPLACE INTO dictionary 
                    (word, word_lowercase, definitions, phonetic, part_of_speech, example, 
                     etymology, difficulty_level, word_length, is_common, usage_frequency)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    word_def.word,
                    word_def.word.lower(),
                    json.dumps(word_def.definitions),
                    word_def.phonetic,
                    word_def.part_of_speech,
                    word_def.example,
                    word_def.etymology,
                    word_def.difficulty_level,
                    len(word_def.word),
                    1 if word_def.is_common else 0,
                    1 if word_def.is_common else 0
                ))
                
                # Update FTS table
                cursor.execute('''
                    INSERT OR REPLACE INTO dictionary_fts(rowid, word, definitions, example)
                    SELECT id, word, definitions, example FROM dictionary WHERE word = ?
                ''', (word_def.word,))
                
                conn.commit()
                
            except Exception as e:
                logger.error(f"Error storing word {word_def.word}: {e}")
            finally:
                conn.close()
    
    def word_exists(self, word: str) -> bool:
        """Check if word already exists in database"""
        conn = sqlite3.connect(self.database_path)
        cursor = conn.cursor()
        cursor.execute('SELECT 1 FROM dictionary WHERE word = ? LIMIT 1', (word.lower(),))
        exists = cursor.fetchone() is not None
        conn.close()
        return exists
    
    def process_word(self, word: str) -> bool:
        """Process a single word - fetch definition and store"""
        if self.word_exists(word):
            return True
        
        # Try API first
        word_def = self.fetch_definition_from_api(word)
        
        # Fall back to WordNet if API fails
        if not word_def:
            word_def = self.get_wordnet_definition(word)
        
        # Store basic entry if no definition found
        if not word_def:
            word_def = WordDefinition(
                word=word.lower(),
                definitions=[f"English word: {word}"],
                part_of_speech="unknown",
                difficulty_level=min(max(1, len(word) // 2), 10),
                is_common=word.lower() in self.get_common_words()
            )
        
        if word_def:
            self.store_word(word_def)
            return True
        
        return False
    
    def populate_database(self, max_words: int = 10000, max_workers: int = 10):
        """Populate database with comprehensive word list"""
        logger.info("Starting database population...")
        
        # Get word lists from multiple sources
        nltk_words = self.get_nltk_words()
        wordnet_words = self.get_wordnet_words()
        common_words = set(self.get_common_words())
        
        # Combine and prioritize words
        all_words = list(common_words) + list(nltk_words.union(wordnet_words))
        
        # Remove duplicates while preserving order (common words first)
        seen = set()
        unique_words = []
        for word in all_words:
            if word not in seen and len(word) >= 2:
                seen.add(word)
                unique_words.append(word)
        
        # Limit to max_words
        words_to_process = unique_words[:max_words]
        
        logger.info(f"Processing {len(words_to_process)} words...")
        
        processed_count = 0
        failed_count = 0
        
        # Use ThreadPoolExecutor for concurrent processing
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all tasks
            future_to_word = {
                executor.submit(self.process_word, word): word 
                for word in words_to_process
            }
            
            # Process completed tasks
            for future in concurrent.futures.as_completed(future_to_word):
                word = future_to_word[future]
                try:
                    success = future.result()
                    if success:
                        processed_count += 1
                    else:
                        failed_count += 1
                    
                    if processed_count % 100 == 0:
                        logger.info(f"Processed {processed_count} words...")
                    
                    # Rate limiting
                    time.sleep(self.rate_limit_delay)
                    
                except Exception as e:
                    logger.error(f"Error processing word {word}: {e}")
                    failed_count += 1
        
        logger.info(f"Database population complete! Processed: {processed_count}, Failed: {failed_count}")
    
    def get_database_stats(self) -> Dict:
        """Get database statistics"""
        conn = sqlite3.connect(self.database_path)
        cursor = conn.cursor()
        
        stats = {}
        
        # Total words
        cursor.execute('SELECT COUNT(*) FROM dictionary')
        stats['total_words'] = cursor.fetchone()[0]
        
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
        
        # Common words count
        cursor.execute('SELECT COUNT(*) FROM dictionary WHERE is_common = 1')
        stats['common_words'] = cursor.fetchone()[0]
        
        conn.close()
        return stats

def main():
    """Main function to populate the dictionary"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Populate dictionary database')
    parser.add_argument('--max-words', type=int, default=10000, 
                       help='Maximum number of words to process (default: 10000)')
    parser.add_argument('--max-workers', type=int, default=10, 
                       help='Maximum number of worker threads (default: 10)')
    parser.add_argument('--database', type=str, default='dictionary.db', 
                       help='Database file path (default: dictionary.db)')
    
    args = parser.parse_args()
    
    # Create populator and run
    populator = DictionaryPopulator(args.database)
    
    # Show initial stats
    initial_stats = populator.get_database_stats()
    logger.info(f"Initial database stats: {initial_stats}")
    
    # Populate database
    populator.populate_database(args.max_words, args.max_workers)
    
    # Show final stats
    final_stats = populator.get_database_stats()
    logger.info(f"Final database stats: {final_stats}")

if __name__ == "__main__":
    main()
