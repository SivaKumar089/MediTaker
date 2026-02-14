-- 1. Create PUBLIC USERS Table (to link with role)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('patient', 'caretaker')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create PROFILES Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    age INTEGER,
    profile_picture_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create CONNECTIONS Table
CREATE TABLE public.connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caretaker_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) NOT NULL,
    requested_by TEXT CHECK (requested_by IN ('caretaker', 'patient')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create MEDICINES Table
CREATE TABLE public.medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caretaker_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    current_stock INTEGER DEFAULT 0 NOT NULL,
    max_stock INTEGER DEFAULT 100 NOT NULL,
    description TEXT,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create ASSIGNED MEDICINES Table
CREATE TABLE public.assigned_medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medicine_id UUID REFERENCES public.medicines(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    caretaker_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    dosage TEXT NOT NULL,
    frequency INTEGER NOT NULL, -- times per day
    duration_days INTEGER NOT NULL,
    time_schedule JSONB NOT NULL, -- {morning: true, afternoon: false, ...}
    instructions TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT CHECK (status IN ('active', 'completed')) DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create MEDICATION LOGS Table
CREATE TABLE public.medication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assigned_medicine_id UUID REFERENCES public.assigned_medicines(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    time_slot TEXT CHECK (time_slot IN ('morning', 'afternoon', 'evening', 'night')) NOT NULL,
    taken BOOLEAN DEFAULT false NOT NULL,
    taken_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create REMINDERS Table
CREATE TABLE public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    caretaker_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    type TEXT CHECK (type IN ('manual', 'automatic')) NOT NULL,
    status TEXT CHECK (status IN ('sent', 'failed')) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assigned_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Caretakers can view their connected patients profiles" ON public.users FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.connections WHERE caretaker_id = auth.uid() AND patient_id = public.users.id AND status = 'accepted'));

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Caretakers view connected profiles" ON public.profiles FOR SELECT
USING (EXISTS (SELECT 1 FROM public.connections WHERE caretaker_id = auth.uid() AND patient_id = public.profiles.id AND status = 'accepted'));

-- Connections
CREATE POLICY "Users view relevant connections" ON public.connections FOR SELECT USING (caretaker_id = auth.uid() OR patient_id = auth.uid());
CREATE POLICY "Users insert connections" ON public.connections FOR INSERT WITH CHECK (caretaker_id = auth.uid() OR patient_id = auth.uid());
CREATE POLICY "Users update connections" ON public.connections FOR UPDATE USING (caretaker_id = auth.uid() OR patient_id = auth.uid());

-- Medicines
CREATE POLICY "Caretakers manage medicines" ON public.medicines USING (caretaker_id = auth.uid());
CREATE POLICY "Patients view assigned medicines" ON public.medicines FOR SELECT
USING (EXISTS (SELECT 1 FROM public.assigned_medicines WHERE patient_id = auth.uid() AND medicine_id = public.medicines.id));

-- Assigned Medicines
CREATE POLICY "Caretakers manage assignments" ON public.assigned_medicines USING (caretaker_id = auth.uid());
CREATE POLICY "Patients view own assignments" ON public.assigned_medicines FOR SELECT USING (patient_id = auth.uid());

-- Medication Logs
CREATE POLICY "Patients manage own logs" ON public.medication_logs USING (patient_id = auth.uid());
CREATE POLICY "Caretakers view patient logs" ON public.medication_logs FOR SELECT
USING (EXISTS (SELECT 1 FROM public.connections WHERE caretaker_id = auth.uid() AND patient_id = public.medication_logs.patient_id AND status = 'accepted'));

-- Reminders
CREATE POLICY "Users view relevant reminders" ON public.reminders FOR SELECT USING (patient_id = auth.uid() OR caretaker_id = auth.uid());
CREATE POLICY "Caretakers insert reminders" ON public.reminders FOR INSERT WITH CHECK (caretaker_id = auth.uid());

-- Triggers for profiles/users insertion on signup (AUTOMATIC)
-- This is much safer than doing it from the frontend.

-- Function to handle new user signup
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

-- Trigger to call function on auth signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
