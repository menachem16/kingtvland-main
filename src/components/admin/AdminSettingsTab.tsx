import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { googleSheets } from '@/integrations/google-sheets/client';
import { Settings, RefreshCw, Save, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AdminSettingsTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [googleSheetId, setGoogleSheetId] = useState('');
  const [googleSheetsWebAppUrl, setGoogleSheetsWebAppUrl] = useState('');
  const [lastSync, setLastSync] = useState<string | null>(null);

  const handleSaveSettings = () => {
    // In production, these would be saved as secrets via Supabase
    localStorage.setItem('GOOGLE_API_KEY', googleApiKey);
    localStorage.setItem('GOOGLE_SHEET_ID', googleSheetId);
    localStorage.setItem('GOOGLE_SHEETS_WEBAPP_URL', googleSheetsWebAppUrl);
    
    toast({
      title: 'הצלחה',
      description: 'ההגדרות נשמרו בהצלחה'
    });
  };

  const handleSyncToSheets = async () => {
    // Sync functionality removed - Google Sheets is now the primary database
    toast({
      title: 'מידע',
      description: 'הנתונים כבר מאוחסנים ב-Google Sheets. אין צורך בסנכרון נוסף.'
    });
  };

  useEffect(() => {
    // Load saved settings
    const savedApiKey = localStorage.getItem('GOOGLE_API_KEY');
    const savedSheetId = localStorage.getItem('GOOGLE_SHEET_ID');
    const savedWebAppUrl = localStorage.getItem('GOOGLE_SHEETS_WEBAPP_URL');
    
    if (savedApiKey) setGoogleApiKey(savedApiKey);
    if (savedSheetId) setGoogleSheetId(savedSheetId);
    if (savedWebAppUrl) setGoogleSheetsWebAppUrl(savedWebAppUrl);
  }, []);

  return (
    <div className="space-y-6">
      {/* Google Sheets Integration */}
      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            חיבור ל-Google Sheets
          </CardTitle>
          <CardDescription>
            סנכרן את נתוני הלקוחות שלך אוטומטית עם Google Sheets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              <strong>הוראות הגדרה:</strong>
              <ol className="list-decimal mr-6 mt-2 space-y-1">
                <li>צור Google Sheet חדש או השתמש בקיים</li>
                <li>העתק את ה-Sheet ID מה-URL (החלק בין /d/ ל-/edit)</li>
                <li>
                  צור API Key ב-
                  <a 
                    href="https://console.cloud.google.com/apis/credentials" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1 mr-1"
                  >
                    Google Cloud Console
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>הפעל את Google Sheets API בפרויקט שלך</li>
              </ol>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Label htmlFor="googleApiKey">Google API Key</Label>
              <Input
                id="googleApiKey"
                type="password"
                placeholder="AIzaSy..."
                value={googleApiKey}
                onChange={(e) => setGoogleApiKey(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="googleSheetId">Google Sheet ID</Label>
              <Input
                id="googleSheetId"
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                value={googleSheetId}
                onChange={(e) => setGoogleSheetId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                ניתן למצוא ב-URL של ה-Sheet: docs.google.com/spreadsheets/d/<strong>SHEET_ID</strong>/edit
              </p>
            </div>

            <div>
              <Label htmlFor="googleSheetsWebAppUrl">Google Apps Script Web App URL</Label>
              <Input
                id="googleSheetsWebAppUrl"
                placeholder="https://script.google.com/macros/s/..."
                value={googleSheetsWebAppUrl}
                onChange={(e) => setGoogleSheetsWebAppUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                ה-URL שקיבלת אחרי deployment של ה-Apps Script כ-Web App
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveSettings} className="flex-1">
                <Save className="h-4 w-4 ml-2" />
                שמור הגדרות
              </Button>
              <Button 
                onClick={handleSyncToSheets} 
                disabled={syncing || !googleApiKey || !googleSheetId}
                variant="secondary"
                className="flex-1"
              >
                <RefreshCw className={`h-4 w-4 ml-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'מסנכרן...' : 'סנכרן עכשיו'}
              </Button>
            </div>

            {lastSync && (
              <p className="text-sm text-muted-foreground text-center">
                סנכרון אחרון: {lastSync}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Netlify Settings (Placeholder) */}
      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            הגדרות Netlify
          </CardTitle>
          <CardDescription>
            ניהול deployment ואחסון באמצעות Netlify
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              האפליקציה שלך מתארחת ב-Netlify. ניתן לנהל את ה-deployment דרך 
              <a 
                href="https://app.netlify.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1 mr-1 ml-1"
              >
                לוח הבקרה של Netlify
                <ExternalLink className="h-3 w-3" />
              </a>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettingsTab;


