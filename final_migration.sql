-- 1. Fix Profile Schema Mismatch
-- Add missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS condition TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience INTEGER;

-- 2. Update Medication Logs for Proof Photos and Vitals
ALTER TABLE public.medication_logs ADD COLUMN IF NOT EXISTS proof_photo_url TEXT;
-- Ensure vitals exist (already in update_schema_enhanced.sql but repeating for safety)
ALTER TABLE public.medication_logs ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.medication_logs ADD COLUMN IF NOT EXISTS heart_rate INTEGER;
ALTER TABLE public.medication_logs ADD COLUMN IF NOT EXISTS blood_pressure TEXT;

-- 3. Enforce Relationship Rules: One Patient -> One Caretaker
-- We use a partial unique index to ensure a patient can only have ONE accepted connection at a time.
-- This allows multiple pending/rejected requests but only one ACTIVE caretaker.
CREATE UNIQUE INDEX IF NOT EXISTS one_caretaker_per_patient_accepted 
ON public.connections (patient_id) 
WHERE (status = 'accepted');

-- 4. Storage Bucket Policy (Conceptual - Use Supabase Dashboard to create bucket named 'medication-proofs')
-- Bucket: medication-proofs
-- Public: False (or True if simpler for MVP, but False is better)

-- 5. Fix RLS for viewing profiles during search (ensure users can find each other)
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view all profiles" 
ON public.profiles FOR SELECT 
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view all users" ON public.users;
CREATE POLICY "Authenticated users can view all users" 
ON public.users FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 6. Add policy for Proof Photos in meditation logs
-- Allowing patients and their caretakers to view the logs (including photos)
DROP POLICY IF EXISTS "Caretakers view patient logs" ON public.medication_logs;
CREATE POLICY "Caretakers view patient logs" ON public.medication_logs FOR SELECT
USING (EXISTS (SELECT 1 FROM public.connections WHERE caretaker_id = auth.uid() AND patient_id = public.medication_logs.patient_id AND status = 'accepted'));

-- 7. Ensure trigger function handles the new columns if they are passed during signup (optional but good)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, (new.raw_user_meta_data->>'role'));

  INSERT INTO public.profiles (id, full_name, phone, address, age, condition, specialization, experience)
  VALUES (
    new.id, 
    (new.raw_user_meta_data->>'full_name'), 
    (new.raw_user_meta_data->>'phone'),
    (new.raw_user_meta_data->>'address'),
    ((new.raw_user_meta_data->>'age')::integer),
    (new.raw_user_meta_data->>'condition'),
    (new.raw_user_meta_data->>'specialization'),
    ((new.raw_user_meta_data->>'experience')::integer)
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
