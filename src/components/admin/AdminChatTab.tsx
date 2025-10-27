import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { chatMessageSchema } from '@/lib/validations';

interface Message {
  id: string;
  content: string;
  is_admin: boolean;
  created_at: string;
  sender_id: string;
}

interface ChatRoom {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  user_id: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

const AdminChatTab = () => {
  const { toast } = useToast();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchChatRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [selectedRoom]);

  const fetchChatRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const userIds = data?.map(room => room.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      // Merge profiles with chat rooms
      const chatRoomsWithProfiles = data?.map(room => ({
        ...room,
        profiles: profilesData?.find(p => p.user_id === room.user_id) || {
          first_name: '',
          last_name: ''
        }
      })) || [];

      setChatRooms(chatRoomsWithProfiles);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedRoom) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_room_id', selectedRoom)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const subscribeToMessages = () => {
    if (!selectedRoom) return;

    const channel = supabase
      .channel(`admin-messages:${selectedRoom}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${selectedRoom}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;

    // Validate message
    const validation = chatMessageSchema.safeParse({ content: newMessage });
    if (!validation.success) {
      toast({
        title: 'שגיאה',
        description: validation.error.issues[0].message,
        variant: 'destructive'
      });
      return;
    }

    setIsSending(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_room_id: selectedRoom,
          sender_id: user?.id,
          content: newMessage,
          is_admin: true
        });

      if (error) throw error;
      setNewMessage('');
      
      toast({
        title: 'הצלחה',
        description: 'ההודעה נשלחה בהצלחה'
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בשליחת הודעה. נסה שוב',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  const updateRoomStatus = async (roomId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('chat_rooms')
        .update({ status })
        .eq('id', roomId);

      if (error) throw error;

      setChatRooms(rooms =>
        rooms.map(room =>
          room.id === roomId ? { ...room, status } : room
        )
      );

      toast({
        title: 'הצלחה',
        description: 'סטטוס הצ\'אט עודכן'
      });
    } catch (error) {
      console.error('Error updating room status:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בעדכון סטטוס',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedChatRoom = chatRooms.find(r => r.id === selectedRoom);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Chat Rooms List */}
      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            צ'אטים ({chatRooms.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {chatRooms.map((room) => (
                <Card
                  key={room.id}
                  className={`cursor-pointer transition-all ${
                    selectedRoom === room.id ? 'border-primary' : ''
                  }`}
                  onClick={() => setSelectedRoom(room.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium">{room.subject}</p>
                      <Badge variant={room.status === 'open' ? 'default' : 'secondary'}>
                        {room.status === 'open' ? 'פתוח' : 'סגור'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {room.profiles?.first_name} {room.profiles?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(room.created_at).toLocaleDateString('he-IL')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card className="glass border-0 lg:col-span-2">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>הודעות</CardTitle>
            {selectedChatRoom && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateRoomStatus(selectedRoom!, 'closed')}
                  disabled={selectedChatRoom.status === 'closed'}
                >
                  <XCircle className="h-4 w-4 ml-2" />
                  סגור צ'אט
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateRoomStatus(selectedRoom!, 'open')}
                  disabled={selectedChatRoom.status === 'open'}
                >
                  <CheckCircle className="h-4 w-4 ml-2" />
                  פתח מחדש
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {selectedRoom ? (
            <div className="space-y-4">
              <ScrollArea className="h-[400px] p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.is_admin ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.is_admin
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.created_at).toLocaleTimeString('he-IL')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Textarea
                  placeholder="הקלד הודעה..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isSending) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={isSending}
                  maxLength={1000}
                />
                <Button 
                  onClick={sendMessage} 
                  size="icon"
                  disabled={isSending || !newMessage.trim()}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              בחר צ'אט מהרשימה
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminChatTab;
