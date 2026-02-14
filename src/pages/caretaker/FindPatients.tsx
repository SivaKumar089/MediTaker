import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchAllUsers, sendConnectionRequest, fetchConnectedPatients, fetchSentRequests, fetchPendingRequests, respondToRequest } from "../../services/connectionService";
import { toast, ToastContainer } from "react-toastify";
import { FaUserInjured, FaPaperPlane, FaCheckCircle, FaClock, FaExclamationCircle } from "react-icons/fa";

export default function FindPatients() {
    const { user } = useAuth();
    const [patients, setPatients] = useState<any[]>([]);

    // Track connection statuses by patient ID
    const [connections, setConnections] = useState<Record<string, 'accepted' | 'pending_sent' | 'pending_received' | null>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) loadData();
    }, [user]);

    const loadData = async () => {
        try {
            if (!user) return;
            setLoading(true);

            console.log('Loading patients data for caretaker:', user.id);

            // 1. Get Available Patients (fetchAvailableUsers with role='caretaker' returns patients)
            console.log('Fetching available patients...');
            const available = await fetchAllUsers('caretaker');
            console.log('Available patients:', available);

            // 2. Get Accepted Connections
            console.log('Fetching accepted connections...');
            const accepted = await fetchConnectedPatients(user.id);
            console.log('Accepted connections:', accepted);

            // 3. Get Sent Requests (Pending)
            console.log('Fetching sent requests...');
            const sent = await fetchSentRequests(user.id, 'caretaker');
            console.log('Sent requests:', sent);

            // 4. Get Received Requests (Pending)
            console.log('Fetching received requests...');
            const received = await fetchPendingRequests(user.id, 'caretaker');
            console.log('Received requests:', received);

            // Build map
            const connMap: Record<string, 'accepted' | 'pending_sent' | 'pending_received' | null> = {};

            accepted?.forEach((c: any) => {
                const patientId = c.patient_id || c.profile?.id;
                if (patientId) connMap[patientId] = 'accepted';
            });

            sent?.forEach((c: any) => {
                if (c.patient_id) connMap[c.patient_id] = 'pending_sent';
            });

            received?.forEach((c: any) => {
                const patientId = c.profile?.id || c.sender?.id;
                if (patientId) connMap[patientId] = 'pending_received';
            });

            console.log('Connection map:', connMap);
            setConnections(connMap);
            setPatients(available || []);

            if (!available || available.length === 0) {
                console.warn('No available patients found. Check database and RLS policies.');
            }
        } catch (error: any) {
            console.error('Error loading data:', error);
            toast.error(error.message || "Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (patientId: string) => {
        try {
            if (!user) return;
            // From caretaker to patient
            await sendConnectionRequest(user.id, patientId, 'caretaker');
            toast.success("Request sent!");
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Failed to send request");
        }
    };

    const handleAccept = async (patientId: string) => {
        try {
            const requests = await fetchPendingRequests(user!.id, 'caretaker');
            const req = requests.find((r: any) => r.profile?.id === patientId || r.sender?.id === patientId);
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
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Find Patients</h1>
            </div>

            {loading ? (
                <p>Loading available patients...</p>
            ) : patients.length === 0 ? (
                <div className="bg-white p-8 rounded-xl text-center border border-gray-100">
                    <p className="text-gray-500">No patients are currently looking for caretakers.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {patients.map((patient) => {
                        const status = connections[patient.id];
                        return (
                            <div key={patient.id} className="bg-white p-6 rounded-xl shadow-sm border border-blue-50 hover:shadow-md transition">
                                <div className="flex items-center mb-4">
                                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-4">
                                        <FaUserInjured className="text-xl" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{patient.full_name || "Patient"}</h3>
                                        <span className={`text-xs px-2 py-1 rounded-full uppercase font-bold tracking-wide ${patient.availability_status === 'available'
                                                ? 'bg-green-100 text-green-700'
                                                : patient.availability_status === 'busy'
                                                    ? 'bg-red-100 text-red-600'
                                                    : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {patient.availability_status === 'available' ? 'Available'
                                                : patient.availability_status === 'busy' ? 'Busy'
                                                    : 'Offline'}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-500 mb-6 line-clamp-2">
                                    {patient.phone || "No phone"} {patient.age ? `• Age: ${patient.age}` : ""}
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
                                        onClick={() => handleAccept(patient.id)}
                                        className="w-full py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg flex items-center justify-center font-medium transition"
                                    >
                                        <FaExclamationCircle className="mr-2" /> Accept Request
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleConnect(patient.id)}
                                        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center shadow-md shadow-blue-200"
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
