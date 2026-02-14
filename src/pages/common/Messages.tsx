import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase";
import { toast, ToastContainer } from "react-toastify";
import { FaPaperPlane, FaCircle, FaChevronLeft } from "react-icons/fa";
import { fetchConnections } from "../../services/connectionService";
import { useLocation } from "react-router-dom";

export default function Messages() {
    const { user } = useAuth();
    const location = useLocation();
    const [contacts, setContacts] = useState<any[]>([]);
    const [selectedContact, setSelectedContact] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showContacts, setShowContacts] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const userRole = location.pathname.includes('/caretaker/') ? 'caretaker' : 'patient';

    useEffect(() => {
        if (user) {
            loadContacts();
        }
    }, [user]);

    useEffect(() => {
        if (selectedContact) {
            fetchMessages();
            const subscription = subscribeToMessages();
            if (window.innerWidth < 1024) setShowContacts(false);
            return () => {
                subscription.unsubscribe();
            };
        }
    }, [selectedContact]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const loadContacts = async () => {
        setLoading(true);
        try {
            const data = await fetchConnections(user!.id, userRole);
            setContacts(data || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load contacts");
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${selectedContact.profile.id}),and(sender_id.eq.${selectedContact.profile.id},receiver_id.eq.${user!.id})`)
            .order('created_at', { ascending: true });

        if (!error) setMessages(data || []);
    };

    const subscribeToMessages = () => {
        return supabase
            .channel('public:messages')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${user!.id}`
            }, (payload) => {
                if (payload.new.sender_id === selectedContact?.profile?.id) {
                    setMessages(prev => [...prev, payload.new]);
                }
            })
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `sender_id=eq.${user!.id}`
            }, (payload) => {
                setMessages(prev => {
                    if (prev.find(m => m.id === payload.new.id)) return prev;
                    return [...prev, payload.new];
                });
            })
            .subscribe();
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedContact) return;

        setSending(true);
        const { data, error } = await supabase
            .from('messages')
            .insert([{
                sender_id: user!.id,
                receiver_id: selectedContact.profile.id,
                content: newMessage.trim()
            }])
            .select();

        if (error) {
            toast.error("Failed to send message");
        } else {
            setNewMessage("");
            if (data) setMessages(prev => [...prev, data[0]]);
        }
        setSending(false);
    };

    return (
        <div className="flex h-[calc(100vh-12rem)] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 relative">
            <ToastContainer />

            {/* Contacts Sidebar */}
            <div className={`${showContacts ? 'w-full lg:w-80 active' : 'hidden lg:flex w-80'} border-r border-gray-100 flex flex-col transition-all duration-300 z-20 bg-white`}>
                <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Chat</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Connections</p>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="p-10 text-center">
                            <div className="animate-spin h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                        </div>
                    ) : contacts.length === 0 ? (
                        <div className="p-10 text-center text-gray-400 font-bold italic">No active connections.</div>
                    ) : (
                        contacts.map((contact) => (
                            <button
                                key={contact.id}
                                onClick={() => setSelectedContact(contact)}
                                className={`w-full p-6 flex items-center hover:bg-emerald-50/50 transition-all border-b border-gray-50 relative group ${selectedContact?.id === contact.id ? 'bg-emerald-50 border-r-4 border-r-emerald-500' : ''}`}
                            >
                                <div className="relative">
                                    <div className="h-14 w-14 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 text-xl font-black shadow-inner border-2 border-white">
                                        {contact.profile?.full_name?.charAt(0) || 'U'}
                                    </div>
                                    <FaCircle className={`absolute -bottom-1 -right-1 text-xs border-2 border-white rounded-full ${contact.profile?.availability_status === 'available' ? 'text-green-500' : 'text-gray-300'}`} />
                                </div>
                                <div className="ml-4 text-left overflow-hidden">
                                    <p className="font-black text-gray-900 tracking-tight truncate">{contact.profile?.full_name || "User"}</p>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">{contact.profile?.role || 'Portal User'}</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col bg-slate-50/40 ${!showContacts ? 'flex' : 'hidden lg:flex'}`}>
                {selectedContact ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-5 px-8 border-b border-white bg-white/80 backdrop-blur flex items-center justify-between shadow-sm sticky top-0 z-10">
                            <div className="flex items-center">
                                <button onClick={() => setShowContacts(true)} className="lg:hidden mr-4 p-2 text-gray-400 hover:text-gray-900 transition">
                                    <FaChevronLeft />
                                </button>
                                <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center font-black shadow-inner border-2 border-white">
                                    {selectedContact.profile?.full_name?.charAt(0)}
                                </div>
                                <div className="ml-4">
                                    <p className="font-black text-gray-900 tracking-tight">{selectedContact.profile?.full_name}</p>
                                    <div className="flex items-center">
                                        <span className={`h-2 w-2 rounded-full mr-2 ${selectedContact.profile?.availability_status === 'available' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{selectedContact.profile?.availability_status || 'Offline'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] bg-fixed opacity-95">
                            {messages.map((msg) => {
                                const isMe = msg.sender_id === user!.id;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                        <div className={`max-w-[85%] lg:max-w-[70%] p-5 rounded-[2rem] shadow-xl ${isMe
                                            ? 'bg-emerald-600 text-white rounded-tr-none shadow-emerald-200/20'
                                            : 'bg-white text-gray-800 rounded-tl-none border border-gray-100 shadow-gray-200/20'
                                            }`}>
                                            <p className="text-sm font-bold leading-relaxed">{msg.content}</p>
                                            <p className={`text-[9px] mt-3 font-black uppercase tracking-widest ${isMe ? 'text-emerald-200' : 'text-gray-300'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <form onSubmit={handleSendMessage} className="p-6 lg:p-8 bg-white border-t border-gray-100 flex gap-4 backdrop-blur">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Message..."
                                className="flex-1 p-5 bg-gray-50 border-4 border-transparent rounded-3xl outline-none focus:border-emerald-500 focus:bg-white transition-all font-bold placeholder:text-gray-300"
                            />
                            <button
                                disabled={sending || !newMessage.trim()}
                                className="w-16 h-16 bg-emerald-600 text-white rounded-3xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200/50 disabled:opacity-50 flex items-center justify-center text-xl"
                            >
                                <FaPaperPlane />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white">
                        <div className="h-32 w-32 bg-emerald-50 rounded-[3rem] shadow-inner flex items-center justify-center mb-8 animate-bounce transition-all duration-1000">
                            <FaCommentDots className="text-5xl text-emerald-500" />
                        </div>
                        <h3 className="text-3xl font-black text-gray-900 tracking-tight">Secure Messaging</h3>
                        <p className="text-gray-400 font-bold max-w-sm mx-auto mt-4 leading-relaxed italic">"Select a conversation to begin real-time consultation with your health specialist."</p>
                    </div>
                )}
            </div>
        </div>
    );
}

const FaCommentDots = (props: any) => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M256 32c141.38 0 256 100.89 256 225.12 0 120.35-107.41 219.05-244.57 224.84l-10.74 1.13c-7.23.75-14.54.12-21.36-1.85a97.58 97.58 0 01-44.59-24.8c-24.62-21.72-52-32.18-86.43-34.79C41.28 420.24 16 397.77 16 371a53 53 0 011.83-13.84c3.48-13.31 9.49-25.5 17.61-35.88l3.12-4C13.25 292.06 0 263.85 0 236.43 0 122.1 114.62 32 256 32zm0 304a40 40 0 10-40-40 40 40 0 0040 40zm112 0a40 40 0 10-40-40 40 40 0 0040 40zm-224 0a40 40 0 10-40-40 40 40 0 0040 40z"></path>
    </svg>
);
