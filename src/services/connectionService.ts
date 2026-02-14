import { supabase } from "./supabase";

// --- AVAILABILITY ---
export const updateAvailability = async (userId: string, status: 'available' | 'busy' | 'offline') => {
    const { error } = await supabase
        .from('profiles')
        .update({ availability_status: status })
        .eq('id', userId);
    if (error) throw error;
};

export const fetchAvailableUsers = async (myRole: 'caretaker' | 'patient') => {
    const targetRole = myRole === 'patient' ? 'caretaker' : 'patient';

    try {
        const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, email, role')
            .eq('role', targetRole);

        if (usersError) throw usersError;
        if (!usersData || usersData.length === 0) return [];

        const userIds = usersData.map(u => u.id);
        const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds)
            .eq('availability_status', 'available');

        if (profilesError) throw profilesError;

        const mergedData = profilesData?.map(profile => {
            const user = usersData.find(u => u.id === profile.id);
            return { ...profile, users: user };
        }) || [];

        return mergedData;
    } catch (error) {
        console.error('fetchAvailableUsers error:', error);
        throw error;
    }
};

export const fetchAllUsers = async (myRole: 'caretaker' | 'patient') => {
    const targetRole = myRole === 'patient' ? 'caretaker' : 'patient';

    try {
        const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, email, role')
            .eq('role', targetRole);

        if (usersError) throw usersError;
        if (!usersData || usersData.length === 0) return [];

        const userIds = usersData.map(u => u.id);
        const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);

        if (profilesError) throw profilesError;

        const mergedData = profilesData?.map(profile => {
            const user = usersData.find(u => u.id === profile.id);
            return { ...profile, users: user };
        }) || [];

        return mergedData;
    } catch (error) {
        console.error('fetchAllUsers error:', error);
        throw error;
    }
};

// --- CONNECTIONS ---

export const sendConnectionRequest = async (fromId: string, toId: string, role: 'caretaker' | 'patient') => {
    const patient_id = role === 'patient' ? fromId : toId;
    const caretaker_id = role === 'caretaker' ? fromId : toId;

    // Requirement 5: One Patient -> One Caretaker
    // Check if patient already has an accepted caretaker
    const { data: activeConn } = await supabase
        .from('connections')
        .select('id')
        .eq('patient_id', patient_id)
        .eq('status', 'accepted')
        .single();

    if (activeConn) {
        throw new Error(role === 'patient' ? "You already have an active caretaker." : "This patient already has an active caretaker.");
    }

    // Check if pending already exists
    const { data: existing } = await supabase
        .from('connections')
        .select('id')
        .eq('patient_id', patient_id)
        .eq('caretaker_id', caretaker_id)
        .neq('status', 'rejected') // Can retry if rejected before
        .maybeSingle();

    if (existing) throw new Error("A request is already pending or accepted with this user.");

    const { error } = await supabase
        .from('connections')
        .insert([{
            patient_id,
            caretaker_id,
            status: 'pending',
            requested_by: role
        }]);

    if (error) throw error;
};

export const respondToRequest = async (connectionId: string, status: 'accepted' | 'rejected') => {
    if (status === 'accepted') {
        // Double check if patient already has a caretaker before accepting
        const { data: conn } = await supabase
            .from('connections')
            .select('patient_id')
            .eq('id', connectionId)
            .single();

        if (conn) {
            const { data: activeConn } = await supabase
                .from('connections')
                .select('id')
                .eq('patient_id', conn.patient_id)
                .eq('status', 'accepted')
                .maybeSingle();

            if (activeConn) throw new Error("This patient already has an active caretaker.");
        }
    }

    const { error } = await supabase
        .from('connections')
        .update({ status })
        .eq('id', connectionId);
    if (error) throw error;
};

export const fetchPendingRequests = async (userId: string, role: 'caretaker' | 'patient') => {
    const myColumn = role === 'caretaker' ? 'caretaker_id' : 'patient_id';
    const senderRole = role === 'caretaker' ? 'patient' : 'caretaker';

    const { data: connections, error } = await supabase
        .from('connections')
        .select('id, created_at, requested_by, patient_id, caretaker_id')
        .eq(myColumn, userId)
        .eq('status', 'pending')
        .eq('requested_by', senderRole);

    if (error) throw error;
    if (!connections || connections.length === 0) return [];

    const senderIds = connections.map(c => role === 'caretaker' ? c.patient_id : c.caretaker_id);
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', senderIds);

    if (profileError) throw profileError;

    return connections.map(conn => {
        const senderId = role === 'caretaker' ? conn.patient_id : conn.caretaker_id;
        const profile = profiles?.find(p => p.id === senderId);
        return { ...conn, profile };
    });
};

export const fetchSentRequests = async (userId: string, role: 'caretaker' | 'patient') => {
    const myColumn = role === 'caretaker' ? 'caretaker_id' : 'patient_id';

    const { data: connections, error } = await supabase
        .from('connections')
        .select('id, status, caretaker_id, patient_id')
        .eq(myColumn, userId)
        .eq('status', 'pending')
        .eq('requested_by', role);

    if (error) throw error;
    if (!connections || connections.length === 0) return [];

    const targetIds = connections.map(c => role === 'caretaker' ? c.patient_id : c.caretaker_id);
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', targetIds);

    if (profileError) throw profileError;

    return connections.map(conn => {
        const targetId = role === 'caretaker' ? conn.patient_id : conn.caretaker_id;
        const profile = profiles?.find(p => p.id === targetId);
        return { ...conn, profile };
    });
};

export const fetchConnections = async (userId: string, role: 'caretaker' | 'patient') => {
    const myColumn = role === 'caretaker' ? 'caretaker_id' : 'patient_id';

    const { data: connections, error } = await supabase
        .from('connections')
        .select('id, status, caretaker_id, patient_id')
        .eq(myColumn, userId)
        .eq('status', 'accepted');

    if (error) throw error;
    if (!connections || connections.length === 0) return [];

    const otherIds = connections.map(c => role === 'caretaker' ? c.patient_id : c.caretaker_id);
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', otherIds);

    if (profileError) throw profileError;

    return connections.map(conn => {
        const otherId = role === 'caretaker' ? conn.patient_id : conn.caretaker_id;
        const profile = profiles?.find(p => p.id === otherId);
        return { ...conn, profile };
    });
};

// Aliases for compatibility
export const fetchAvailableCaretakers = () => fetchAvailableUsers('patient');
export const fetchConnectedPatients = (id: string) => fetchConnections(id, 'caretaker');
export const fetchMyCaretakers = (id: string) => fetchConnections(id, 'patient');
