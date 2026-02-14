-- 1. Create MESSAGES Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messaging Policies (Only connected users can message each other)
CREATE POLICY "Users can view messages they sent or received" ON public.messages
FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
);

CREATE POLICY "Users can send messages to their connected caretaker/patient" ON public.messages
FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND (
        EXISTS (
            SELECT 1 FROM public.connections 
            WHERE status = 'accepted' AND (
                (caretaker_id = sender_id AND patient_id = receiver_id) OR
                (patient_id = sender_id AND caretaker_id = receiver_id)
            )
        )
    )
);

-- 2. Create Storage Bucket for Medication Proofs (Supabase specific table)
-- Note: This usually requires 'service_role' or manual dashboard setup, 
-- but inserting into storage.buckets can work if permissions allow.
INSERT INTO storage.buckets (id, name, public)
VALUES ('medication-proofs', 'medication-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for 'medication-proofs'
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'medication-proofs');
CREATE POLICY "Authenticated users can upload proofs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'medication-proofs' AND auth.role() = 'authenticated');
