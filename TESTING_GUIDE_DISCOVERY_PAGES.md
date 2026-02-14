# Testing Guide - Find Patients & Find Caretakers Pages

## Overview
This guide helps you verify that both discovery pages are working correctly with real database data.

## Prerequisites
✅ You've run `fix_connection_schema.sql` in Supabase  
✅ Database has `users` and `profiles` tables  
✅ Some users exist with roles 'patient' and 'caretaker'  

## Test Setup (Run in Supabase SQL Editor)

### 1. Create Test Caretakers (if needed)
```sql
-- Check existing caretakers
SELECT u.id, u.email, u.role, p.full_name, p.availability_status, p.specialization
FROM users u
JOIN profiles p ON u.id = p.id
WHERE u.role = 'caretaker';

-- Make caretakers available
UPDATE profiles
SET 
    availability_status = 'available',
    specialization = 'General Care',
    experience = 5
WHERE id IN (
    SELECT id FROM users WHERE role = 'caretaker'
);
```

### 2. Create Test Patients (if needed)
```sql
-- Check existing patients
SELECT u.id, u.email, u.role, p.full_name, p.availability_status, p.condition
FROM users u
JOIN profiles p ON u.id = p.id
WHERE u.role = 'patient';

-- Make patients available
UPDATE profiles
SET 
    availability_status = 'available',
    condition = 'General Health Monitoring'
WHERE id IN (
    SELECT id FROM users WHERE role = 'patient'
);
```

### 3. Verify Data
```sql
-- Count by role and availability
SELECT 
    u.role,
    p.availability_status,
    COUNT(*) as count
FROM users u
JOIN profiles p ON u.id = p.id
GROUP BY u.role, p.availability_status
ORDER BY u.role, p.availability_status;
```

Expected output:
```
role      | availability_status | count
----------|---------------------|-------
caretaker | available          | 2
patient   | available          | 3
```

## Testing Find Caretakers Page (Patient Side)

### URL: `/patient/caretakers`

### Steps:
1. **Login as a Patient**
2. **Navigate to Find Caretakers** (or use dashboard button)
3. **Open Browser Console** (F12)
4. **Check Console Output**:

**Success Output:**
```
Loading caretakers data for patient: 90d8aab5-...
Fetching available caretakers...
Fetched 2 available caretakers
Available caretakers: [
  {
    id: "abc123...",
    full_name: "Dr. Smith",
    specialization: "General Care",
    experience: 5,
    availability_status: "available",
    users: { role: "caretaker", email: "..." }
  },
  ...
]
Fetched accepted connections...
Fetched sent requests...
Fetched received requests...
Connection map: { "abc123...": null }
```

### Expected UI:
- ✅ Cards showing caretaker names
- ✅ Specialization and experience displayed
- ✅ "Available" badge (green)
- ✅ "Connect" button (or status: "Request Sent", "Connected", "Accept Request")

### Troubleshooting:
❌ **"No caretakers are currently available"**
- Check: Do caretakers exist? Run test query #1
- Check: Is `availability_status = 'available'`? Run test query #3
- Check: Console for errors

❌ **Console Error: "Error fetching users"**
- Check: RLS policies on `users` table
- Run: `GRANT SELECT ON public.users TO authenticated;`

❌ **Console Error: "Error fetching profiles"**
- Check: RLS policies on `profiles` table
- Verify `fix_connection_schema.sql` was run

## Testing Find Patients Page (Caretaker Side)

### URL: `/caretaker/find-patients`

### Steps:
1. **Login as a Caretaker**
2. **Navigate to Find Patients** (sidebar or dashboard button)
3. **Open Browser Console** (F12)
4. **Check Console Output**:

**Success Output:**
```
Loading patients data for caretaker: xyz789...
Fetching available patients...
Fetched 3 available patients
Available patients: [
  {
    id: "def456...",
    full_name: "John Doe",
    condition: "General Health Monitoring",
    availability_status: "available",
    users: { role: "patient", email: "..." }
  },
  ...
]
Fetched accepted connections...
Fetched sent requests...
Fetched received requests...
Connection map: { "def456...": null }
```

### Expected UI:
- ✅ Cards showing patient names
- ✅ Condition displayed (or "No specific condition listed")
- ✅ "Available" badge (green)
- ✅ "Connect" button (or status: "Request Sent", "Connected", "Accept Request")

### Troubleshooting:
❌ **"No patients are currently looking for caretakers"**
- Check: Do patients exist? Run test query #2
- Check: Is `availability_status = 'available'`? Run test query #3
- Check: Console for errors

## Connection Status Testing

### Test Sending Connection Request:
1. Click "Connect" button on a user card
2. **Expected**:
   - Toast: "Request sent!"
   - Button changes to "Request Sent" (yellow)
   - Console: Shows updated connection map

### Test Accepting Request:
1. Have another user send you a request
2. Refresh the page
3. **Expected**:
   - Button shows "Accept Request" (blue)
   - Click to accept
   - Toast: "Connected!"
   - Button changes to "Connected" (green)

## Data Flow Verification

### How It Works:

**For Find Caretakers (Patient viewing):**
```
1. Query users table → Get all users with role='caretaker'
2. Query profiles table → Get profiles for those IDs where availability_status='available'
3. Merge data in JavaScript
4. Display cards
```

**For Find Patients (Caretaker viewing):**
```
1. Query users table → Get all users with role='patient'
2. Query profiles table → Get profiles for those IDs where availability_status='available'
3. Merge data in JavaScript
4. Display cards
```

## Common Issues & Solutions

### Issue: Empty list but users exist in database
**Solution:**
```sql
-- Check if availability_status is set
SELECT id, full_name, availability_status FROM profiles WHERE availability_status IS NULL;

-- Set availability for all users
UPDATE profiles SET availability_status = 'available' WHERE availability_status IS NULL;
```

### Issue: Permission denied errors
**Solution:**
```sql
-- Grant permissions
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;

-- Verify RLS policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('users', 'profiles');
```

### Issue: Console shows "Fetched 0 available X"
**Causes:**
1. No users with that role exist
2. Users exist but `availability_status != 'available'`
3. RLS policies blocking access

**Debug:**
```sql
-- Check raw data
SELECT COUNT(*) FROM users WHERE role = 'patient';
SELECT COUNT(*) FROM profiles WHERE availability_status = 'available';

-- Check what authenticated user can see
SELECT * FROM users; -- Should return all users
SELECT * FROM profiles WHERE availability_status = 'available'; -- Should return available profiles
```

## Success Checklist

### Find Caretakers Page:
- [ ] Page loads without errors
- [ ] Console shows "Fetched X available caretakers" (X > 0)
- [ ] Caretaker cards display with names
- [ ] Specialization and experience shown
- [ ] "Connect" button works
- [ ] Connection status updates correctly

### Find Patients Page:
- [ ] Page loads without errors
- [ ] Console shows "Fetched X available patients" (X > 0)
- [ ] Patient cards display with names
- [ ] Condition shown (or default message)
- [ ] "Connect" button works
- [ ] Connection status updates correctly

## Quick SQL Fixes

### Make all users available:
```sql
UPDATE profiles SET availability_status = 'available';
```

### Create a test caretaker:
```sql
-- Assuming you have a caretaker user already
UPDATE profiles 
SET 
    availability_status = 'available',
    specialization = 'Cardiology',
    experience = 10
WHERE id = (SELECT id FROM users WHERE role = 'caretaker' LIMIT 1);
```

### Create a test patient:
```sql
-- Assuming you have a patient user already
UPDATE profiles 
SET 
    availability_status = 'available',
    condition = 'Diabetes Management'
WHERE id = (SELECT id FROM users WHERE role = 'patient' LIMIT 1);
```

## Next Steps After Testing

Once both pages work:
1. ✅ Test connection request flow end-to-end
2. ✅ Verify notifications/toasts appear correctly
3. ✅ Test with multiple users
4. ✅ Verify RLS prevents unauthorized access
5. ✅ Test edge cases (no users, all connected, etc.)
