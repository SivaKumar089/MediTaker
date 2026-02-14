import { supabase } from "./supabase";

export interface CheckInPayload {
    patient_id: string;
    medicine_id: string; // Ref to patient_medications.id, or null if general checkin
    status: 'completed' | 'missed';
    photo_file?: File;
    notes?: string;
    checked_at: string;
}

export const submitCheckIn = async (payload: CheckInPayload) => {
    let photoUrl = null;

    // 1. Upload Photo if present
    if (payload.photo_file) {
        const fileExt = payload.photo_file.name.split('.').pop();
        const fileName = `${payload.patient_id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('checkin-photos')
            .upload(fileName, payload.photo_file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('checkin-photos')
            .getPublicUrl(fileName);

        photoUrl = publicUrl;
    }

    // 2. Insert Check-in Record
    const { data: insertCheckIn, error: insertError } = await supabase
        .from('checkins')
        .insert([{
            patient_id: payload.patient_id,
            medicine_id: payload.medicine_id,
            status: payload.status,
            photo_url: photoUrl,
            notes: payload.notes,
            checked_at: payload.checked_at
        }])
        .select()
        .single();

    if (insertError) throw insertError;

    // 3. Trigger Email Notification (Using Edge Function or RPC)
    // We assume an RPC 'notify_caretaker' exists that handles lookup and email sending.

    // Attempt to notify immediately, but don't block success if notification fails (async)
    supabase.rpc('notify_caretaker', {
        checkin_id: insertCheckIn.id
    }).then(({ error }) => {
        if (error) console.error("Failed to trigger email notification:", error);
    });

    return insertCheckIn;
};

export const getCheckInsForDate = async (patientId: string, date: string) => {
    // date string YYYY-MM-DD
    // Filter checkins where checked_at date part matches

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
        .from('checkins')
        .select('*')
        .eq('patient_id', patientId)
        .gte('checked_at', startOfDay.toISOString())
        .lte('checked_at', endOfDay.toISOString());

    if (error) throw error;
    return data;
};

export const getMonthlyCheckIns = async (patientId: string, year: number, month: number) => {
    // month is 0-11
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59); // Last day of month

    const { data, error } = await supabase
        .from('checkins')
        .select('checked_at, status')
        .eq('patient_id', patientId)
        .gte('checked_at', startDate.toISOString())
        .lte('checked_at', endDate.toISOString());

    if (error) throw error;
    return data;
};
