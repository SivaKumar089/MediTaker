import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase";
import { toast, ToastContainer } from "react-toastify";
import {
    FaPaperPlane, FaChevronLeft, FaSearch,
    FaCheckDouble, FaSmile, FaPaperclip,
    FaTimes, FaInfoCircle, FaPhone, FaVideo
} from "react-icons/fa";
import { fetchConnections } from "../../services/connectionService";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { format, isToday, isYesterday } from "date-fns";

export default function Messages() {
    const { user } = useAuth();
    const location = useLocation();
    const { contactId } = useParams();
    const navigate = useNavigate();
    const [contacts, setContacts] = useState<any[]>([]);
    const [selectedContact, setSelectedContact] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<any>({});
    const [isOtherTyping, setIsOtherTyping] = useState(false);
    const [activeChannel, setActiveChannel] = useState<any>(null);
    const typingTimeoutRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const userRole = location.pathname.includes('/caretaker/') ? 'caretaker' : 'patient';

    // Shared channel room ID
    const channelId = useMemo(() => {
        if (!user || !selectedContact) return null;
        return [user.id, selectedContact.profile.id].sort().join(':');
    }, [user, selectedContact]);

    const loadContacts = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const data = await fetchConnections(user.id, userRole);
            const contactsWithInfo = await Promise.all((data || []).map(async (c: any) => {
                const { data: lastMsg } = await supabase
                    .from('messages')
                    .select('content, created_at, sender_id, image_url, is_read')
                    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${c.profile.id}),and(sender_id.eq.${c.profile.id},receiver_id.eq.${user.id})`)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                const { count } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('sender_id', c.profile.id)
                    .eq('receiver_id', user.id)
                    .eq('is_read', false);

                return { ...c, lastMessage: lastMsg, unreadCount: count || 0 };
            }));

            setContacts(contactsWithInfo.sort((a, b) => {
                const timeA = new Date(a.lastMessage?.created_at || 0).getTime();
                const timeB = new Date(b.lastMessage?.created_at || 0).getTime();
                return timeB - timeA;
            }));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [user?.id, userRole]);

    useEffect(() => {
        if (user?.id) {
            loadContacts();

            // Global online status channel
            const onlineChannel = supabase.channel('online-status');
            onlineChannel
                .on('presence', { event: 'sync' }, () => {
                    setOnlineUsers(onlineChannel.presenceState());
                })
                .subscribe(async (status) => {
                    if (status === 'SUBSCRIBED' && user?.id) {
                        await onlineChannel.track({
                            userId: user.id,
                            online_at: new Date().toISOString(),
                        });
                    }
                });

            return () => {
                onlineChannel.unsubscribe();
            };
        }
    }, [user?.id, loadContacts]);

    const isUserOnline = (userId: string) => {
        return Object.values(onlineUsers).some((presences: any) =>
            presences.some((p: any) => p.userId === userId)
        );
    };

    // 1. Derive selectedContact from contacts list whenever contactId changes
    useEffect(() => {
        if (contacts.length > 0 && contactId) {
            const found = contacts.find(c => c.profile.id === contactId);
            if (found) {
                // IMPORTANT: Only update if the object is actually different to avoid loops
                setSelectedContact(prev => prev?.profile?.id === found.profile.id ? prev : found);
            }
        } else if (!contactId) {
            setSelectedContact(null);
        }
    }, [contactId, contacts]);

    // 2. Main Chat Effect - Depends on contactId (string), not the whole object
    useEffect(() => {
        if (!contactId || !user) return;

        fetchMessages();
        markAllAsRead();

        const channelId = [user.id, contactId].sort().join(':');
        const roomChannel = supabase.channel(`room:${channelId}`);
        setActiveChannel(roomChannel);

        roomChannel
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${user.id}`
            }, (payload) => {
                if (payload.new.sender_id === contactId) {
                    setMessages(prev => [...prev.filter(m => m.id !== payload.new.id), payload.new]);
                    markAllAsRead();
                }
                updateSidebarLastMessage(payload.new);
            })
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `sender_id=eq.${user.id}`
            }, (payload) => {
                if (payload.new.receiver_id === contactId) {
                    setMessages(prev => [...prev.filter(m => m.id !== payload.new.id), payload.new]);
                }
                updateSidebarLastMessage(payload.new);
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'messages',
                filter: `sender_id=eq.${user.id}`
            }, (payload) => {
                setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${user.id}`
            }, (payload) => {
                if (payload.new.sender_id === contactId) {
                    setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
                }
            })
            .on('broadcast', { event: 'typing' }, ({ payload }) => {
                if (payload.userId === contactId) {
                    setIsOtherTyping(payload.isTyping);
                }
            })
            .subscribe();

        return () => {
            roomChannel.unsubscribe();
            setActiveChannel(null);
            setIsOtherTyping(false);
        };
    }, [contactId, user]); // Only re-run when the ID or User changes

    const handleTypingBroadcast = (isTyping: boolean) => {
        if (activeChannel && user) {
            activeChannel.send({
                type: 'broadcast',
                event: 'typing',
                payload: { userId: user.id, isTyping }
            });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };


    const fetchMessages = async () => {
        if (!contactId || !user) return;
        const { data } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true });
        setMessages(data || []);
    };

    const markAllAsRead = async () => {
        if (!contactId || !user) return;
        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('sender_id', contactId)
            .eq('receiver_id', user.id)
            .eq('is_read', false);

        setContacts(prev => prev.map(c =>
            c.profile.id === contactId ? { ...c, unreadCount: 0 } : c
        ));
    };

    const updateSidebarLastMessage = (msg: any) => {
        const otherId = msg.sender_id === user!.id ? msg.receiver_id : msg.sender_id;
        setContacts(prev => {
            const newContacts = prev.map(c => {
                if (c.profile.id === otherId) {
                    const isNewUnread = msg.sender_id !== user!.id && (contactId !== otherId);
                    return {
                        ...c,
                        lastMessage: msg,
                        unreadCount: isNewUnread ? (c.unreadCount + 1) : c.unreadCount
                    };
                }
                return c;
            });
            return [...newContacts].sort((a, b) => {
                const timeA = new Date(a.lastMessage?.created_at || 0).getTime();
                const timeB = new Date(b.lastMessage?.created_at || 0).getTime();
                return timeB - timeA;
            });
        });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedImage) || !selectedContact || sending) return;

        const content = newMessage.trim();
        setSending(true);
        setNewMessage("");
        let imageUrl = null;

        try {
            if (selectedImage) {
                const fileExt = selectedImage.name.split('.').pop();
                const fileName = `${user!.id}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('medicare')
                    .upload(`chat/${fileName}`, selectedImage);
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('medicare').getPublicUrl(`chat/${fileName}`);
                imageUrl = urlData.publicUrl;
            }

            const { data, error } = await supabase
                .from('messages')
                .insert([{
                    sender_id: user!.id,
                    receiver_id: selectedContact.profile.id,
                    content: content,
                    image_url: imageUrl
                }])
                .select();

            if (error) throw error;
            if (data) {
                setMessages(prev => [...prev.filter(m => m.id !== data[0].id), data[0]]);
                updateSidebarLastMessage(data[0]);
            }
            setSelectedImage(null);
            setImagePreview(null);
        } catch (error: any) {
            toast.error(error.message || "Failed to send");
            setNewMessage(content);
        } finally {
            setSending(false);
        }
    };

    const selectContact = (contact: any) => {
        setSelectedContact(contact);
        navigate(`/${userRole}/messages/${contact.profile.id}`, { replace: true });
    };

    const clearSelection = () => {
        setSelectedContact(null);
        navigate(`/${userRole}/messages`, { replace: true });
    };

    const formatDateHeader = (date: string) => {
        const d = new Date(date);
        if (isToday(d)) return "Today";
        if (isYesterday(d)) return "Yesterday";
        return format(d, 'MMMM d, yyyy');
    };

    return (
        <div className="flex h-[calc(100vh-120px)] bg-slate-50 lg:p-6 gap-6 overflow-hidden">
            <ToastContainer />

            {/* Sidebar View */}
            <div className={`
                ${selectedContact ? 'hidden lg:flex' : 'flex'} 
                w-full lg:w-[400px] bg-white lg:rounded-[3rem] shadow-xl border border-gray-100 flex-col overflow-hidden animate-in fade-in duration-500
            `}>
                <div className="p-8 border-b border-gray-50 flex flex-col gap-6">
                    <h2 className="text-3xl font-black text-slate-800">Messages</h2>
                    <div className="relative">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-[1.5rem] outline-none focus:bg-white focus:ring-2 ring-emerald-500/10 font-bold transition-all text-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {loading ? (
                        <div className="p-20 text-center animate-pulse text-gray-300 font-black uppercase text-xs tracking-widest">Loading Chats...</div>
                    ) : (
                        contacts.filter(c => c.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())).map((contact) => (
                            <button
                                key={contact.id}
                                onClick={() => selectContact(contact)}
                                className={`w-full p-6 flex items-center rounded-[2.5rem] transition-all relative group ${selectedContact?.id === contact.id ? 'bg-emerald-600 text-white shadow-xl' : 'hover:bg-slate-50'}`}
                            >
                                <div className="relative">
                                    <div className={`h-16 w-16 rounded-[1.8rem] flex items-center justify-center text-2xl font-black border-2 border-white ${selectedContact?.id === contact.id ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>
                                        {contact.profile?.full_name?.charAt(0)}
                                    </div>
                                    <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 ${selectedContact?.id === contact.id ? 'border-emerald-600' : 'border-white'} ${isUserOnline(contact.profile?.id) ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-300'}`} />
                                </div>
                                <div className="ml-5 flex-1 text-left overflow-hidden">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="font-black text-base truncate">{contact.profile?.full_name}</p>
                                        <span className={`text-[10px] font-bold ${selectedContact?.id === contact.id ? 'text-emerald-100' : 'text-gray-400'}`}>
                                            {contact.lastMessage ? format(new Date(contact.lastMessage.created_at), 'HH:mm') : ''}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className={`text-xs truncate font-medium ${selectedContact?.id === contact.id ? 'text-emerald-50' : 'text-slate-500'}`}>
                                            {contact.lastMessage?.content || 'Sent a photo'}
                                        </p>
                                        {contact.unreadCount > 0 && (
                                            <span className="h-5 min-w-[20px] px-1.5 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center font-black">
                                                {contact.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat View */}
            <div className={`
                ${selectedContact ? 'flex' : 'hidden lg:flex'} 
                flex-1 bg-white lg:rounded-[3rem] shadow-2xl overflow-hidden relative border border-gray-100 flex-col animate-in slide-in-from-right lg:slide-in-from-none duration-500
            `}>
                {selectedContact ? (
                    <>
                        <div className="p-6 lg:px-10 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur sticky top-0 z-10">
                            <div className="flex items-center">
                                <button onClick={clearSelection} className="lg:hidden mr-6 p-4 bg-slate-50 text-emerald-600 rounded-2xl">
                                    <FaChevronLeft className="text-xl" />
                                </button>
                                <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-[1.4rem] flex items-center justify-center text-xl font-black border-2 border-white shadow-sm">
                                    {selectedContact.profile?.full_name?.charAt(0)}
                                </div>
                                <div className="ml-5">
                                    <p className="font-black text-slate-800 text-lg tracking-tight leading-none mb-1">{selectedContact.profile?.full_name}</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                                            <span className={`h-1.5 w-1.5 rounded-full ${isUserOnline(selectedContact.profile?.id) ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                                            {isUserOnline(selectedContact.profile?.id) ? 'Online' : 'Offline'}
                                        </p>
                                        {isOtherTyping && (
                                            <span className="text-[10px] font-bold text-gray-400 italic animate-pulse">
                                                • Typing...
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-4 text-slate-300 hover:text-emerald-500 transition"><FaPhone /></button>
                                <button className="p-4 text-slate-300 hover:text-emerald-500 transition"><FaVideo /></button>
                                <button className="p-4 text-slate-300 hover:text-emerald-500 transition"><FaInfoCircle /></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 bg-slate-50/30 custom-scrollbar">
                            {messages.map((msg, idx) => {
                                const isMe = msg.sender_id === user!.id;
                                const showDate = idx === 0 || formatDateHeader(messages[idx - 1].created_at) !== formatDateHeader(msg.created_at);
                                return (
                                    <div key={msg.id} className="space-y-4">
                                        {showDate && (
                                            <div className="flex justify-center my-8">
                                                <span className="px-6 py-2 bg-white rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest shadow-sm border border-gray-100">
                                                    {formatDateHeader(msg.created_at)}
                                                </span>
                                            </div>
                                        )}
                                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className="max-w-[85%] lg:max-w-[70%]">
                                                <div className={`p-1 rounded-[2.2rem] shadow-sm ${isMe ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                                                    {msg.image_url && <img src={msg.image_url} className="max-h-[300px] w-full object-cover rounded-[1.8rem] mb-1 shadow-inner" />}
                                                    {msg.content && <div className="px-5 py-3 text-[15px] font-bold leading-relaxed">{msg.content}</div>}
                                                    <div className={`px-5 pb-3 flex items-center justify-end gap-1.5 ${isMe ? 'text-emerald-200' : 'text-slate-400'}`}>
                                                        <p className="text-[9px] font-black">{format(new Date(msg.created_at), 'HH:mm')}</p>
                                                        {isMe && <FaCheckDouble className={`text-[10px] ${msg.is_read ? 'text-blue-300' : ''}`} />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {imagePreview && (
                            <div className="p-4 bg-emerald-50 border-t border-emerald-100 flex items-center gap-6">
                                <div className="relative">
                                    <img src={imagePreview} className="h-24 w-24 object-cover rounded-2xl border-4 border-white shadow-lg" />
                                    <button onClick={() => { setImagePreview(null); setSelectedImage(null); }} className="absolute -top-3 -right-3 h-8 w-8 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs shadow-xl"><FaTimes /></button>
                                </div>
                                <p className="text-xs font-black text-emerald-800 uppercase tracking-widest">Medical Image Attachment</p>
                            </div>
                        )}

                        <form onSubmit={handleSendMessage} className="p-6 lg:p-10 border-t border-gray-50 bg-white flex gap-4">
                            <div className="flex-1 bg-slate-50 p-2 rounded-[2.5rem] flex items-end">
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-5 text-slate-300 hover:text-emerald-500"><FaPaperclip className="text-xl" /></button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) { setSelectedImage(file); setImagePreview(URL.createObjectURL(file)); }
                                }} />
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => {
                                        setNewMessage(e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = e.target.scrollHeight + 'px';

                                        handleTypingBroadcast(true);
                                        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                                        typingTimeoutRef.current = setTimeout(() => {
                                            handleTypingBroadcast(false);
                                        }, 2000);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(e as any);
                                            handleTypingBroadcast(false);
                                        }
                                    }}
                                    placeholder="Message..."
                                    className="flex-1 bg-transparent py-5 px-2 text-sm font-bold outline-none resize-none max-h-40 min-h-[56px] placeholder:text-slate-300"
                                    rows={1}
                                />
                                <button type="button" className="p-5 text-slate-300 hover:text-emerald-500"><FaSmile className="text-xl" /></button>
                            </div>
                            <button disabled={sending || (!newMessage.trim() && !selectedImage)} className="h-16 w-16 bg-emerald-600 text-white rounded-[1.8rem] flex items-center justify-center shadow-xl shadow-emerald-200/50 hover:bg-emerald-700 active:scale-95 transition-all">
                                <FaPaperPlane className={sending ? 'animate-pulse' : ''} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-20 bg-white relative">
                        <div className="h-44 w-44 bg-emerald-50 rounded-[4rem] shadow-inner flex items-center justify-center mb-10">
                            <FaPaperPlane className="text-6xl text-emerald-500" />
                        </div>
                        <h3 className="text-4xl font-black text-slate-800 tracking-tight leading-none mb-4">Start a Conversation</h3>
                        <p className="text-slate-400 font-bold max-w-sm mx-auto text-sm italic italic leading-relaxed">Select one of your health partners from the list to begin real-time consultation.</p>
                    </div>
                )}
            </div>
        </div>
    );
}


