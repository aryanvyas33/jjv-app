-- ====================================================================
-- Jeev Jantu Vihar (Bhopal) - Animal Shelter Management Database Schema
-- Dogs & Cows Census, Profiles, Treatments, and Photo Records
-- ====================================================================

-- 1. Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'worker')),
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile or admins can insert"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = id OR 
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

CREATE POLICY "Only admins can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- 2. Animals Table (Dogs & Cows)
CREATE TABLE IF NOT EXISTS public.animals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    animal_type TEXT NOT NULL CHECK (animal_type IN ('dog', 'cow')),
    animal_id TEXT UNIQUE NOT NULL, -- e.g. JJV-D-047 or JJV-C-023
    name TEXT NOT NULL,
    estimated_age TEXT,
    breed TEXT,
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Calf', 'Unknown')),
    weight_at_rescue NUMERIC(5, 2), -- in kg
    date_of_rescue DATE NOT NULL,
    location_of_rescue TEXT NOT NULL,
    condition_at_rescue TEXT NOT NULL CHECK (condition_at_rescue IN ('Critical', 'Severe', 'Moderate', 'Mild', 'Healthy')),
    condition_description TEXT,
    rescued_by TEXT,
    treatment_ongoing BOOLEAN DEFAULT true NOT NULL,
    treatment_details TEXT,
    recovery_time TEXT, -- e.g. '21 days'
    veterinary_doctor TEXT,
    status TEXT NOT NULL CHECK (status IN ('Critical', 'Under Treatment', 'Stable', 'Recovered')),
    before_image_url TEXT,
    after_image_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on animals
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for animals
-- Read: Everyone authenticated (Admin & Workers) and public/anon visitors can read records
CREATE POLICY "Animals are viewable by authenticated users"
ON public.animals FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Animals are viewable by anon users"
ON public.animals FOR SELECT
TO anon
USING (true);

-- Insert: Both Admins and Workers can insert new records
CREATE POLICY "Authenticated users can create animal records"
ON public.animals FOR INSERT
TO authenticated
WITH CHECK (true);

-- Update: Both Admins and Workers can update animal records (treatments, after photo, status)
CREATE POLICY "Authenticated users can update animal records"
ON public.animals FOR UPDATE
TO authenticated
USING (true);

-- Delete: ONLY Admins can delete animal records
CREATE POLICY "Only admins can delete animal records"
ON public.animals FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- B-Tree Performance & Query Indexes
CREATE INDEX IF NOT EXISTS idx_animals_type_rescue_date_desc 
ON public.animals (animal_type, date_of_rescue DESC);

CREATE INDEX IF NOT EXISTS idx_animals_type_status 
ON public.animals (animal_type, status);

CREATE INDEX IF NOT EXISTS idx_animals_date_of_rescue_desc 
ON public.animals (date_of_rescue DESC);

CREATE INDEX IF NOT EXISTS idx_animals_status 
ON public.animals (status);

CREATE INDEX IF NOT EXISTS idx_animals_created_by 
ON public.animals (created_by);

-- 3. Automatic Animal ID Generator Sequence & Trigger (With Collision Safeguard)
CREATE SEQUENCE IF NOT EXISTS dog_seq START 1;
CREATE SEQUENCE IF NOT EXISTS cow_seq START 1;

CREATE OR REPLACE FUNCTION generate_animal_id()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
    manual_num INTEGER;
    current_seq_val INTEGER;
BEGIN
    -- If animal_id was manually provided, advance sequence to prevent future collisions
    IF NEW.animal_id IS NOT NULL AND NEW.animal_id <> '' THEN
        IF NEW.animal_type = 'dog' AND NEW.animal_id ~ '^JJV-D-[0-9]+$' THEN
            manual_num := regexp_replace(NEW.animal_id, '^JJV-D-', '')::INTEGER;
            SELECT last_value INTO current_seq_val FROM dog_seq;
            IF manual_num >= current_seq_val THEN
                PERFORM setval('dog_seq', manual_num, true);
            END IF;
        ELSIF NEW.animal_type = 'cow' AND NEW.animal_id ~ '^JJV-C-[0-9]+$' THEN
            manual_num := regexp_replace(NEW.animal_id, '^JJV-C-', '')::INTEGER;
            SELECT last_value INTO current_seq_val FROM cow_seq;
            IF manual_num >= current_seq_val THEN
                PERFORM setval('cow_seq', manual_num, true);
            END IF;
        END IF;
    -- Auto-generate from sequence if no manual ID provided
    ELSE
        IF NEW.animal_type = 'dog' THEN
            SELECT nextval('dog_seq') INTO next_num;
            NEW.animal_id := 'JJV-D-' || LPAD(next_num::TEXT, 3, '0');
        ELSIF NEW.animal_type = 'cow' THEN
            SELECT nextval('cow_seq') INTO next_num;
            NEW.animal_id := 'JJV-C-' || LPAD(next_num::TEXT, 3, '0');
        END IF;
    END IF;

    NEW.updated_at := TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_animal_id ON public.animals;
CREATE TRIGGER trg_generate_animal_id
BEFORE INSERT ON public.animals
FOR EACH ROW
EXECUTE FUNCTION generate_animal_id();

-- Dedicated trigger to maintain updated_at on record UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_animals_updated_at ON public.animals;
CREATE TRIGGER trg_animals_updated_at
BEFORE UPDATE ON public.animals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 4. Supabase Storage Bucket for Before & After Photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('animal-photos', 'animal-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Animal photos are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'animal-photos');

CREATE POLICY "Authenticated users can upload animal photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'animal-photos');

CREATE POLICY "Authenticated users can update/replace animal photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'animal-photos');

CREATE POLICY "Only admins can delete animal photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'animal-photos' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- 5. Seed Initial Host & Staff Profiles
-- Host / Admin: Rashmi Vyas (rashmi@jjv.org)
-- Staff Member: Nikhil (nikhil@jjv.org)
-- All test animal data deleted; ready for manual rescue entry.

