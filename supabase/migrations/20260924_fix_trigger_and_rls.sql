-- ====================================================================
-- Jeev Jantu Vihar (Bhopal) - Migration: Fix Trigger & Add Missing RLS
-- 1. Fix trg_generate_animal_id to fire ONLY on INSERT (prevent sequence desync / ID overwrite on UPDATE)
-- 2. Add dedicated trg_animals_updated_at for record UPDATEs
-- 3. Add missing RLS policies:
--    - profiles: INSERT (user self-registration / admin creation)
--    - profiles: DELETE (admin only)
--    - animals: SELECT (public / anon read access)
--    - storage.objects: DELETE (admin only for animal photos)
-- ====================================================================

-- 1. FIX TRIGGER: Only fire ID generator on INSERT
DROP TRIGGER IF EXISTS trg_generate_animal_id ON public.animals;
CREATE TRIGGER trg_generate_animal_id
BEFORE INSERT ON public.animals
FOR EACH ROW
EXECUTE FUNCTION generate_animal_id();

-- 2. DEDICATED TIMESTAMP TRIGGER FOR UPDATES
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

-- 3. MISSING RLS POLICIES FOR PROFILES
DROP POLICY IF EXISTS "Users can insert their own profile or admins can insert" ON public.profiles;
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

DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.profiles;
CREATE POLICY "Only admins can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- 4. MISSING RLS POLICIES FOR ANIMALS (ANON READ ACCESS)
DROP POLICY IF EXISTS "Animals are viewable by anon users" ON public.animals;
CREATE POLICY "Animals are viewable by anon users"
ON public.animals FOR SELECT
TO anon
USING (true);

-- 5. MISSING RLS POLICY FOR STORAGE (ADMIN PHOTO DELETION)
DROP POLICY IF EXISTS "Only admins can delete animal photos" ON storage.objects;
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
