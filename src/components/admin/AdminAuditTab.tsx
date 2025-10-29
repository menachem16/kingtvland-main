import { useState, useEffect } from 'react';
import { googleSheets } from '@/integrations/google-sheets/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Clock, User, FileText } from 'lucide-react';
import { SkeletonTable } from '@/components/ui/skeleton-card';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
  } | null;
}

const AdminAuditTab = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const rows = await googleSheets.getAuditLogs();
      setLogs(rows as any);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create')) {
      return <Badge className="bg-green-500/20 text-green-600">יצירה</Badge>;
    }
    if (actionLower.includes('update') || actionLower.includes('edit')) {
      return <Badge className="bg-blue-500/20 text-blue-600">עדכון</Badge>;
    }
    if (actionLower.includes('delete')) {
      return <Badge className="bg-red-500/20 text-red-600">מחיקה</Badge>;
    }
    return <Badge variant="outline">{action}</Badge>;
  };

  if (loading) {
    return (
      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            רשומות ביקורת (Audit Logs)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SkeletonTable rows={10} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          רשומות ביקורת (Audit Logs)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          מעקב אחר כל הפעולות שמבוצעות על ידי מנהלים
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                אין רשומות ביקורת
              </div>
            ) : (
              logs.map((log) => (
                <Card key={log.id} className="border-0 bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {log.profiles?.first_name} {log.profiles?.last_name}
                        </span>
                        {getActionBadge(log.action)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(log.created_at).toLocaleString('he-IL')}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">סוג:</span>
                        <span className="font-medium">{log.resource_type}</span>
                        {log.resource_id && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-xs font-mono text-muted-foreground">
                              {log.resource_id.substring(0, 8)}...
                            </span>
                          </>
                        )}
                      </div>

                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                          <pre className="overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}

                      {log.ip_address && (
                        <div className="text-xs text-muted-foreground">
                          IP: {log.ip_address}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AdminAuditTab;


