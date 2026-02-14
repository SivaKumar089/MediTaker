import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchPendingRequests, respondToRequest } from "../../services/connectionService";
import { toast, ToastContainer } from "react-toastify";
import { FaUserPlus, FaCheck, FaTimes } from "react-icons/fa";

export default function PatientRequests() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) loadRequests();
    }, [user]);

    const loadRequests = async () => {
        try {
            if (!user) return;
            setLoading(true);
            // Fetch requests sent BY patients TO me (caretaker)
            const data = await fetchPendingRequests(user.id, 'caretaker');
            setRequests(data || []);
        } catch (error) {
            toast.error("Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    const handleResponse = async (id: string, status: 'accepted' | 'rejected') => {
        try {
            await respondToRequest(id, status);
            toast.success(`Request ${status}`);
            loadRequests();
        } catch (error) {
            toast.error("Action failed");
        }
    };

    return (
        <div className="space-y-6">
            <ToastContainer />
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <FaUserPlus className="mr-3 text-blue-600" /> Connection Requests
            </h1>

            {loading ? (
                <p className="text-gray-500">Loading requests...</p>
            ) : requests.length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-gray-100">
                    <p className="text-gray-500">No pending connection requests.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {requests.map((req) => (
                        <div key={req.id} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col items-center text-center">
                            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold mb-4">
                                {req.profile?.full_name?.[0] || "?"}
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">{req.profile?.full_name || "Unknown User"}</h3>
                            <p className="text-sm text-gray-500 mb-6">{req.profile?.phone || "No phone number"}</p>

                            <div className="flex space-x-3 w-full">
                                <button
                                    onClick={() => handleResponse(req.id, 'accepted')}
                                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center shadow-md shadow-blue-200"
                                >
                                    <FaCheck className="mr-2" /> Accept
                                </button>
                                <button
                                    onClick={() => handleResponse(req.id, 'rejected')}
                                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition flex items-center justify-center border border-gray-200"
                                >
                                    <FaTimes className="mr-2" /> Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
