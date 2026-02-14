import { useState, useEffect } from "react";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../context/AuthContext";
import { toast, ToastContainer } from "react-toastify";
import { FaPlus, FaSearch, FaFilter, FaEdit, FaTrash, FaExclamationTriangle } from "react-icons/fa";

interface Medicine {
    id: string;
    name: string;
    category: string;
    current_stock: number;
    max_stock: number;
    description: string;
    expiry_date: string;
}

export default function Inventory() {
    const { user } = useAuth();
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        category: "Tablet",
        current_stock: 0,
        max_stock: 100,
        description: "",
        expiry_date: "",
    });

    const [filterCategory, setFilterCategory] = useState("All Categories");
    const [filterStatus, setFilterStatus] = useState("All Status");

    useEffect(() => {
        fetchMedicines();
    }, []);

    const fetchMedicines = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("medicines")
                .select("*")
                .order("name", { ascending: true });

            if (error) throw error;
            setMedicines(data || []);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === "current_stock" || name === "max_stock" ? parseInt(value) || 0 : value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.current_stock > formData.max_stock) {
            toast.error("Current stock cannot exceed maximum stock (100)");
            return;
        }

        try {
            if (editingMedicine) {
                const { error } = await supabase
                    .from("medicines")
                    .update(formData)
                    .eq("id", editingMedicine.id);
                if (error) throw error;
                toast.success("Medicine updated successfully");
            } else {
                const { error } = await supabase
                    .from("medicines")
                    .insert([{ ...formData, caretaker_id: user?.id }]);
                if (error) throw error;
                toast.success("Medicine added successfully");
            }
            setShowAddModal(false);
            setEditingMedicine(null);
            resetForm();
            fetchMedicines();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            category: "Tablet",
            current_stock: 0,
            max_stock: 100,
            description: "",
            expiry_date: "",
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this medicine?")) return;
        try {
            const { error } = await supabase.from("medicines").delete().eq("id", id);
            if (error) throw error;
            toast.success("Medicine deleted");
            fetchMedicines();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const openEditModal = (medicine: Medicine) => {
        setEditingMedicine(medicine);
        setFormData({
            name: medicine.name,
            category: medicine.category,
            current_stock: medicine.current_stock,
            max_stock: medicine.max_stock,
            description: medicine.description || "",
            expiry_date: medicine.expiry_date || "",
        });
        setShowAddModal(true);
    };

    const filteredMedicines = medicines.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === "All Categories" || m.category === filterCategory;

        let matchesStatus = true;
        const today = new Date();
        const expiry = m.expiry_date ? new Date(m.expiry_date) : null;
        const daysToExpiry = expiry ? Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : Infinity;

        if (filterStatus === "Low Stock") matchesStatus = m.current_stock < 20 && m.current_stock > 0;
        else if (filterStatus === "Out of Stock") matchesStatus = m.current_stock === 0;
        else if (filterStatus === "Expired") matchesStatus = daysToExpiry < 0;
        else if (filterStatus === "Expiring Soon") matchesStatus = daysToExpiry > 0 && daysToExpiry <= 30;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <ToastContainer />
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Medicine Inventory</h1>
                    <p className="text-gray-500 text-sm">Manage your central medicine stock</p>
                </div>
                <button
                    onClick={() => { resetForm(); setEditingMedicine(null); setShowAddModal(true); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition shadow-md"
                >
                    <FaPlus className="mr-2" /> Add New Medicine
                </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search medicine name or category..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option>All Categories</option>
                        <option>Tablet</option>
                        <option>Syrup</option>
                        <option>Injection</option>
                        <option>Ointment</option>
                        <option>Drops</option>
                        <option>Inhaler</option>
                    </select>
                    <select
                        className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option>All Status</option>
                        <option>Low Stock</option>
                        <option>Out of Stock</option>
                        <option>Expiring Soon</option>
                        <option>Expired</option>
                    </select>
                    <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <FaFilter className="text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Medicine Grid/Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Levels</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400 font-medium italic">Loading inventory...</td></tr>
                            ) : filteredMedicines.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400 font-medium italic">No medicines found. Add your first medicine to get started!</td></tr>
                            ) : (
                                filteredMedicines.map((medicine) => (
                                    <tr key={medicine.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-gray-900">{medicine.name}</div>
                                            <div className="text-xs text-gray-500 truncate max-w-xs">{medicine.description || "No description"}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {medicine.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className={`${medicine.current_stock < 20 ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                                                        {medicine.current_stock} units
                                                    </span>
                                                    <span className="text-gray-400">/ {medicine.max_stock}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                    <div
                                                        className={`h-1.5 rounded-full ${medicine.current_stock < 20 ? 'bg-red-500' : 'bg-blue-500'}`}
                                                        style={{ width: `${(medicine.current_stock / medicine.max_stock) * 100}%` }}
                                                    ></div>
                                                </div>
                                                {medicine.current_stock < 20 && (
                                                    <span className="flex items-center text-[10px] text-red-500 mt-1 font-bold italic">
                                                        <FaExclamationTriangle className="mr-1" /> Low Stock Warning
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {medicine.expiry_date ? new Date(medicine.expiry_date).toLocaleDateString() : "N/A"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => openEditModal(medicine)} className="text-blue-600 hover:text-blue-900 mr-4 p-2 hover:bg-blue-50 rounded-full transition"><FaEdit /></button>
                                            <button onClick={() => handleDelete(medicine.id)} className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-full transition"><FaTrash /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-blue-50">
                            <h3 className="text-lg font-bold text-blue-800">
                                {editingMedicine ? "Edit Medicine" : "Add New Medicine"}
                            </h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Medicine Name *</label>
                                    <input name="name" required value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                                    <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                        <option>Tablet</option>
                                        <option>Syrup</option>
                                        <option>Injection</option>
                                        <option>Ointment</option>
                                        <option>Drops</option>
                                        <option>Inhaler</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Current Stock *</label>
                                        <input name="current_stock" type="number" required min="0" max="100" value={formData.current_stock} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Max Stock (100)</label>
                                        <input name="max_stock" type="number" value={formData.max_stock} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Expiry Date</label>
                                    <input name="expiry_date" type="date" value={formData.expiry_date} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                                    <textarea name="description" rows={3} value={formData.description} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Dosage info or usage instructions..." />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                                    {editingMedicine ? "Save Changes" : "Add Medicine"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
