import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { googleSheets } from '@/integrations/google-sheets/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Crown, 
  Calendar, 
  CreditCard, 
  Star,
  Settings,
  ArrowUpCircle,
  CheckCircle,
  Package
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PricingSection from '@/components/PricingSection';

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string;
  subscription_plans?: {
    name: string;
    description: string | null;
    price: number;
    features: any;
  };
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  features: any;
  is_active: boolean;
}

const Subscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscription();
      fetchPlans();
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      if (!user?.id) return;
      const data = await googleSheets.getUserSubscription(user.id);
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      const data = await googleSheets.getSubscriptionPlans();
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      // כאן יהיה הקוד לניהול מנוי דרך Stripe Customer Portal
      toast({
        title: 'בקרוב',
        description: 'אפשרות ניהול מנוי תהיה זמינה בקרוב',
      });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בניהול המנוי',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2 text-gradient">המנוי שלי</h1>
        <p className="text-muted-foreground text-lg">
          נהל את המנוי שלך ושדרג בכל זמן
        </p>
      </div>

      {/* Current Subscription */}
      {subscription && subscription.status === 'active' ? (
        <Card className="glass border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">
                    {subscription.subscription_plans?.name}
                  </CardTitle>
                  <CardDescription>
                    {subscription.subscription_plans?.description}
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                <CheckCircle className="ml-1 h-3 w-3" />
                פעיל
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">מחיר חודשי</p>
                  <p className="text-lg font-bold">
                    ₪{subscription.subscription_plans?.price}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">תאריך התחלה</p>
                  <p className="text-sm">
                    {new Date(subscription.start_date).toLocaleDateString('he-IL')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Star className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Žžd` date</p>
                  <p className="text-sm">
                    {subscription.end_date 
                      ? new Date(subscription.end_date).toLocaleDateString('he-IL')
                      : 'ללא הגבלה'
                    }
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button onClick={handleManageSubscription} className="flex-1">
                <Settings className="ml-2 h-4 w-4" />
                נהל מנוי
              </Button>
              <Button variant="outline" className="flex-1">
                <ArrowUpCircle className="ml-2 h-4 w-4" />
                שדרג תוכנית
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass border-0 text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>אין לך מנוי פעיל</CardTitle>
            <CardDescription>
              בחר תוכנית מנוי כדי להתחיל ליהנות מכל היתרונות
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Available Plans */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">תוכניות מנוי זמינות</h2>
          <p className="text-muted-foreground">
            בחר את התוכנית המתאימה לך ביותר
          </p>
        </div>
        
        <PricingSection plans={plans} />
      </div>
    </div>
  );
};

export default Subscription;
