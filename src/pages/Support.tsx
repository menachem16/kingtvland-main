import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { googleSheets } from '@/integrations/google-sheets/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Send } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

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
}

const Support = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchChatRooms();
    }
  }, [user]);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [selectedRoom]);

  const fetchChatRooms = async () => {
    try {
      const rooms = await googleSheets.getChatRooms(user!.id);
      setChatRooms(rooms as any);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedRoom) return;
    try {
      const msgs = await googleSheets.getMessages(selectedRoom);
      setMessages(msgs as any);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const subscribeToMessages = () => {
    if (!selectedRoom) return;
    // Polling every 5s
    const id = setInterval(fetchMessages, 5000);
    return () => clearInterval(id);
  };

  const createChatRoom = async () => {
    if (!newSubject.trim()) {
      toast({
        title: 'שגיאה',
        description: 'נא להזין נושא',
        variant: 'destructive'
      });
      return;
    }

    try {
      const result = await googleSheets.createChatRoom(user!.id, newSubject);
      if (!result.success || !result.room) throw new Error(result.error);
      setChatRooms([result.room, ...chatRooms]);
      setSelectedRoom(result.room.id);
      setNewSubject('');
      toast({ title: 'הצלחה', description: 'צ\'אט נוצר בהצלחה' });
    } catch (error) {
      console.error('Error creating chat room:', error);
      toast({ title: 'שגיאה', description: 'שגיאה ביצירת צ\'אט', variant: 'destructive' });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;

    try {
      const result = await googleSheets.sendMessage(selectedRoom, user!.id, newMessage, false);
      if (!result.success) throw new Error(result.error);
      setNewMessage('');
      await fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בשליחת הודעה',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-gradient">תמיכה</h1>
        <p className="text-muted-foreground text-lg">צ'אט עם צוות התמיכה</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chat Rooms List */}
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              צ'אטים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="נושא הצ'אט"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              />
              <Button onClick={createChatRoom} className="w-full">
                צור צ'אט חדש
              </Button>
            </div>

            <ScrollArea className="h-[400px]">
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
                      <p className="font-medium">{room.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(room.created_at).toLocaleDateString('he-IL')}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        room.status === 'open' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20'
                      }`}>
                        {room.status === 'open' ? 'פתוח' : 'סגור'}
                      </span>
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
            <CardTitle>הודעות</CardTitle>
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
                          message.is_admin ? 'justify-start' : 'justify-end'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            message.is_admin
                              ? 'bg-muted'
                              : 'bg-primary text-primary-foreground'
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
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button onClick={sendMessage} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                בחר צ'אט או צור צ'אט חדש
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Support;
