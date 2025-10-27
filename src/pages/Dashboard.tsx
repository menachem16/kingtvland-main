import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { googleSheets } from '@/integrations/google-sheets/client';
import { Calendar, CreditCard, Package, Crown, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, profile } = useAuth();

  const { data: subscription } = useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return await googleSheets.getUserSubscription(user.id);
    },
    enabled: !!user?.id,
  });

  const { data: orders } = useQuery({
    queryKey: ['user-orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await googleSheets.getUserOrders(user.id);
    },
    enabled: !!user?.id,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            ברוך הבא, {profile?.first_name}
          </h1>
          <p className="text-muted-foreground text-lg">
            כאן תוכל לנהל את החשבון שלך ולעקוב אחר המנויים שלך
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* Profile Card */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-subtle opacity-50" />
            <CardHeader className="relative">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>פרופיל אישי</CardTitle>
              </div>
              <CardDescription>
                נהל את הפרטים האישיים שלך
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-2 mb-4">
                <p className="text-sm">
                  <span className="font-medium">שם:</span> {profile?.first_name} {profile?.last_name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">אימייל:</span> {user?.email}
                </p>
                <p className="text-sm">
                  <span className="font-medium">טלפון:</span> {profile?.phone || 'לא הוזן'}
                </p>
              </div>
              <Button asChild className="w-full">
                <Link to="/profile">עדכן פרופיל</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Subscription Card */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-subtle opacity-50" />
            <CardHeader className="relative">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <CardTitle>מנוי נוכחי</CardTitle>
              </div>
              <CardDescription>
                סטטוס המנוי שלך
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              {subscription && subscription.status === 'active' ? (
                <div className="space-y-3">
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    פעיל
                  </Badge>
                  <div>
                    <h4 className="font-medium">{subscription.subscription_plans?.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      יפוג ב: {new Date(subscription.end_date).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Badge variant="secondary">אין מנוי פעיל</Badge>
                  <Button asChild className="w-full">
                    <Link to="/#pricing">בחר מנוי</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admin Panel Card (if admin) */}
          {profile?.is_admin && (
            <Card className="relative overflow-hidden border-amber-200">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-amber-100 opacity-50" />
              <CardHeader className="relative">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-amber-800">ניהול מערכת</CardTitle>
                </div>
                <CardDescription>
                  כלי ניהול למנהלי המערכת
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <Button asChild className="w-full bg-amber-600 hover:bg-amber-700">
                  <Link to="/admin">פתח לוח ניהול</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle>הזמנות אחרונות</CardTitle>
            </div>
            <CardDescription>
              ההזמנות האחרונות שלך
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orders && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">הזמנה #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-medium">₪{order.amount}</p>
                      <Badge 
                        variant={order.payment_status === 'completed' ? 'default' : 'secondary'}
                        className={order.payment_status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {order.payment_status === 'completed' ? 'הושלם' : 'ממתין'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">אין הזמנות עדיין</h3>
                <p className="text-muted-foreground mb-4">
                  כשתבצע הזמנה, היא תופיע כאן
                </p>
                <Button asChild>
                  <Link to="/#pricing">צפה במנויים</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
