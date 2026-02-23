-- User Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    user_id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    height FLOAT,
    weight FLOAT,
    target_weight FLOAT,
    target_calories INTEGER,
    current_calories INTEGER DEFAULT 0,
    activity_level TEXT,
    goal TEXT,
    preferred_categories TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Meal Records table
CREATE TABLE IF NOT EXISTS meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(user_id),
    meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    food_name TEXT NOT NULL,
    calories FLOAT,
    protein FLOAT,
    carbs FLOAT,
    fat FLOAT,
    restaurant_link TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Community Posts table
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(user_id),
    user_name TEXT,
    content TEXT NOT NULL,
    image_url TEXT,
    tags TEXT[],
    likes INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat History table
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(user_id),
    role TEXT CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vector Database Metadata (Local mockup or pgvector)
-- CREATE EXTENSION IF NOT EXISTS vector;
-- CREATE TABLE IF NOT EXISTS menu_embeddings (
--     id BIGSERIAL PRIMARY KEY,
--     menu_name TEXT,
--     restaurant_name TEXT,
--     embedding VECTOR(1536), -- For OpenAI embeddings
--     metadata JSONB
-- );
