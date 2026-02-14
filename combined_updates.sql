-- 1. Add 'address' column to 'profiles'
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;

-- 2. Create 'health_records' table for independent vitals
CREATE TABLE IF NOT EXISTS public.health_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    heart_rate INTEGER,
    blood_pressure TEXT,
    notes TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for health_records
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for health_records
CREATE POLICY "Patients can manage own health records" ON public.health_records 
USING (patient_id = auth.uid())
WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Caretakers view connected patients health records" ON public.health_records FOR SELECT
USING (EXISTS (SELECT 1 FROM public.connections WHERE caretaker_id = auth.uid() AND patient_id = public.health_records.patient_id AND status = 'accepted'));

-- 3. Create 'messages' table for real-time messaging
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view their own messages" ON public.messages FOR SELECT
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages" ON public.messages FOR INSERT
WITH CHECK (sender_id = auth.uid());

-- Enable Realtime for messages and health_records
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.health_records;
