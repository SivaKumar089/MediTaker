-- Quick Setup & Verification Script for Discovery Pages
-- Run this in Supabase SQL Editor to set up test data

-- ============================================
-- PART 1: VERIFY CURRENT STATE
-- ============================================

-- 1. Check if tables exist and have data
SELECT 'Users Table' as check_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Profiles Table', COUNT(*) FROM profiles
UNION ALL
SELECT 'Caretakers', COUNT(*) FROM users WHERE role = 'caretaker'
UNION ALL
SELECT 'Patients', COUNT(*) FROM users WHERE role = 'patient';

-- 2. Check availability status distribution
SELECT 
    'Availability Status' as check_name,
    availability_status,
    COUNT(*) as count
FROM profiles
GROUP BY availability_status;

-- 3. Check if availability_status column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name IN ('availability_status', 'specialization', 'experience', 'condition');

-- ============================================
-- PART 2: FIX COMMON ISSUES
-- ============================================

-- 4. Add availability_status if missing (safe - won't error if exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability_status TEXT 
    CHECK (availability_status IN ('available', 'busy', 'offline')) 
    DEFAULT 'available';

-- 5. Add other profile fields if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS condition TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 6. Set default availability for all existing users
UPDATE profiles 
SET availability_status = 'available' 
WHERE availability_status IS NULL;

-- ============================================
-- PART 3: CREATE TEST DATA
-- ============================================

-- 7. Make all caretakers available with test data
UPDATE profiles
SET 
    availability_status = 'available',
    specialization = COALESCE(specialization, 'General Care'),
    experience = COALESCE(experience, 5)
WHERE id IN (
    SELECT id FROM users WHERE role = 'caretaker'
);

-- 8. Make all patients available with test data
UPDATE profiles
SET 
    availability_status = 'available',
    condition = COALESCE(condition, 'General Health Monitoring')
WHERE id IN (
    SELECT id FROM users WHERE role = 'patient'
);

-- ============================================
-- PART 4: VERIFY PERMISSIONS
-- ============================================

-- 9. Grant necessary permissions
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (availability_status, specialization, experience, condition, doctor_name, avatar_url) 
    ON public.profiles TO authenticated;

-- 10. Create/Update RLS policies
DROP POLICY IF EXISTS "Users can view users by role" ON public.users;
CREATE POLICY "Users can view users by role" ON public.users FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can view available profiles" ON public.profiles;
CREATE POLICY "Users can view available profiles" ON public.profiles FOR SELECT
USING (availability_status = 'available' OR auth.uid() = id);

-- ============================================
-- PART 5: FINAL VERIFICATION
-- ============================================

-- 11. Show what will be visible to patients (caretakers)
SELECT 
    'Available Caretakers' as list_type,
    u.id,
    u.email,
    u.role,
    p.full_name,
    p.specialization,
    p.experience,
    p.availability_status
FROM users u
JOIN profiles p ON u.id = p.id
WHERE u.role = 'caretaker'
  AND p.availability_status = 'available'
ORDER BY p.full_name;

-- 12. Show what will be visible to caretakers (patients)
SELECT 
    'Available Patients' as list_type,
    u.id,
    u.email,
    u.role,
    p.full_name,
    p.condition,
    p.availability_status
FROM users u
JOIN profiles p ON u.id = p.id
WHERE u.role = 'patient'
  AND p.availability_status = 'available'
ORDER BY p.full_name;

-- 13. Summary report
SELECT 
    'SUMMARY REPORT' as report_section,
    '' as detail
UNION ALL
SELECT 
    'Total Users',
    COUNT(*)::text
FROM users
UNION ALL
SELECT 
    'Caretakers (Available)',
    COUNT(*)::text
FROM users u
JOIN profiles p ON u.id = p.id
WHERE u.role = 'caretaker' AND p.availability_status = 'available'
UNION ALL
SELECT 
    'Patients (Available)',
    COUNT(*)::text
FROM users u
JOIN profiles p ON u.id = p.id
WHERE u.role = 'patient' AND p.availability_status = 'available'
UNION ALL
SELECT 
    'Total Connections',
    COUNT(*)::text
FROM connections;

-- ============================================
-- EXPECTED RESULTS
-- ============================================
-- After running this script, you should see:
-- 1. All users have availability_status set
-- 2. Caretakers have specialization and experience
-- 3. Patients have condition set
-- 4. RLS policies are in place
-- 5. Summary shows available users > 0 for both roles
--
-- If any counts are 0, you need to create users first!
-- ============================================
