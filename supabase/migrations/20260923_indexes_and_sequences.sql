-- ====================================================================
-- Jeev Jantu Vihar (Bhopal) - Database Performance & Data Integrity Migration
-- 1. Composite & High-Frequency B-Tree Query Indexes
-- 2. Auto-Sequence Synchronization & Manual ID Collision Safeguard
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. ADD B-TREE INDEXES FOR HIGH-FREQUENCY QUERY COLUMNS
-- --------------------------------------------------------------------

-- Composite index: Optimizes the primary dog and cow list views
-- (filters by animal_type and sorts newest rescues first)
CREATE INDEX IF NOT EXISTS idx_animals_type_rescue_date_desc 
ON public.animals (animal_type, date_of_rescue DESC);

-- Composite index: Optimizes status filtering per animal section (e.g. Under Treatment Dogs)
CREATE INDEX IF NOT EXISTS idx_animals_type_status 
ON public.animals (animal_type, status);

-- Single-column index: Optimizes date range filters and timeline queries
CREATE INDEX IF NOT EXISTS idx_animals_date_of_rescue_desc 
ON public.animals (date_of_rescue DESC);

-- Single-column index: Optimizes status count aggregations across the sanctuary
CREATE INDEX IF NOT EXISTS idx_animals_status 
ON public.animals (status);

-- Foreign Key index: Optimizes lookups, joins with auth.users/profiles, and cascade operations
CREATE INDEX IF NOT EXISTS idx_animals_created_by 
ON public.animals (created_by);


-- --------------------------------------------------------------------
-- 2. AUTO-SEQUENCE ID COLLISION SAFEGUARD & SYNCHRONIZATION
-- --------------------------------------------------------------------

-- Function to synchronize sequences with manually imported IDs
CREATE OR REPLACE FUNCTION public.sync_animal_sequences()
RETURNS void AS $$
DECLARE
    max_dog_num INTEGER;
    max_cow_num INTEGER;
BEGIN
    -- Extract highest integer from dog IDs (e.g. 'JJV-D-047' -> 47)
    SELECT COALESCE(MAX(NULLIF(regexp_replace(animal_id, '^JJV-D-', ''), '')::INTEGER), 0)
    INTO max_dog_num
    FROM public.animals
    WHERE animal_type = 'dog' AND animal_id ~ '^JJV-D-[0-9]+$';

    -- Synchronize dog_seq so next insert produces max_dog_num + 1
    PERFORM setval('dog_seq', GREATEST(max_dog_num, 1), max_dog_num > 0);

    -- Extract highest integer from cow IDs (e.g. 'JJV-C-023' -> 23)
    SELECT COALESCE(MAX(NULLIF(regexp_replace(animal_id, '^JJV-C-', ''), '')::INTEGER), 0)
    INTO max_cow_num
    FROM public.animals
    WHERE animal_type = 'cow' AND animal_id ~ '^JJV-C-[0-9]+$';

    -- Synchronize cow_seq so next insert produces max_cow_num + 1
    PERFORM setval('cow_seq', GREATEST(max_cow_num, 1), max_cow_num > 0);

    RAISE NOTICE 'Sequences synchronized: dog_seq to %, cow_seq to %', max_dog_num, max_cow_num;
END;
$$ LANGUAGE plpgsql;

-- Execute synchronization immediately
SELECT public.sync_animal_sequences();

-- --------------------------------------------------------------------
-- 3. UPGRADE TRIGGER TO PREVENT FUTURE SEQUENCE DESYNC ON MANUAL INSERTS
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_animal_id()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
    manual_num INTEGER;
    current_seq_val INTEGER;
BEGIN
    -- Case A: Manual ID was supplied (e.g. 'JJV-D-047' or 'JJV-C-023')
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
    -- Case B: Auto-generate from sequence
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
