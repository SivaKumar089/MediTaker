import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchAllUsers, sendConnectionRequest, fetchMyCaretakers, fetchSentRequests, fetchPendingRequests, respondToRequest } from "../../services/connectionService";
import { toast, ToastContainer } from "react-toastify";
import { FaUserMd, FaPaperPlane, FaCheckCircle, FaClock, FaExclamationCircle } from "react-icons/fa";

export default function FindCaretakers() {
    const { user } = useAuth();
    const [caretakers, setCaretakers] = useState<any[]>([]);

    // Track connection statuses by caretaker ID
    const [connections, setConnections] = useState<Record<string, 'accepted' | 'pending_sent' | 'pending_received' | null>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) loadData();
    }, [user]);

    const loadData = async () => {
        try {
            if (!user) return;
            setLoading(true);

            console.log('Loading caretakers data for patient:', user.id);

            // 1. Get Available Caretakers
            console.log('Fetching available caretakers...');
            const available = await fetchAllUsers('patient');
            console.log('Available caretakers:', available);

            // 2. Get Accepted Connections
            console.log('Fetching accepted connections...');
            const accepted = await fetchMyCaretakers(user.id);
            console.log('Accepted connections:', accepted);

            // 3. Get Sent Requests (Pending)
            console.log('Fetching sent requests...');
            const sent = await fetchSentRequests(user.id, 'patient');
            console.log('Sent requests:', sent);

            // 4. Get Received Requests (Pending)
            console.log('Fetching received requests...');
            const received = await fetchPendingRequests(user.id, 'patient');
            console.log('Received requests:', received);

            // Build map
            const connMap: Record<string, 'accepted' | 'pending_sent' | 'pending_received' | null> = {};

            accepted?.forEach((c: any) => {
                const caretakerId = c.caretaker_id || c.profile?.id;
                if (caretakerId) connMap[caretakerId] = 'accepted';
            });

            sent?.forEach((c: any) => {
                if (c.caretaker_id) connMap[c.caretaker_id] = 'pending_sent';
            });

            received?.forEach((c: any) => {
                const caretakerId = c.profile?.id || c.sender?.id;
                if (caretakerId) connMap[caretakerId] = 'pending_received';
            });

            console.log('Connection map:', connMap);
            setConnections(connMap);
            setCaretakers(available || []);

            if (!available || available.length === 0) {
                console.warn('No available caretakers found. Check database and RLS policies.');
            }
        } catch (error: any) {
            console.error('Error loading data:', error);
            toast.error(error.message || "Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (caretakerId: string) => {
        try {
            if (!user) return;
            // Function updated to take 3 args: fromId, toId, role
            await sendConnectionRequest(user.id, caretakerId, 'patient');
            toast.success("Request sent!");
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Failed to send request");
        }
    };

    const handleAccept = async (caretakerId: string) => {
        // We need conn ID. 
        // Ideally fetchPendingRequests returns ID.
        // Let's optimize: loadData should store full objects if needed, but for now we re-fetch to keep it simple or find ID from 'received'.
        // Actually, let's just find the ID from the list we fetched.
        // But we didn't store the raw list in state.
        // Let's re-fetch or store IDs in a separate map.
        // Quick fix: Fetch pending requests again to find ID.

        try {
            const requests = await fetchPendingRequests(user!.id, 'patient');
            const req = requests.find((r: any) => r.profile?.id === caretakerId || r.sender?.id === caretakerId);
            if (req) {
                await respondToRequest(req.id, 'accepted');
                toast.success("Connected!");
                loadData();
            }
        } catch (error) {
            toast.error("Failed to accept");
        }
    };

    return (
        <div className="space-y-6">
            <ToastContainer />
            <h1 className="text-2xl font-bold text-gray-800">Find Caretakers</h1>

            {loading ? (
                <p>Loading available caretakers...</p>
            ) : caretakers.length === 0 ? (
                <div className="bg-white p-8 rounded-xl text-center border border-gray-100">
                    <p className="text-gray-500">No caretakers are currently available.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {caretakers.map((caretaker) => {
                        const status = connections[caretaker.id];
                        return (
                            <div key={caretaker.id} className="bg-white p-6 rounded-xl shadow-sm border border-emerald-50 hover:shadow-md transition">
                                <div className="flex items-center mb-4">
                                    <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mr-4">
                                        <FaUserMd className="text-xl" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{caretaker.full_name || "Medical Professional"}</h3>
                                        <span className={`text-xs px-2 py-1 rounded-full uppercase font-bold tracking-wide ${caretaker.availability_status === 'available'
                                                ? 'bg-green-100 text-green-700'
                                                : caretaker.availability_status === 'busy'
                                                    ? 'bg-red-100 text-red-600'
                                                    : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {caretaker.availability_status === 'available' ? 'Available'
                                                : caretaker.availability_status === 'busy' ? 'Busy'
                                                    : 'Offline'}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-500 mb-6 line-clamp-2">
                                    {caretaker.phone || "No phone"} {caretaker.specialization ? `• ${caretaker.specialization}` : ""}
                                </p>

                                {status === 'accepted' ? (
                                    <button disabled className="w-full py-2 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-medium cursor-default">
                                        <FaCheckCircle className="mr-2" /> Connected
                                    </button>
                                ) : status === 'pending_sent' ? (
                                    <button disabled className="w-full py-2 bg-yellow-50 text-yellow-600 rounded-lg flex items-center justify-center font-medium cursor-default">
                                        <FaClock className="mr-2" /> Request Sent
                                    </button>
                                ) : status === 'pending_received' ? (
                                    <button
                                        onClick={() => handleAccept(caretaker.id)}
                                        className="w-full py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg flex items-center justify-center font-medium transition"
                                    >
                                        <FaExclamationCircle className="mr-2" /> Accept Request
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleConnect(caretaker.id)}
                                        className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center justify-center shadow-emerald-200 shadow-md"
                                    >
                                        <FaPaperPlane className="mr-2" /> Connect
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
