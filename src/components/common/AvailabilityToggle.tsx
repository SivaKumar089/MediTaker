import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateAvailability } from "../../services/connectionService";
import { supabase } from "../../services/supabase";
import { toast } from "react-toastify";
import { FaCircle } from "react-icons/fa";

export default function AvailabilityToggle() {
    const { user } = useAuth();
    const [status, setStatus] = useState<'available' | 'busy' | 'offline'>('offline');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) fetchStatus();
    }, [user]);

    const fetchStatus = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('profiles')
            .select('availability_status')
            .eq('id', user.id)
            .single();
        if (data) setStatus(data.availability_status || 'offline');
    };

    const handleToggle = async (newStatus: 'available' | 'busy' | 'offline') => {
        if (!user) return;
        setLoading(true);
        try {
            await updateAvailability(user.id, newStatus);
            setStatus(newStatus);
            toast.success(`Status updated to ${newStatus}`);
        } catch (error: any) {
            toast.error("Failed to update status");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'available': return 'text-green-500';
            case 'busy': return 'text-red-500';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border shadow-sm">
            <FaCircle className={`text-xs ${getStatusColor(status)}`} />
            <select
                value={status}
                onChange={(e) => handleToggle(e.target.value as any)}
                disabled={loading}
                className="text-sm font-medium text-gray-700 bg-transparent border-none focus:ring-0 cursor-pointer"
            >
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="offline">Offline</option>
            </select>
        </div>
    );
}
