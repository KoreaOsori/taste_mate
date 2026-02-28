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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Food Metadata table
CREATE TABLE IF NOT EXISTS foods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    category TEXT,
    sub_category TEXT,
    cook_method TEXT,
    main_ingredient TEXT[],
    season TEXT[],
    pref_gender TEXT,
    pref_age TEXT[],
    pref_weather TEXT[],
    consumption_region TEXT[],
    temperature TEXT,
    texture TEXT[],
    taste JSONB,
    kcal_100g FLOAT,
    macros_per_100g JSONB,
    calories FLOAT, -- Legacy compatibility
    protein FLOAT,
    carbs FLOAT,
    fat FLOAT,
    weather TEXT,
    time TEXT,
    emotion TEXT,
    spicy_level INTEGER,
    popularity FLOAT DEFAULT 0,
    tags TEXT[],
    vector_embedding vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Meal Records table
CREATE TABLE IF NOT EXISTS meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    food_id UUID REFERENCES foods(id) ON DELETE SET NULL, -- Linked to foods
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
    food_id UUID REFERENCES foods(id) ON DELETE SET NULL, -- Linked to foods
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
