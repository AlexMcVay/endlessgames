-- Enhanced PostgreSQL Schema for Comprehensive English Dictionary
-- This schema supports a full English dictionary with advanced features

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Main dictionary table with comprehensive word information
CREATE TABLE IF NOT EXISTS words (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    word VARCHAR(100) NOT NULL UNIQUE,
    word_lowercase VARCHAR(100) NOT NULL,
    word_normalized VARCHAR(100) NOT NULL, -- normalized for better searching
    
    -- Definition and meaning data
    definitions JSONB NOT NULL DEFAULT '[]',
    short_definition TEXT,
    
    -- Linguistic information
    phonetic VARCHAR(200),
    ipa_pronunciation VARCHAR(200),
    part_of_speech VARCHAR(50),
    grammatical_info JSONB DEFAULT '{}', -- plurals, verb forms, etc.
    
    -- Usage information
    example_sentences JSONB DEFAULT '[]',
    common_phrases JSONB DEFAULT '[]',
    usage_notes TEXT,
    
    -- Etymology and origin
    etymology TEXT,
    origin_language VARCHAR(50),
    first_known_use VARCHAR(20), -- year or period
    
    -- Classification and difficulty
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 10),
    word_length INTEGER GENERATED ALWAYS AS (char_length(word)) STORED,
    syllable_count INTEGER,
    
    -- Frequency and popularity
    frequency_rank INTEGER, -- 1 = most common
    is_common BOOLEAN DEFAULT FALSE,
    is_archaic BOOLEAN DEFAULT FALSE,
    is_informal BOOLEAN DEFAULT FALSE,
    is_technical BOOLEAN DEFAULT FALSE,
    
    -- Academic and educational
    grade_level INTEGER, -- reading grade level
    sat_word BOOLEAN DEFAULT FALSE,
    gre_word BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(100), -- where the definition came from
    verified BOOLEAN DEFAULT FALSE
);

-- Word relationships table for synonyms, antonyms, etc.
CREATE TABLE IF NOT EXISTS word_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    target_word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL, -- 'synonym', 'antonym', 'hypernym', 'hyponym', etc.
    strength DECIMAL(3,2) DEFAULT 1.00, -- relationship strength 0.00-1.00
    context VARCHAR(100), -- in what context this relationship applies
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_word_id, target_word_id, relationship_type)
);

-- Word categories and tags
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_category_id UUID REFERENCES categories(id),
    color_code VARCHAR(7), -- hex color for UI
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Many-to-many relationship between words and categories
CREATE TABLE IF NOT EXISTS word_categories (
    word_id UUID REFERENCES words(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    relevance_score DECIMAL(3,2) DEFAULT 1.00,
    PRIMARY KEY (word_id, category_id)
);

-- Word forms table (plurals, verb conjugations, etc.)
CREATE TABLE IF NOT EXISTS word_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    form_type VARCHAR(50) NOT NULL, -- 'plural', 'past_tense', 'gerund', etc.
    word_form VARCHAR(100) NOT NULL,
    is_irregular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(base_word_id, form_type, word_form)
);

-- User interaction tracking (for learning apps)
CREATE TABLE IF NOT EXISTS user_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) NOT NULL, -- session ID or user ID
    word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL, -- 'lookup', 'favorite', 'learned', etc.
    interaction_data JSONB DEFAULT '{}', -- additional data about the interaction
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Word of the day table
CREATE TABLE IF NOT EXISTS word_of_the_day (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    word_id UUID NOT NULL REFERENCES words(id),
    featured_date DATE NOT NULL UNIQUE,
    featured_reason TEXT, -- why this word was chosen
    fun_fact TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API usage tracking
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint VARCHAR(100) NOT NULL,
    client_ip INET,
    user_agent TEXT,
    query_params JSONB DEFAULT '{}',
    response_time_ms INTEGER,
    status_code INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create comprehensive indexes for performance
CREATE INDEX IF NOT EXISTS idx_words_word_lowercase ON words(word_lowercase);
CREATE INDEX IF NOT EXISTS idx_words_word_normalized ON words(word_normalized);
CREATE INDEX IF NOT EXISTS idx_words_part_of_speech ON words(part_of_speech);
CREATE INDEX IF NOT EXISTS idx_words_difficulty_level ON words(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_words_word_length ON words(word_length);
CREATE INDEX IF NOT EXISTS idx_words_frequency_rank ON words(frequency_rank);
CREATE INDEX IF NOT EXISTS idx_words_is_common ON words(is_common);
CREATE INDEX IF NOT EXISTS idx_words_grade_level ON words(grade_level);
CREATE INDEX IF NOT EXISTS idx_words_created_at ON words(created_at);

-- Trigram indexes for fuzzy searching
CREATE INDEX IF NOT EXISTS idx_words_word_trgm ON words USING gin(word gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_words_word_lowercase_trgm ON words USING gin(word_lowercase gin_trgm_ops);

-- GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_words_definitions_gin ON words USING gin(definitions);
CREATE INDEX IF NOT EXISTS idx_words_example_sentences_gin ON words USING gin(example_sentences);
CREATE INDEX IF NOT EXISTS idx_words_grammatical_info_gin ON words USING gin(grammatical_info);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_words_definitions_fts ON words USING gin(to_tsvector('english', 
    COALESCE(short_definition, '') || ' ' || COALESCE(definitions::text, '')));

-- Relationship indexes
CREATE INDEX IF NOT EXISTS idx_word_relationships_source ON word_relationships(source_word_id);
CREATE INDEX IF NOT EXISTS idx_word_relationships_target ON word_relationships(target_word_id);
CREATE INDEX IF NOT EXISTS idx_word_relationships_type ON word_relationships(relationship_type);

-- Category indexes
CREATE INDEX IF NOT EXISTS idx_word_categories_word ON word_categories(word_id);
CREATE INDEX IF NOT EXISTS idx_word_categories_category ON word_categories(category_id);

-- User interaction indexes
CREATE INDEX IF NOT EXISTS idx_user_interactions_user ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_word ON user_interactions(word_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_created ON user_interactions(created_at);

-- Functions and triggers

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to normalize words (remove accents, convert to lowercase)
CREATE OR REPLACE FUNCTION normalize_word(input_word TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(unaccent(trim(input_word)));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_words_updated_at BEFORE UPDATE ON words
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically set word_normalized
CREATE OR REPLACE FUNCTION set_word_normalized()
RETURNS TRIGGER AS $$
BEGIN
    NEW.word_normalized = normalize_word(NEW.word);
    NEW.word_lowercase = lower(NEW.word);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_word_normalized_trigger BEFORE INSERT OR UPDATE ON words
FOR EACH ROW EXECUTE FUNCTION set_word_normalized();

-- Views for common queries

-- View for common words with full information
CREATE OR REPLACE VIEW common_words AS
SELECT 
    w.*,
    array_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as categories
FROM words w
LEFT JOIN word_categories wc ON w.id = wc.word_id
LEFT JOIN categories c ON wc.category_id = c.id
WHERE w.is_common = TRUE
GROUP BY w.id
ORDER BY w.frequency_rank NULLS LAST, w.word;

-- View for advanced word search
CREATE OR REPLACE VIEW word_search_view AS
SELECT 
    w.id,
    w.word,
    w.word_lowercase,
    w.short_definition,
    w.part_of_speech,
    w.difficulty_level,
    w.is_common,
    w.frequency_rank,
    array_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as categories,
    array_agg(DISTINCT rel_words.word) FILTER (WHERE rel_words.word IS NOT NULL) as related_words
FROM words w
LEFT JOIN word_categories wc ON w.id = wc.word_id
LEFT JOIN categories c ON wc.category_id = c.id
LEFT JOIN word_relationships wr ON w.id = wr.source_word_id
LEFT JOIN words rel_words ON wr.target_word_id = rel_words.id
GROUP BY w.id, w.word, w.word_lowercase, w.short_definition, w.part_of_speech, 
         w.difficulty_level, w.is_common, w.frequency_rank;

-- Useful functions for the API

-- Function to get random words by criteria
CREATE OR REPLACE FUNCTION get_random_words(
    word_count INTEGER DEFAULT 10,
    difficulty_filter INTEGER DEFAULT NULL,
    pos_filter VARCHAR DEFAULT NULL,
    common_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
    word VARCHAR,
    definitions JSONB,
    part_of_speech VARCHAR,
    difficulty_level INTEGER,
    is_common BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.word,
        w.definitions,
        w.part_of_speech,
        w.difficulty_level,
        w.is_common
    FROM words w
    WHERE 
        (difficulty_filter IS NULL OR w.difficulty_level = difficulty_filter)
        AND (pos_filter IS NULL OR w.part_of_speech = pos_filter)
        AND (NOT common_only OR w.is_common = TRUE)
        AND w.definitions != '[]'
    ORDER BY RANDOM()
    LIMIT word_count;
END;
$$ LANGUAGE plpgsql;

-- Function for fuzzy word search
CREATE OR REPLACE FUNCTION fuzzy_word_search(
    search_term VARCHAR,
    max_results INTEGER DEFAULT 50,
    similarity_threshold REAL DEFAULT 0.3
)
RETURNS TABLE(
    word VARCHAR,
    similarity_score REAL,
    definitions JSONB,
    part_of_speech VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.word,
        similarity(w.word_lowercase, lower(search_term)) as sim_score,
        w.definitions,
        w.part_of_speech
    FROM words w
    WHERE similarity(w.word_lowercase, lower(search_term)) > similarity_threshold
    ORDER BY sim_score DESC, w.frequency_rank NULLS LAST
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Insert some default categories
INSERT INTO categories (name, description, color_code) VALUES
('Animals', 'Words related to animals and wildlife', '#FF6B6B'),
('Science', 'Scientific and technical terms', '#4ECDC4'),
('Arts', 'Words related to arts, music, and literature', '#45B7D1'),
('Sports', 'Sports and athletic terms', '#96CEB4'),
('Food', 'Culinary and food-related terms', '#FFEAA7'),
('Technology', 'Technology and computing terms', '#6C5CE7'),
('Medicine', 'Medical and health-related terms', '#A29BFE'),
('Business', 'Business and finance terms', '#FD79A8'),
('Education', 'Academic and educational terms', '#FDCB6E'),
('Travel', 'Travel and geography terms', '#E17055')
ON CONFLICT (name) DO NOTHING;

-- Sample data insertion (a few example words)
INSERT INTO words (
    word, short_definition, definitions, part_of_speech, difficulty_level, 
    is_common, frequency_rank, phonetic, example_sentences
) VALUES
(
    'beautiful', 
    'Pleasing to the senses or mind aesthetically',
    '["Pleasing the senses or mind aesthetically", "Of a very high standard; excellent"]',
    'adjective',
    2,
    TRUE,
    150,
    '/ˈbjuːtɪfʊl/',
    '["She has a beautiful voice.", "The sunset was beautiful tonight."]'
),
(
    'serendipity',
    'The occurrence of events by chance in a happy way',
    '["The occurrence and development of events by chance in a happy or beneficial way", "A pleasant surprise"]',
    'noun',
    6,
    FALSE,
    8500,
    '/ˌsɛrənˈdɪpɪti/',
    '["It was pure serendipity that led to their meeting.", "The discovery was a fortunate serendipity."]'
),
(
    'ephemeral',
    'Lasting for a very short time',
    '["Lasting for a very short time", "Having a short lifespan or duration"]',
    'adjective',
    7,
    FALSE,
    12000,
    '/ɪˈfɛm(ə)rəl/',
    '["The beauty of cherry blossoms is ephemeral.", "Social media posts are often ephemeral in nature."]'
)
ON CONFLICT (word) DO NOTHING;

-- Create a materialized view for statistics (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS dictionary_stats AS
SELECT 
    COUNT(*) as total_words,
    COUNT(*) FILTER (WHERE is_common = TRUE) as common_words,
    COUNT(*) FILTER (WHERE difficulty_level <= 3) as easy_words,
    COUNT(*) FILTER (WHERE difficulty_level BETWEEN 4 AND 6) as medium_words,
    COUNT(*) FILTER (WHERE difficulty_level >= 7) as hard_words,
    COUNT(DISTINCT part_of_speech) as unique_pos,
    AVG(word_length) as avg_word_length,
    MAX(word_length) as longest_word_length,
    MIN(word_length) as shortest_word_length,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as added_today,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as added_this_week
FROM words;

-- Create index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_dictionary_stats ON dictionary_stats (total_words);

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO your_api_user;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO your_api_user;
