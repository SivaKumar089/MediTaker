import { supabase } from "./supabase";
import { format, subDays } from "date-fns";

export const fetchDashboardStats = async (userId: string, role: 'caretaker' | 'patient') => {
    try {
        if (role === 'caretaker') {
            // Stats for Caretaker
            const { count: patientCount } = await supabase
                .from('connections')
                .select('*', { count: 'exact', head: true })
                .eq('caretaker_id', userId)
                .eq('status', 'accepted');

            const { count: requestCount } = await supabase
                .from('connections')
                .select('*', { count: 'exact', head: true })
                .eq('caretaker_id', userId)
                .eq('status', 'pending');

            const { count: lowStockCount } = await supabase
                .from('medicines')
                .select('*', { count: 'exact', head: true })
                .eq('caretaker_id', userId)
                .lt('current_stock', 20);

            return {
                patientCount: patientCount || 0,
                requestCount: requestCount || 0,
                lowStockCount: lowStockCount || 0
            };
        } else {
            // Stats for Patient
            const { count: todayMeds } = await supabase
                .from('assigned_medicines')
                .select('*', { count: 'exact', head: true })
                .eq('patient_id', userId)
                .eq('status', 'active');

            const today = new Date().toISOString().split('T')[0];
            const { count: completedToday } = await supabase
                .from('medication_logs')
                .select('*', { count: 'exact', head: true })
                .eq('patient_id', userId)
                .eq('date', today)
                .eq('taken', true);

            const { count: caretakerCount } = await supabase
                .from('connections')
                .select('*', { count: 'exact', head: true })
                .eq('patient_id', userId)
                .eq('status', 'accepted');

            return {
                todayMeds: todayMeds || 0,
                completedToday: completedToday || 0,
                connectedCaretakers: caretakerCount || 0
            };
        }
    } catch (error) {
        console.error("fetchDashboardStats error:", error);
        return null;
    }
};

export const fetchInventoryWithDetails = async (caretakerId: string) => {
    try {
        // Get all medicines for this caretaker
        const { data: medicines, error: medError } = await supabase
            .from('medicines')
            .select('*')
            .eq('caretaker_id', caretakerId);

        if (medError) throw medError;

        // Get assignment counts for each medicine
        const { data: assignments, error: asError } = await supabase
            .from('assigned_medicines')
            .select('medicine_id, patient_id')
            .eq('caretaker_id', caretakerId)
            .eq('status', 'active');

        if (asError) throw asError;

        return medicines.map(med => {
            const assignedPatients = new Set(
                assignments
                    .filter(as => as.medicine_id === med.id)
                    .map(as => as.patient_id)
            ).size;

            return {
                ...med,
                assignedPatientCount: assignedPatients
            };
        });
    } catch (error) {
        console.error("fetchInventoryWithDetails error:", error);
        throw error;
    }
};

export const fetchVitalsHistory = async (patientId: string, days = 7) => {
    const startDate = subDays(new Date(), days).toISOString();

    const { data, error } = await supabase
        .from('health_records')
        .select('*')
        .eq('patient_id', patientId)
        .gte('recorded_at', startDate)
        .order('recorded_at', { ascending: true });

    if (error) throw error;

    return data?.map(record => ({
        date: format(new Date(record.recorded_at), 'MMM dd'),
        fullDate: record.recorded_at,
        heartRate: record.heart_rate,
        bloodPressure: record.blood_pressure,
        sugarLevel: record.sugar_level,
        temperature: record.temperature,
        notes: record.notes
    })) || [];
};

export const fetchPatientHealthRecords = async (patientId: string) => {
    // Comprehensive health record fetch
    try {
        const { data: logs, error: logsError } = await supabase
            .from('medication_logs')
            .select(`
                *,
                assigned_medicine:assigned_medicine_id (
                    dosage,
                    instructions,
                    medicine:medicine_id (name)
                )
            `)
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });

        if (logsError) throw logsError;
        return logs;
    } catch (error) {
        console.error("fetchPatientHealthRecords error:", error);
        throw error;
    }
};

export const fetchMedicationAdherence = async (patientId: string, days = 7) => {
    try {
        const startDate = subDays(new Date(), days).toISOString();

        const { data, error } = await supabase
            .from('medication_logs')
            .select('date, taken')
            .eq('patient_id', patientId)
            .gte('date', startDate.split('T')[0]);

        if (error) throw error;

        const counts: Record<string, number> = {};
        data?.forEach(log => {
            if (log.taken) {
                const d = format(new Date(log.date), 'MMM dd');
                counts[d] = (counts[d] || 0) + 1;
            }
        });

        return Object.keys(counts).map(date => ({
            date,
            count: counts[date]
        }));
    } catch (error) {
        console.error("fetchMedicationAdherence error:", error);
        return [];
    }
};
