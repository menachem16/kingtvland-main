import { useEffect, useState } from 'react';
import { googleSheets } from '@/integrations/google-sheets/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, CreditCard, Calendar, DollarSign } from 'lucide-react';

interface Order {
  id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  discount_amount: number;
  currency: string;
  payment_status: string;
  stripe_payment_intent_id: string | null;
  stripe_session_id: string | null;
  coupon_code: string | null;
  created_at: string;
}

const AdminOrdersTab = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // TODO: Implement getAllOrders method in Google Sheets client
      // For now, return empty array
      setOrders([]);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון את רשימת ההזמנות',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return <Badge variant="default">שולם</Badge>;
      case 'pending':
        return <Badge variant="secondary">ממתין</Badge>;
      case 'failed':
        return <Badge variant="destructive">נכשל</Badge>;
      case 'cancelled':
        return <Badge variant="outline">בוטל</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredOrders = orders.filter(order => {
    return (
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.stripe_payment_intent_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.coupon_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalRevenue = filteredOrders
    .filter(order => order.payment_status === 'completed' || order.payment_status === 'paid')
    .reduce((sum, order) => sum + Number(order.amount), 0);

  if (loading) {
    return (
      <Card className="glass border-0">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          ניהול הזמנות
        </CardTitle>
        <CardDescription>
          מעקב אחר הזמנות ותשלומים במערכת
        </CardDescription>
        
        <div className="flex items-center gap-4 pt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש הזמנה..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <div className="flex gap-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {filteredOrders.length} הזמנות
            </Badge>
            <Badge variant="default" className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              ₪{totalRevenue.toLocaleString()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="border rounded-lg p-4 bg-card/50"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">הזמנה #{order.id.slice(-8)}</h4>
                    {getStatusBadge(order.payment_status)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">סכום:</span>
                      <div className="font-medium">
                        ₪{Number(order.amount).toLocaleString()}
                      </div>
                    </div>
                    
                    {order.discount_amount > 0 && (
                      <div>
                        <span className="text-muted-foreground">הנחה:</span>
                        <div className="font-medium text-green-600">
                          -₪{Number(order.discount_amount).toLocaleString()}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <span className="text-muted-foreground">תאריך:</span>
                      <div className="font-medium">
                        {new Date(order.created_at).toLocaleDateString('he-IL')}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">מטבע:</span>
                      <div className="font-medium">{order.currency}</div>
                    </div>
                  </div>

                  {order.coupon_code && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">קופון: </span>
                      <Badge variant="outline">{order.coupon_code}</Badge>
                    </div>
                  )}

                  {order.stripe_payment_intent_id && (
                    <div className="text-xs text-muted-foreground">
                      Stripe ID: {order.stripe_payment_intent_id}
                    </div>
                  )}

                  {order.user_id && (
                    <div className="text-xs text-muted-foreground">
                      משתמש: {order.user_id}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              לא נמצאו הזמנות המתאימות לחיפוש
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminOrdersTab;

