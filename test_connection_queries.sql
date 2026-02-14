-- Quick test queries to verify the connection system is working

-- 1. Check if users table has data
SELECT 
    id, 
    email, 
    role,
    created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check if profiles table has availability_status
SELECT 
    p.id,
    u.email,
    u.role,
    p.full_name,
    p.availability_status,
    p.specialization,
    p.experience
FROM public.profiles p
JOIN public.users u ON p.id = u.id
ORDER BY u.created_at DESC
LIMIT 10;

-- 3. Count users by role
SELECT 
    role,
    COUNT(*) as count
FROM public.users
GROUP BY role;

-- 4. Count profiles by availability status
SELECT 
    availability_status,
    COUNT(*) as count
FROM public.profiles
GROUP BY availability_status;

-- 5. Check available caretakers (what the app should fetch)
SELECT 
    u.id,
    u.email,
    u.role,
    p.full_name,
    p.availability_status,
    p.specialization,
    p.experience
FROM public.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.role = 'caretaker'
  AND p.availability_status = 'available';

-- 6. Check available patients (for caretakers to find)
SELECT 
    u.id,
    u.email,
    u.role,
    p.full_name,
    p.availability_status,
    p.condition
FROM public.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.role = 'patient'
  AND p.availability_status = 'available';

-- 7. Check existing connections
SELECT 
    c.id,
    c.status,
    c.requested_by,
    p_patient.full_name as patient_name,
    p_caretaker.full_name as caretaker_name,
    c.created_at
FROM public.connections c
LEFT JOIN public.profiles p_patient ON c.patient_id = p_patient.id
LEFT JOIN public.profiles p_caretaker ON c.caretaker_id = p_caretaker.id
ORDER BY c.created_at DESC;

-- 8. If you need to create test caretakers, run this:
-- (Replace the email/id with actual user IDs from your database)
/*
UPDATE public.profiles
SET 
    availability_status = 'available',
    specialization = 'General Care',
    experience = 5
WHERE id IN (
    SELECT id FROM public.users WHERE role = 'caretaker'
);
*/

-- 9. If you need to create test patients, run this:
/*
UPDATE public.profiles
SET 
    availability_status = 'available',
    condition = 'General Health Monitoring'
WHERE id IN (
    SELECT id FROM public.users WHERE role = 'patient'
);
*/
