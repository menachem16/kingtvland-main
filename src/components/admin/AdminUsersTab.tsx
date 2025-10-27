import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, UserCheck, UserX, Mail, Phone } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

interface AdminUsersTabProps {
  onStatsUpdate: () => void;
}

const AdminUsersTab = ({ onStatsUpdate }: AdminUsersTabProps) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('user_id, role')
      ]);

      if (profilesRes.error) throw profilesRes.error;
      setUsers(profilesRes.data || []);

      // Build roles map
      const rolesMap: Record<string, string[]> = {};
      (rolesRes.data || []).forEach((role: UserRole) => {
        if (!rolesMap[role.user_id]) rolesMap[role.user_id] = [];
        rolesMap[role.user_id].push(role.role);
      });
      setUserRoles(rolesMap);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון את רשימת המשתמשים',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminStatus = async (userId: string, isAdmin: boolean) => {
    try {
      if (isAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        
        if (error) throw error;
      } else {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });
        
        if (error) throw error;
      }

      // Refresh data
      await fetchUsers();

      toast({
        title: 'עודכן בהצלחה',
        description: `סטטוס מנהל ${!isAdmin ? 'הוענק' : 'בוטל'} למשתמש`,
      });
      
      onStatsUpdate();
    } catch (error) {
      console.error('Error updating admin status:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לעדכן את סטטוס המנהל',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return (
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm) ||
      user.user_id.includes(searchTerm)
    );
  });

  const getUserInitials = (user: Profile) => {
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

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
          <UserCheck className="h-5 w-5" />
          ניהול משתמשים
        </CardTitle>
        <CardDescription>
          ניהול והרשאות משתמשים במערכת
        </CardDescription>
        <div className="flex items-center gap-4 pt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש משתמש..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <Badge variant="secondary">
            {filteredUsers.length} משתמשים
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card/50"
            >
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h4 className="font-semibold">
                    {user.first_name && user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : 'משתמש ללא שם'}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {user.user_id}
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {user.phone}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    נרשם: {new Date(user.created_at).toLocaleDateString('he-IL')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {userRoles[user.user_id]?.includes('admin') && (
                  <Badge variant="default">מנהל</Badge>
                )}
                <Button
                  variant={userRoles[user.user_id]?.includes('admin') ? "destructive" : "default"}
                  size="sm"
                  onClick={() => toggleAdminStatus(user.user_id, userRoles[user.user_id]?.includes('admin'))}
                >
                  {userRoles[user.user_id]?.includes('admin') ? (
                    <>
                      <UserX className="h-4 w-4 ml-1" />
                      בטל מנהל
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 ml-1" />
                      הפוך למנהל
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              לא נמצאו משתמשים המתאימים לחיפוש
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminUsersTab;