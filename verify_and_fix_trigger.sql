-- Step 1: Check if the trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Step 2: Check if the function exists
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';

-- Step 3: If they don't exist, run this to create them:

-- Drop existing trigger and function (if any)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into public.users
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, (new.raw_user_meta_data->>'role'));

  -- Insert into public.profiles
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (new.id, (new.raw_user_meta_data->>'full_name'), (new.raw_user_meta_data->>'phone'));

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 4: Test the trigger manually for existing users (OPTIONAL - only if you want to backfill)
-- This will try to insert data for users that already exist in auth.users but not in public.users
-- Run this ONLY if you have users in auth.users that don't have corresponding entries in public.users

-- DO $$
-- DECLARE
--   user_record RECORD;
-- BEGIN
--   FOR user_record IN SELECT id, email, raw_user_meta_data FROM auth.users LOOP
--     -- Try to insert into users table
--     INSERT INTO public.users (id, email, role)
--     VALUES (user_record.id, user_record.email, (user_record.raw_user_meta_data->>'role'))
--     ON CONFLICT (id) DO NOTHING;
--     
--     -- Try to insert into profiles table
--     INSERT INTO public.profiles (id, full_name, phone)
--     VALUES (user_record.id, (user_record.raw_user_meta_data->>'full_name'), (user_record.raw_user_meta_data->>'phone'))
--     ON CONFLICT (id) DO NOTHING;
--   END LOOP;
-- END $$;
