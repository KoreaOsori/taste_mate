-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define Custom Types (Enums)
DO $$ BEGIN
    CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE chat_role AS ENUM ('user', 'assistant');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User Profiles table (Connects to Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
    disliked_foods TEXT[],
    restricted_foods TEXT[],
    breakfast_time TEXT,
    lunch_time TEXT,
    dinner_time TEXT,
    location TEXT,
    location_consent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Meal Records table
CREATE TABLE IF NOT EXISTS meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    type meal_type NOT NULL,
    food_name TEXT NOT NULL,
    calories FLOAT,
    protein FLOAT,
    carbs FLOAT,
    fat FLOAT,
    restaurant_link TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat History table
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    role chat_role NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recommendation History table (New)
CREATE TABLE IF NOT EXISTS recommendation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    restaurant_name TEXT NOT NULL,
    category TEXT,
    signature_menu TEXT,
    calories FLOAT,
    reason TEXT,
    selected BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Community Posts table
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    user_name TEXT,
    content TEXT NOT NULL,
    image_url TEXT,
    tags TEXT[],
    likes INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vector Database Metadata (Optional for later RAG)
-- CREATE EXTENSION IF NOT EXISTS vector;
-- CREATE TABLE IF NOT EXISTS menu_embeddings (
--     id BIGSERIAL PRIMARY KEY,
--     menu_name TEXT,
--     restaurant_name TEXT,
--     embedding VECTOR(1536),
--     metadata JSONB
-- );
