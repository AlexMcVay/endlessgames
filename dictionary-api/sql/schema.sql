-- Dictionary Database Schema for PostgreSQL
-- Advanced SQL implementation for English dictionary storage

-- Enable extensions for better text search and UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create the main dictionary table
CREATE TABLE IF NOT EXISTS dictionary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    word VARCHAR(100) NOT NULL UNIQUE,
    word_lowercase VARCHAR(100) NOT NULL,
    definitions JSONB NOT NULL,
    phonetic VARCHAR(200),
    part_of_speech VARCHAR(50),
    example TEXT,
    etymology TEXT,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 10),
    word_length INTEGER GENERATED ALWAYS AS (char_length(word)) STORED,
    is_common BOOLEAN DEFAULT FALSE,
    usage_frequency INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create word origins table for etymology tracking
CREATE TABLE IF NOT EXISTS word_origins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    word_id UUID REFERENCES dictionary(id) ON DELETE CASCADE,
    origin_language VARCHAR(50) NOT NULL,
    original_word VARCHAR(100),
    meaning TEXT,
    time_period VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create synonyms table
CREATE TABLE IF NOT EXISTS synonyms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    word_id UUID REFERENCES dictionary(id) ON DELETE CASCADE,
    synonym_word_id UUID REFERENCES dictionary(id) ON DELETE CASCADE,
    similarity_score DECIMAL(3,2) DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(word_id, synonym_word_id)
);

-- Create antonyms table
CREATE TABLE IF NOT EXISTS antonyms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    word_id UUID REFERENCES dictionary(id) ON DELETE CASCADE,
    antonym_word_id UUID REFERENCES dictionary(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(word_id, antonym_word_id)
);

-- Create word categories table
CREATE TABLE IF NOT EXISTS word_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_category_id UUID REFERENCES word_categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create word-category relationship table
CREATE TABLE IF NOT EXISTS word_category_relations (
    word_id UUID REFERENCES dictionary(id) ON DELETE CASCADE,
    category_id UUID REFERENCES word_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (word_id, category_id)
);

-- Create user word interactions table (for tracking learning progress)
CREATE TABLE IF NOT EXISTS user_word_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) NOT NULL, -- Can be session ID or user ID
    word_id UUID REFERENCES dictionary(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL, -- 'lookup', 'quiz_correct', 'quiz_incorrect', 'favorited'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dictionary_word_lowercase ON dictionary(word_lowercase);
CREATE INDEX IF NOT EXISTS idx_dictionary_part_of_speech ON dictionary(part_of_speech);
CREATE INDEX IF NOT EXISTS idx_dictionary_difficulty ON dictionary(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_dictionary_word_length ON dictionary(word_length);
CREATE INDEX IF NOT EXISTS idx_dictionary_is_common ON dictionary(is_common);
CREATE INDEX IF NOT EXISTS idx_dictionary_usage_frequency ON dictionary(usage_frequency DESC);

-- Create GIN index for full-text search on definitions
CREATE INDEX IF NOT EXISTS idx_dictionary_definitions_gin ON dictionary USING gin(definitions);

-- Create trigram indexes for fuzzy text search
CREATE INDEX IF NOT EXISTS idx_dictionary_word_trgm ON dictionary USING gin(word gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_dictionary_word_lowercase_trgm ON dictionary USING gin(word_lowercase gin_trgm_ops);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_dictionary_updated_at 
    BEFORE UPDATE ON dictionary 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to search words with fuzzy matching
CREATE OR REPLACE FUNCTION search_words_fuzzy(
    search_term TEXT,
    min_similarity REAL DEFAULT 0.3,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE(
    word VARCHAR(100),
    definitions JSONB,
    phonetic VARCHAR(200),
    part_of_speech VARCHAR(50),
    similarity_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.word,
        d.definitions,
        d.phonetic,
        d.part_of_speech,
        similarity(d.word_lowercase, LOWER(search_term)) as sim_score
    FROM dictionary d
    WHERE similarity(d.word_lowercase, LOWER(search_term)) > min_similarity
    ORDER BY sim_score DESC, d.usage_frequency DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get random words by difficulty level
CREATE OR REPLACE FUNCTION get_random_words_by_difficulty(
    difficulty INTEGER DEFAULT NULL,
    word_count INTEGER DEFAULT 10
)
RETURNS TABLE(
    word VARCHAR(100),
    definitions JSONB,
    phonetic VARCHAR(200),
    part_of_speech VARCHAR(50),
    difficulty_level INTEGER
) AS $$
BEGIN
    IF difficulty IS NULL THEN
        RETURN QUERY
        SELECT 
            d.word,
            d.definitions,
            d.phonetic,
            d.part_of_speech,
            d.difficulty_level
        FROM dictionary d
        ORDER BY RANDOM()
        LIMIT word_count;
    ELSE
        RETURN QUERY
        SELECT 
            d.word,
            d.definitions,
            d.phonetic,
            d.part_of_speech,
            d.difficulty_level
        FROM dictionary d
        WHERE d.difficulty_level = difficulty
        ORDER BY RANDOM()
        LIMIT word_count;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get word statistics
CREATE OR REPLACE FUNCTION get_dictionary_stats()
RETURNS TABLE(
    total_words BIGINT,
    total_definitions BIGINT,
    avg_definitions_per_word NUMERIC,
    common_words_count BIGINT,
    words_by_difficulty JSONB,
    top_parts_of_speech JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_words,
        SUM(jsonb_array_length(d.definitions)) as total_definitions,
        AVG(jsonb_array_length(d.definitions)) as avg_definitions_per_word,
        COUNT(*) FILTER (WHERE d.is_common = true) as common_words_count,
        jsonb_object_agg(
            difficulty_level::text, 
            count
        ) as words_by_difficulty,
        jsonb_object_agg(
            part_of_speech, 
            pos_count
        ) as top_parts_of_speech
    FROM dictionary d
    CROSS JOIN (
        SELECT difficulty_level, COUNT(*) as count
        FROM dictionary 
        GROUP BY difficulty_level
    ) diff_counts
    CROSS JOIN (
        SELECT part_of_speech, COUNT(*) as pos_count
        FROM dictionary 
        WHERE part_of_speech IS NOT NULL
        GROUP BY part_of_speech
        ORDER BY COUNT(*) DESC
        LIMIT 10
    ) pos_counts;
END;
$$ LANGUAGE plpgsql;

-- Insert initial word categories
INSERT INTO word_categories (name, description) VALUES
('Academic', 'Words commonly used in academic or scholarly contexts'),
('Business', 'Words related to business and commerce'),
('Science', 'Scientific and technical terminology'),
('Literature', 'Words commonly found in literary works'),
('Common', 'Everyday words used in regular conversation'),
('Advanced', 'Complex words requiring higher education level'),
('Archaic', 'Old or obsolete words no longer in common use'),
('Slang', 'Informal words and expressions'),
('Medical', 'Medical and healthcare terminology'),
('Legal', 'Legal and judicial terminology')
ON CONFLICT (name) DO NOTHING;

-- Sample data insertion
INSERT INTO dictionary (
    word, 
    word_lowercase, 
    definitions, 
    phonetic, 
    part_of_speech, 
    example, 
    difficulty_level, 
    is_common
) VALUES
(
    'Algorithm',
    'algorithm',
    '["A set of rules or instructions for solving a problem", "A step-by-step procedure for calculations"]',
    '/ˈælɡəˌrɪðəm/',
    'noun',
    'The computer uses an algorithm to sort the data.',
    6,
    false
),
(
    'Beautiful',
    'beautiful',
    '["Having qualities that give great pleasure to see", "Excellent or pleasing in nature"]',
    '/ˈbjuːtɪfəl/',
    'adjective',
    'The sunset was beautiful tonight.',
    3,
    true
),
(
    'Magnificent',
    'magnificent',
    '["Extremely beautiful and impressive", "Excellent or outstanding in quality"]',
    '/mæɡˈnɪfɪsənt/',
    'adjective',
    'The castle looked magnificent in the moonlight.',
    5,
    false
)
ON CONFLICT (word) DO NOTHING;

-- Create a view for easy word lookup with related information
CREATE OR REPLACE VIEW word_details AS
SELECT 
    d.id,
    d.word,
    d.definitions,
    d.phonetic,
    d.part_of_speech,
    d.example,
    d.etymology,
    d.difficulty_level,
    d.word_length,
    d.is_common,
    d.usage_frequency,
    array_agg(DISTINCT wc.name) FILTER (WHERE wc.name IS NOT NULL) as categories,
    COUNT(DISTINCT ui.id) FILTER (WHERE ui.interaction_type = 'lookup') as lookup_count
FROM dictionary d
LEFT JOIN word_category_relations wcr ON d.id = wcr.word_id
LEFT JOIN word_categories wc ON wcr.category_id = wc.id
LEFT JOIN user_word_interactions ui ON d.id = ui.word_id
GROUP BY d.id, d.word, d.definitions, d.phonetic, d.part_of_speech, 
         d.example, d.etymology, d.difficulty_level, d.word_length, 
         d.is_common, d.usage_frequency;

-- Create function to log word interactions
CREATE OR REPLACE FUNCTION log_word_interaction(
    p_user_id VARCHAR(100),
    p_word VARCHAR(100),
    p_interaction_type VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
    word_uuid UUID;
BEGIN
    -- Get word ID
    SELECT id INTO word_uuid 
    FROM dictionary 
    WHERE word_lowercase = LOWER(p_word);
    
    IF word_uuid IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Insert interaction
    INSERT INTO user_word_interactions (user_id, word_id, interaction_type)
    VALUES (p_user_id, word_uuid, p_interaction_type);
    
    -- Update usage frequency
    UPDATE dictionary 
    SET usage_frequency = usage_frequency + 1
    WHERE id = word_uuid;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_api_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_api_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO your_api_user;
