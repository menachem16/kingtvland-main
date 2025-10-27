import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { googleSheets } from '@/integrations/google-sheets/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { chatMessageSchema } from '@/lib/validations';

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

type ChatStage = 'greeting' | 'email' | 'options' | 'chat';

const GREETING_KEYWORDS = ['היי', 'שלום', 'הי', 'מה המצב', 'מה נשמע', 'בוקר טוב', 'ערב טוב'];

const SUPPORT_OPTIONS = [
  { id: 'subscription', label: 'שאלות לגבי מנוי', route: '/subscription' },
  { id: 'payment', label: 'בעיות תשלום', route: '/subscription' },
  { id: 'profile', label: 'עדכון פרטים אישיים', route: '/profile' },
  { id: 'general', label: 'שאלה כללית', route: '/support' },
];

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [stage, setStage] = useState<ChatStage>('greeting');
  const [userEmail, setUserEmail] = useState('');
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Rate limiting: max 1 message per 2 seconds
  const RATE_LIMIT_MS = 2000;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (content: string, isBot: boolean) => {
    setMessages(prev => [...prev, {
      id: Math.random().toString(),
      content,
      isBot,
      timestamp: new Date()
    }]);
  };

  const handleGreeting = (text: string) => {
    const isGreeting = GREETING_KEYWORDS.some(keyword => 
      text.toLowerCase().includes(keyword)
    );

    if (isGreeting) {
      addMessage('היי! איך אפשר לעזור לך היום? 😊', true);
      
      if (!user) {
        setTimeout(() => {
          addMessage('נשמח אם תוכל לשתף אותנו באימייל שלך כדי שנוכל לעזור לך טוב יותר', true);
          setStage('email');
        }, 1000);
      } else {
        setTimeout(() => {
          setStage('options');
          addMessage('במה אוכל לעזור לך? בחר אחת מהאפשרויות:', true);
        }, 1000);
      }
      return true;
    }
    return false;
  };

  const handleEmailSubmit = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email)) {
      setUserEmail(email);
      addMessage('תודה! עכשיו בחר במה אוכל לעזור:', true);
      setStage('options');
      return true;
    } else {
      addMessage('האימייל לא תקין, נסה שוב בבקשה', true);
      return false;
    }
  };

  const handleOptionSelect = async (option: typeof SUPPORT_OPTIONS[0]) => {
    addMessage(option.label, false);
    
    if (option.route === '/support') {
      // Create chat room for general support
      if (user) {
        try {
          const { data, error } = await supabase
            .from('chat_rooms')
            .insert({
              user_id: user.id,
              subject: option.label,
              status: 'open'
            })
            .select()
            .single();

          if (error) throw error;
          
          setChatRoomId(data.id);
          setStage('chat');
          addMessage('מעולה! אפשר לכתוב לי כאן את השאלה שלך ונחזור אליך בהקדם', true);
        } catch (error) {
          console.error('Error creating chat room:', error);
          toast({
            title: 'שגיאה',
            description: 'לא הצלחנו ליצור צ\'אט. נסה שוב',
            variant: 'destructive'
          });
        }
      } else {
        addMessage('כדי לפתוח צ\'אט תמיכה, יש להתחבר תחילה', true);
        setTimeout(() => {
          navigate('/auth');
          setIsOpen(false);
        }, 2000);
      }
    } else {
      addMessage('מעביר אותך לדף המתאים...', true);
      setTimeout(() => {
        navigate(option.route);
        setIsOpen(false);
      }, 1500);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Rate limiting check
    const now = Date.now();
    if (now - lastMessageTime < RATE_LIMIT_MS) {
      toast({
        title: 'נא להמתין',
        description: 'אנא המתן מספר שניות לפני שליחת הודעה נוספת',
        variant: 'destructive'
      });
      return;
    }

    // Validate message length
    const validation = chatMessageSchema.safeParse({ content: inputValue });
    if (!validation.success) {
      toast({
        title: 'שגיאה',
        description: validation.error.issues[0].message,
        variant: 'destructive'
      });
      return;
    }

    setIsSending(true);
    setLastMessageTime(now);
    addMessage(inputValue, false);
    const messageText = inputValue;
    setInputValue('');

    switch (stage) {
      case 'greeting':
        if (!handleGreeting(messageText)) {
          addMessage('היי! כדי להתחיל, אנא כתוב "היי" או "שלום" 😊', true);
        }
        break;

      case 'email':
        handleEmailSubmit(messageText);
        break;

      case 'chat':
        if (chatRoomId && user) {
          try {
            const { error } = await supabase
              .from('messages')
              .insert({
                chat_room_id: chatRoomId,
                sender_id: user.id,
                content: messageText,
                is_admin: false
              });
            
            if (error) throw error;
            addMessage('ההודעה נשלחה! נחזור אליך בהקדם 👍', true);
          } catch (error) {
            console.error('Error sending message:', error);
            addMessage('שגיאה בשליחת ההודעה. נסה שוב', true);
            toast({
              title: 'שגיאה',
              description: 'לא הצלחנו לשלוח את ההודעה. נסה שוב',
              variant: 'destructive'
            });
          }
        }
        break;
    }
    setIsSending(false);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className="fixed bottom-6 left-6 rounded-full w-16 h-16 shadow-2xl animate-glow z-50 bg-gradient-primary hover:scale-110 transition-transform"
      >
        <MessageCircle className="h-8 w-8" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 left-6 w-96 h-[600px] shadow-2xl z-50 glass border-primary/20">
      <div className="flex items-center justify-between p-4 bg-gradient-primary rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary-foreground" />
          <h3 className="font-bold text-primary-foreground">צ'אט תמיכה</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="text-primary-foreground hover:bg-primary-foreground/20"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <CardContent className="p-4 flex flex-col h-[calc(100%-4rem)]">
        <ScrollArea className="flex-1 mb-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.isBot
                      ? 'bg-muted'
                      : 'bg-gradient-primary text-primary-foreground'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {msg.timestamp.toLocaleTimeString('he-IL', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}

            {stage === 'options' && (
              <div className="grid grid-cols-1 gap-2 mt-4">
                {SUPPORT_OPTIONS.map((option) => (
                  <Button
                    key={option.id}
                    variant="outline"
                    className="justify-start hover:bg-primary/10"
                    onClick={() => handleOptionSelect(option)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isSending) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              stage === 'greeting' ? 'כתוב היי כדי להתחיל...' :
              stage === 'email' ? 'הכנס אימייל...' :
              'כתוב הודעה...'
            }
            className="flex-1"
            disabled={isSending}
            maxLength={1000}
          />
          <Button 
            onClick={handleSendMessage} 
            size="icon"
            disabled={isSending || !inputValue.trim()}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
