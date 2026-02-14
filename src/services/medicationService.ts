import { supabase } from "./supabase";

export interface MedicineAssignment {
    id: string;
    patient_id: string;
    caretaker_id: string;
    medicine_name: string;
    dosage: string;
    frequency: string;
    time_of_day: string[]; // e.g. ["Morning", "Night"]
    start_date: string;
    end_date?: string;
    active: boolean;
}

export const assignMedicine = async (assignment: Omit<MedicineAssignment, "id" | "active">) => {
    const { data, error } = await supabase
        .from("patient_medications")
        .insert([{ ...assignment, active: true }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const fetchPatientMedicines = async (patientId: string) => {
    const { data, error } = await supabase
        .from("patient_medications")
        .select("*")
        .eq("patient_id", patientId)
        .eq("active", true);

    if (error) throw error;
    return data;
};

export const getTodayMedicines = async (patientId: string) => {
    // In a real app, we would filter by start/end date logic here or in DB
    // For now, we assume active medicines apply to today.
    // Also need to parse 'frequency' or 'time_of_day' to generate specific tasks.

    const { data, error } = await supabase
        .from("patient_medications")
        .select("*")
        .eq("patient_id", patientId)
        .eq("active", true);

    if (error) throw error;
    return data;
};
