-- Enhanced schema updates for connection system
-- Run this to ensure all necessary columns and policies exist

-- 1. Add availability_status to profiles if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS availability_status TEXT CHECK (availability_status IN ('available', 'busy', 'offline')) DEFAULT 'available';

-- 2. Add additional profile fields for caretakers and patients
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS condition TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 3. Update profiles to set default availability for existing users
UPDATE public.profiles 
SET availability_status = 'available' 
WHERE availability_status IS NULL;

-- 4. Add RLS policy to allow users to view other users by role (for discovery)
DROP POLICY IF EXISTS "Users can view users by role" ON public.users;
CREATE POLICY "Users can view users by role" ON public.users FOR SELECT
USING (true); -- Allow authenticated users to view all users (role is public info)

-- 5. Add RLS policy to allow users to view available profiles (for discovery)
DROP POLICY IF EXISTS "Users can view available profiles" ON public.profiles;
CREATE POLICY "Users can view available profiles" ON public.profiles FOR SELECT
USING (availability_status = 'available' OR auth.uid() = id);

-- 6. Add RLS policy to allow viewing profiles in connection context
DROP POLICY IF EXISTS "View profiles in connections" ON public.profiles;
CREATE POLICY "View profiles in connections" ON public.profiles FOR SELECT
USING (
    auth.uid() = id OR
    availability_status = 'available' OR
    EXISTS (
        SELECT 1 FROM public.connections 
        WHERE (caretaker_id = auth.uid() OR patient_id = auth.uid())
        AND (caretaker_id = public.profiles.id OR patient_id = public.profiles.id)
    )
);

-- 7. Ensure users can update their own availability
DROP POLICY IF EXISTS "Users can update own availability" ON public.profiles;
CREATE POLICY "Users can update own availability" ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 8. Grant necessary permissions
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (availability_status, specialization, experience, condition, doctor_name, avatar_url) ON public.profiles TO authenticated;

-- Verify the changes
SELECT 
    'Users table' as table_name,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'caretaker' THEN 1 END) as caretakers,
    COUNT(CASE WHEN role = 'patient' THEN 1 END) as patients
FROM public.users
UNION ALL
SELECT 
    'Profiles with availability' as table_name,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN availability_status = 'available' THEN 1 END) as available,
    COUNT(CASE WHEN availability_status IS NULL THEN 1 END) as null_status
FROM public.profiles;
