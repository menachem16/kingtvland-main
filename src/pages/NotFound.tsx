import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center glass border-0">
        <CardHeader>
          <div className="mx-auto w-24 h-24 rounded-full bg-gradient-primary/20 flex items-center justify-center mb-4">
            <span className="text-4xl font-bold text-gradient">404</span>
          </div>
          <CardTitle className="text-2xl font-bold mb-2">העמוד לא נמצא</CardTitle>
          <p className="text-muted-foreground">
            מצטערים, העמוד שחיפשת לא קיים או הועבר למקום אחר
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => navigate('/')} 
            className="w-full"
          >
            <Home className="ml-2 h-4 w-4" />
            חזור לעמוד הבית
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="w-full"
          >
            <ArrowRight className="ml-2 h-4 w-4" />
            חזור לעמוד הקודם
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;