import { supabase } from "./supabase";

export const fetchMessages = async (userId: string, otherId: string) => {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
};

export const sendMessage = async (senderId: string, receiverId: string, text: string) => {
    const { error } = await supabase
        .from('messages')
        .insert([{
            sender_id: senderId,
            receiver_id: receiverId,
            message_text: text
        }]);

    if (error) throw error;
};

// Subscription for real-time messages
export const subscribeToMessages = (userId: string, otherId: string, callback: (payload: any) => void) => {
    return supabase
        .channel('public:messages')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
        }, (payload) => {
            const msg = payload.new;
            if ((msg.sender_id === userId && msg.receiver_id === otherId) ||
                (msg.sender_id === otherId && msg.receiver_id === userId)) {
                callback(msg);
            }
        })
        .subscribe();
};
