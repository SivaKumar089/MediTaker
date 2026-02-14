-- FIX: Allow ALL authenticated users to view other users and profiles
-- This is needed for the "Find Patients" and "Find Caretakers" pages
-- Without these policies, RLS blocks users from seeing anyone else

-- Allow any authenticated user to view all users (for finding connections)
CREATE POLICY "Authenticated users can view all users" 
ON public.users FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Allow any authenticated user to view all profiles (for finding connections)
CREATE POLICY "Authenticated users can view all profiles" 
ON public.profiles FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- NOTE: If the above policies conflict with existing ones, you may need to drop the old restrictive ones first:
-- DROP POLICY IF EXISTS "Users can view own data" ON public.users;
-- DROP POLICY IF EXISTS "Caretakers can view their connected patients profiles" ON public.users;
-- DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
-- DROP POLICY IF EXISTS "Caretakers view connected profiles" ON public.profiles;
