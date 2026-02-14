import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchPendingRequests, fetchConnections, fetchSentRequests, respondToRequest } from "../../services/connectionService";
import { supabase } from "../../services/supabase";
import { toast, ToastContainer } from "react-toastify";
import { FaUserMd, FaCheck, FaTimes, FaClock, FaCheckCircle, FaTimesCircle, FaInbox } from "react-icons/fa";

type TabType = 'incoming' | 'sent' | 'accepted' | 'rejected';

export default function CaretakerRequests() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('incoming');
    const [incoming, setIncoming] = useState<any[]>([]);
    const [sent, setSent] = useState<any[]>([]);
    const [accepted, setAccepted] = useState<any[]>([]);
    const [rejected, setRejected] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) loadAll();
    }, [user]);

    const loadAll = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Incoming requests from caretakers
            const inc = await fetchPendingRequests(user.id, 'patient');
            setIncoming(inc || []);

            // Sent requests by me (patient)
            const snt = await fetchSentRequests(user.id, 'patient');
            setSent(snt || []);

            // Accepted connections
            const acc = await fetchConnections(user.id, 'patient');
            setAccepted(acc || []);

            // Rejected - fetch from DB directly
            const { data: rej } = await supabase
                .from('connections')
                .select('id, status, caretaker_id, patient_id, created_at')
                .eq('patient_id', user.id)
                .eq('status', 'rejected');

            if (rej && rej.length > 0) {
                const ids = rej.map(r => r.caretaker_id);
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('*')
                    .in('id', ids);
                const merged = rej.map(r => ({
                    ...r,
                    profile: profiles?.find(p => p.id === r.caretaker_id)
                }));
                setRejected(merged);
            } else {
                setRejected([]);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    const handleResponse = async (id: string, status: 'accepted' | 'rejected') => {
        try {
            await respondToRequest(id, status);
            toast.success(`Request ${status}!`);
            loadAll();
        } catch (error) {
            toast.error("Action failed");
        }
    };

    const tabs: { key: TabType; label: string; count: number; icon: React.ReactNode }[] = [
        { key: 'incoming', label: 'Incoming', count: incoming.length, icon: <FaInbox /> },
        { key: 'sent', label: 'Sent', count: sent.length, icon: <FaClock /> },
        { key: 'accepted', label: 'Accepted', count: accepted.length, icon: <FaCheckCircle /> },
        { key: 'rejected', label: 'Rejected', count: rejected.length, icon: <FaTimesCircle /> },
    ];

    const renderCard = (item: any, type: TabType) => {
        const profile = item.profile;
        return (
            <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="flex items-center mb-4">
                    <div className="h-14 w-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mr-4">
                        {profile?.full_name?.[0]?.toUpperCase() || <FaUserMd className="text-xl" />}
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-800 text-lg">{profile?.full_name || "Caretaker"}</h3>
                        <p className="text-sm text-gray-500">{profile?.phone || "No phone"}</p>
                        {profile?.availability_status && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold mt-1 inline-block ${profile.availability_status === 'available'
                                ? 'bg-green-100 text-green-700'
                                : profile.availability_status === 'busy'
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-gray-100 text-gray-500'
                                }`}>
                                {profile.availability_status.charAt(0).toUpperCase() + profile.availability_status.slice(1)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Action buttons based on type */}
                {type === 'incoming' && (
                    <div className="flex space-x-3">
                        <button
                            onClick={() => handleResponse(item.id, 'accepted')}
                            className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg hover:bg-emerald-700 transition flex items-center justify-center font-medium"
                        >
                            <FaCheck className="mr-2" /> Accept
                        </button>
                        <button
                            onClick={() => handleResponse(item.id, 'rejected')}
                            className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition flex items-center justify-center font-medium"
                        >
                            <FaTimes className="mr-2" /> Reject
                        </button>
                    </div>
                )}

                {type === 'sent' && (
                    <div className="flex items-center justify-center py-2 bg-yellow-50 text-yellow-600 rounded-lg font-medium">
                        <FaClock className="mr-2" /> Pending Response
                    </div>
                )}

                {type === 'accepted' && (
                    <div className="flex items-center justify-center py-2 bg-emerald-50 text-emerald-600 rounded-lg font-medium">
                        <FaCheckCircle className="mr-2" /> Connected
                    </div>
                )}

                {type === 'rejected' && (
                    <div className="flex items-center justify-center py-2 bg-red-50 text-red-500 rounded-lg font-medium">
                        <FaTimesCircle className="mr-2" /> Rejected
                    </div>
                )}
            </div>
        );
    };

    const getActiveList = () => {
        switch (activeTab) {
            case 'incoming': return incoming;
            case 'sent': return sent;
            case 'accepted': return accepted;
            case 'rejected': return rejected;
        }
    };

    return (
        <div className="space-y-6">
            <ToastContainer />
            <h1 className="text-2xl font-bold text-gray-800">Connection Requests</h1>

            {/* Tabs */}
            <div className="flex space-x-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-100">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg text-sm font-medium transition ${activeTab === tab.key
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                        {tab.count > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                                }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <p className="text-gray-500">Loading requests...</p>
            ) : getActiveList().length === 0 ? (
                <div className="bg-white p-10 rounded-xl text-center border border-gray-100">
                    <p className="text-gray-400 text-lg">No {activeTab} requests.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {getActiveList().map(item => renderCard(item, activeTab))}
                </div>
            )}
        </div>
    );
}
