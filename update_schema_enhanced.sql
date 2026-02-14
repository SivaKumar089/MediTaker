-- Add Availability Status to Users/Profiles or Separate Table
-- We'll add it to the 'profiles' table for simplicity as it's user-specific state
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS availability_status TEXT CHECK (availability_status IN ('available', 'busy', 'offline')) DEFAULT 'offline';

-- Update Medication Logs to include health vitals (optional based on request)
ALTER TABLE public.medication_logs ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.medication_logs ADD COLUMN IF NOT EXISTS heart_rate INTEGER;
ALTER TABLE public.medication_logs ADD COLUMN IF NOT EXISTS blood_pressure TEXT;

-- Create a Separate Table for Calendar Appointments if not just medication
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caretaker_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Policies for Appointments
CREATE POLICY "Users view their appointments" ON public.appointments FOR SELECT 
USING (caretaker_id = auth.uid() OR patient_id = auth.uid());

CREATE POLICY "Caretakers manage appointments" ON public.appointments FOR ALL 
USING (caretaker_id = auth.uid());

CREATE POLICY "Patients can insert appointments requests" ON public.appointments FOR INSERT 
WITH CHECK (patient_id = auth.uid());
