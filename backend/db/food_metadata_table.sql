-- 1. Extend existing 'foods' table with missing columns
ALTER TABLE foods 
ADD COLUMN IF NOT EXISTS sub_category TEXT,
ADD COLUMN IF NOT EXISTS cook_method TEXT,
ADD COLUMN IF NOT EXISTS main_ingredient TEXT[],
ADD COLUMN IF NOT EXISTS season TEXT[],
ADD COLUMN IF NOT EXISTS pref_gender TEXT,
ADD COLUMN IF NOT EXISTS pref_age TEXT[],
ADD COLUMN IF NOT EXISTS pref_weather TEXT[],
ADD COLUMN IF NOT EXISTS consumption_region TEXT[],
ADD COLUMN IF NOT EXISTS texture TEXT[],
ADD COLUMN IF NOT EXISTS taste JSONB,
ADD COLUMN IF NOT EXISTS kcal_100g FLOAT,
ADD COLUMN IF NOT EXISTS macros_per_100g JSONB;

-- 2. Establish relationships by adding foreign key columns
-- Link 'meals' record to 'foods' table
ALTER TABLE meals 
ADD COLUMN IF NOT EXISTS food_id UUID REFERENCES foods(id) ON DELETE SET NULL;

-- Link 'recommendation_history' record to 'foods' table
ALTER TABLE recommendation_history
ADD COLUMN IF NOT EXISTS food_id UUID REFERENCES foods(id) ON DELETE SET NULL;

-- 3. Security (Optional)
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'foods' AND policyname = 'Allow public read access') THEN
        CREATE POLICY "Allow public read access" ON foods FOR SELECT USING (true);
    END IF;
END $$;
