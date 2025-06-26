# 📚 Comprehensive Dictionary API Backend

A powerful, multilingual backend service providing complete English dictionary functionality for static websites and applications. Features multiple implementation options (Python Flask, Java Spring Boot) and comprehensive word database with definitions, etymology, and advanced search capabilities.

## 🌟 Features

### Core Dictionary Features
- **Complete English Dictionary**: 50,000+ words with definitions
- **Word Definitions**: Detailed definitions from multiple sources
- **Phonetic Pronunciations**: IPA and simplified phonetics
- **Etymology**: Word origins and historical development
- **Usage Examples**: Real-world usage examples
- **Part of Speech**: Grammatical classifications
- **Difficulty Levels**: Words categorized by complexity (1-10)

### Advanced Search & Discovery
- **Fuzzy Search**: Find words with partial matches
- **Full-Text Search**: Search within definitions and examples
- **Advanced Filtering**: Filter by length, difficulty, part of speech
- **Random Words**: Get random words for games and learning
- **Word Relationships**: Synonyms, antonyms, and related words
- **Category-Based Search**: Words grouped by topics

### Performance & Scalability
- **Multiple Backends**: Python Flask and Java Spring Boot options
- **Database Options**: SQLite for development, PostgreSQL for production
- **Caching Layer**: Redis-compatible caching for high performance
- **Rate Limiting**: Built-in API rate limiting
- **CORS Support**: Ready for frontend integration

### Educational & Gaming Features
- **Common Words**: Pre-identified high-frequency words
- **Grade Level Classification**: Words categorized by reading level
- **Word of the Day**: Featured word functionality
- **Usage Statistics**: Track word lookup patterns
- **Learning Progress**: User interaction tracking

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

#### Windows
```bash
# Run the setup script
setup.bat
```

#### Linux/Mac
```bash
# Make setup script executable and run
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Setup

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Choose your setup option:

# Quick setup (5,000 words, ~5 minutes)
python app.py

# Comprehensive setup (50,000+ words, ~30 minutes)
python comprehensive_setup.py --max-definitions 10000

# Standard setup without API definitions (~10 minutes)
python comprehensive_setup.py --no-definitions
```

## 🔧 Running the API

### Python Flask API (Recommended for Development)
```bash
# Basic API
python app.py

# Enhanced API with advanced features
python enhanced_api.py
```

### Java Spring Boot API (Enterprise Grade)
```bash
cd java/
mvn spring-boot:run
```

The API will be available at:
- Python: `http://localhost:5000`
- Java: `http://localhost:8080`

## 📖 API Documentation

### Core Endpoints

#### Get Word Definition
```http
GET /api/word/{word}
```

**Example:**
```bash
curl http://localhost:5000/api/word/beautiful
```

**Response:**
```json
{
  "success": true,
  "data": {
    "word": "beautiful",
    "definitions": [
      "Pleasing the senses or mind aesthetically",
      "Of a very high standard; excellent"
    ],
    "phonetic": "/ˈbjuːtɪfʊl/",
    "part_of_speech": "adjective",
    "example": "She has a beautiful voice.",
    "difficulty_level": 2,
    "is_common": true
  }
}
```

#### Search Words
```http
GET /api/search?q={query}&limit={number}&exact={boolean}
```

**Parameters:**
- `q`: Search query (minimum 2 characters)
- `limit`: Maximum results (default: 50, max: 100)
- `exact`: Exact match only (default: false)

**Example:**
```bash
curl "http://localhost:5000/api/search?q=beau&limit=10"
```

#### Random Words
```http
GET /api/random?count={number}&difficulty={level}&common_only={boolean}
```

**Parameters:**
- `count`: Number of words (default: 10, max: 50)
- `difficulty`: Difficulty level 1-10 (optional)
- `common_only`: Only common words (default: false)

**Example:**
```bash
curl "http://localhost:5000/api/random?count=5&difficulty=3&common_only=true"
```

### Advanced Endpoints

#### Full-Text Search
```http
GET /api/search/full-text?q={query}&limit={number}
```
Search across words, definitions, and examples.

#### Advanced Criteria Search
```http
GET /api/words/criteria?part_of_speech={pos}&difficulty={level}&min_length={min}&max_length={max}&common_only={boolean}
```

Filter words by multiple criteria simultaneously.

#### Database Statistics
```http
GET /api/stats
```

Get comprehensive database statistics and word counts.

## 🗄️ Database Schema

### SQLite Schema (Development)
The system uses an enhanced SQLite schema with:
- Full-text search capabilities
- Comprehensive indexing for performance
- JSONB-like fields for flexible data storage

### PostgreSQL Schema (Production)
For production environments, use the enhanced PostgreSQL schema featuring:
- UUID primary keys
- Advanced text search with trigrams
- Materialized views for statistics
- Word relationships and categories
- User interaction tracking

## 🎮 Integration with Games

### For Word Games
```javascript
// Get random words for hangman/wordle
fetch('/api/random?count=1&difficulty=3')
  .then(response => response.json())
  .then(data => {
    const word = data.data.words[0].word;
    // Use word in your game
  });
```

### For Dictionary Lookup
```javascript
// Check if word exists and get definition
fetch(`/api/word/${userInput}`)
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showDefinition(data.data);
    } else {
      showError('Word not found');
    }
  });
```

### For Educational Apps
```javascript
// Get words by difficulty for learning
fetch('/api/words/criteria?difficulty=2&common_only=true&limit=20')
  .then(response => response.json())
  .then(data => {
    const words = data.data.words;
    // Use for vocabulary learning
  });
```

## 🔧 Configuration Options

### Environment Variables
```bash
# Database configuration
DATABASE_PATH=dictionary.db
DATABASE_URL=postgresql://user:pass@host:port/dbname

# API configuration
API_PORT=5000
API_HOST=0.0.0.0
FLASK_DEBUG=false

# Rate limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60

# External API settings
DICTIONARY_API_TIMEOUT=10
```

### Database Population Options
```bash
# Quick setup - basic words only
python comprehensive_setup.py --no-definitions

# Standard setup - with limited definitions
python comprehensive_setup.py --max-definitions 5000

# Full setup - comprehensive with definitions
python comprehensive_setup.py --max-definitions 20000

# Custom database path
python comprehensive_setup.py --database custom_dict.db
```

## 📊 Performance & Statistics

### Typical Database Sizes
- **Quick Setup**: ~5,000 words, 2MB database
- **Standard Setup**: ~50,000 words, 20MB database  
- **Full Setup**: ~50,000 words with definitions, 150MB database

### API Performance
- **Word Lookup**: < 10ms average response time
- **Search Queries**: < 50ms for complex searches
- **Random Words**: < 5ms response time
- **Statistics**: Cached, < 1ms response time

### Rate Limits
- Default: 100 requests per minute per IP
- Burst: Up to 10 simultaneous requests
- Configurable via environment variables

## 🔒 Security Features

- **CORS Protection**: Configurable origin restrictions
- **Rate Limiting**: Per-IP request throttling
- **Input Validation**: Sanitized search queries
- **SQL Injection Protection**: Parameterized queries
- **Error Handling**: Secure error messages

## 🐳 Docker Deployment

```dockerfile
# Create Dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "enhanced_api.py"]
```

```bash
# Build and run
docker build -t dictionary-api .
docker run -p 5000:5000 dictionary-api
```

## 📈 Monitoring & Analytics

### Built-in Metrics
- Request counts and response times
- Popular word lookups
- Search pattern analysis
- Error rate monitoring

### Database Health
- Word count tracking
- Definition coverage metrics
- Search performance monitoring

## 🤝 Contributing

### Adding New Words
```python
# Add words programmatically
from enhanced_api import dictionary_api

word_data = {
    "word": "serendipity",
    "definitions": ["The occurrence of events by chance in a happy way"],
    "part_of_speech": "noun",
    "difficulty_level": 6
}

dictionary_api.add_or_update_word(word_data)
```

### Extending the API
The modular design allows easy extension:
- Add new search algorithms
- Implement additional data sources
- Create custom word relationship types
- Add multilingual support

## 🔗 External Integration

### Supported Dictionary APIs
- Free Dictionary API (primary source)
- WordNet integration via NLTK
- Custom dictionary sources
- User-contributed definitions

### Data Sources
- NLTK Word Corpus
- Moby Word Lists
- Google Common Words
- Enable1 Word Lists
- Academic word lists (SAT, GRE)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Free Dictionary API for word definitions
- NLTK project for linguistic resources
- Princeton WordNet for semantic relationships
- Google Research for common word frequency data

---

**Built for MultigameApp by [Alex McVay](https://www.alexmcvay.icu)**

For support or questions, please open an issue on GitHub.

```bash
# Activate virtual environment (if not already active)
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Run the API
python app.py
```

The API will be available at `http://localhost:5000`

## API Endpoints

### GET /
Returns API documentation and statistics.

### GET /api/word/<word>
Get definition for a specific word.

**Example:**
```
GET /api/word/hello
```

**Response:**
```json
{
  "success": true,
  "data": {
    "word": "hello",
    "definitions": [
      "An expression of greeting",
      "Used to attract attention"
    ],
    "phonetic": "/həˈloʊ/",
    "part_of_speech": "exclamation",
    "example": "Hello, how are you?",
    "etymology": ""
  }
}
```

### GET /api/search?q=<query>&limit=<number>
Search for words matching a pattern.

**Parameters:**
- `q`: Search query (minimum 2 characters)
- `limit`: Maximum results (default: 50, max: 100)

**Example:**
```
GET /api/search?q=hel&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "hel",
    "count": 3,
    "words": ["hello", "help", "helmet"]
  }
}
```

### GET /api/random?count=<number>
Get random words from the database.

**Parameters:**
- `count`: Number of words to return (default: 10, max: 50)

**Example:**
```
GET /api/random?count=5
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5,
    "words": [
      {
        "word": "amazing",
        "definitions": ["Causing wonder or astonishment"],
        "phonetic": "/əˈmeɪzɪŋ/",
        "part_of_speech": "adjective",
        "example": "The view was amazing"
      }
    ]
  }
}
```

### GET /api/stats
Get database statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_words": 1250,
    "database_size": "2.45 MB"
  }
}
```

### POST /api/add-word
Add a new word to the database.

**Request Body:**
```json
{
  "word": "example"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Word 'example' added successfully",
  "data": {
    "word": "example",
    "definitions": ["A thing characteristic of its kind"],
    "phonetic": "/ɪɡˈzɑmpəl/",
    "part_of_speech": "noun",
    "example": "This is a good example"
  }
}
```

## Integration with Frontend

### JavaScript Example

```javascript
// Get word definition
async function getWordDefinition(word) {
    try {
        const response = await fetch(`http://localhost:5000/api/word/${word}`);
        const data = await response.json();
        
        if (data.success) {
            return data.data;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error fetching word definition:', error);
        return null;
    }
}

// Search for words
async function searchWords(query, limit = 20) {
    try {
        const response = await fetch(`http://localhost:5000/api/search?q=${encodeURIComponent(query)}&limit=${limit}`);
        const data = await response.json();
        
        if (data.success) {
            return data.data.words;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error searching words:', error);
        return [];
    }
}

// Get random words
async function getRandomWords(count = 10) {
    try {
        const response = await fetch(`http://localhost:5000/api/random?count=${count}`);
        const data = await response.json();
        
        if (data.success) {
            return data.data.words;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error fetching random words:', error);
        return [];
    }
}
```

## Database

The API uses SQLite for local storage with the following schema:

```sql
CREATE TABLE dictionary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT UNIQUE NOT NULL,
    definitions TEXT NOT NULL,
    phonetic TEXT,
    part_of_speech TEXT,
    example TEXT,
    etymology TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Data Source

Word definitions are fetched from the [Free Dictionary API](https://dictionaryapi.dev/) and cached locally for performance.

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

## Rate Limiting

The API implements basic rate limiting when fetching from external sources to be respectful to the Free Dictionary API.

## Development

To extend the API:

1. Add new endpoints in `app.py`
2. Modify the `DictionaryAPI` class for new functionality
3. Update the database schema if needed
4. Add corresponding frontend integration code

## License

Part of the MultigameApp project.
