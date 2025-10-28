import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { googleSheets } from '@/integrations/google-sheets/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Users, CreditCard, Package, MessageSquare, TrendingUp, DollarSign, Settings, Shield } from 'lucide-react';
import AdminUsersTab from '@/components/admin/AdminUsersTab';
import AdminPlansTab from '@/components/admin/AdminPlansTab';
import AdminOrdersTab from '@/components/admin/AdminOrdersTab';
import AdminCouponsTab from '@/components/admin/AdminCouponsTab';
import AdminChatTab from '@/components/admin/AdminChatTab';
import AdminSettingsTab from '@/components/admin/AdminSettingsTab';
import AdminAuditTab from '@/components/admin/AdminAuditTab';

interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  activePlans: number;
}

const Admin = () => {
  const { user, profile, isLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activePlans: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (profile?.is_admin) {
      fetchStats();
    }
  }, [profile]);

  const fetchStats = async () => {
    try {
      const [usersResponse, ordersResponse, plansResponse] = await Promise.all([
        googleSheets.get<any[]>('?action=getAllUsers'),
        googleSheets.get<any[]>('?action=getOrders&userId=all'),
        googleSheets.get<any[]>('?action=getPlans'),
      ]);

      if (!usersResponse.success || !ordersResponse.success || !plansResponse.success) {
        throw new Error(
          usersResponse.message || ordersResponse.message || plansResponse.message || 'Failed to fetch stats'
        );
      }

      const totalUsers = usersResponse.data.length || 0;
      const totalOrders = ordersResponse.data.length || 0;
      const totalRevenue = ordersResponse.data.reduce((sum: number, order: any) =>
        sum + Number(order['סכום'] || order['amount'] || 0), 0); // Adjust column name
      const activePlans = plansResponse.data.filter((plan: any) =>
        plan['פעיל'] || plan['is_active']
      ).length || 0;

      setStats({
        totalUsers,
        totalOrders,
        totalRevenue,
        activePlans,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  const statCards = [
    {
      title: 'סך המשתמשים',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      description: 'משתמשים רשומים במערכת',
    },
    {
      title: 'סך ההזמנות',
      value: stats.totalOrders.toLocaleString(),
      icon: CreditCard,
      description: 'הזמנות שבוצעו במערכת',
    },
    {
      title: 'סך ההכנסות',
      value: `₪${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: 'הכנסות כוללות',
    },
    {
      title: 'תוכניות פעילות',
      value: stats.activePlans.toLocaleString(),
      icon: Package,
      description: 'תוכניות מנוי זמינות',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-gradient">פאנל ניהול</h1>
        <p className="text-muted-foreground text-lg">ניהול המערכת והנתונים</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <Card key={index} className="glass border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsLoading ? '...' : stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 glass">
          <TabsTrigger value="users"><Users className="h-4 w-4 ml-2" />משתמשים</TabsTrigger>
          <TabsTrigger value="plans"><Package className="h-4 w-4 ml-2" />תוכניות</TabsTrigger>
          <TabsTrigger value="orders"><CreditCard className="h-4 w-4 ml-2" />הזמנות</TabsTrigger>
          <TabsTrigger value="coupons"><TrendingUp className="h-4 w-4 ml-2" />קופונים</TabsTrigger>
          <TabsTrigger value="chat"><MessageSquare className="h-4 w-4 ml-2" />צ'אטים</TabsTrigger>
          <TabsTrigger value="audit"><Shield className="h-4 w-4 ml-2" />ביקורת</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="h-4 w-4 ml-2" />הגדרות</TabsTrigger>
        </TabsList>
        <TabsContent value="users"><AdminUsersTab onStatsUpdate={fetchStats} /></TabsContent>
        <TabsContent value="plans"><AdminPlansTab onStatsUpdate={fetchStats} /></TabsContent>
        <TabsContent value="orders"><AdminOrdersTab /></TabsContent>
        <TabsContent value="coupons"><AdminCouponsTab /></TabsContent>
        <TabsContent value="chat"><AdminChatTab /></TabsContent>
        <TabsContent value="audit"><AdminAuditTab /></TabsContent>
        <TabsContent value="settings"><AdminSettingsTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;