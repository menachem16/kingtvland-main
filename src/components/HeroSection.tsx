import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Crown, Play, Users, Zap, LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HeroStats {
  customers: string;
  channels: string;
  quality: string;
  support: string;
}

const iconMap: Record<string, LucideIcon> = {
  Users,
  Play,
  Zap,
};

const HeroSection = () => {
  const { user, profile } = useAuth();

  const { data: heroStats } = useQuery({
    queryKey: ['hero-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'hero_stats')
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return {
        customers: '10,000+',
        channels: '500+',
        quality: '4K',
        support: '24/7'
      };
      
      const value = data.value as { customers: string; channels: string; quality: string; support: string };
      return value;
    },
  });

  const stats = [
    { icon: Users, label: 'לקוחות מרוצים', value: heroStats?.customers || '10,000+' },
    { icon: Play, label: 'ערוצים', value: heroStats?.channels || '500+' },
    { icon: Zap, label: 'איכות', value: heroStats?.quality || '4K' },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-secondary"></div>
      
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-gradient-primary rounded-full animate-glow">
              <Crown className="h-16 w-16 text-white" />
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-gradient">פלטפורמת הצמיחה</span>
            <br />
            <span className="text-foreground">שלך</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            מערכת ניהול מוצרים ולקוחות מתקדמת עם כלים חכמים לצמיחת העסק שלך.
            <br />
            <span className="text-primary font-semibold">איכות פרימיום • תמיכה 24/7 • מחירים שווים</span>
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {user ? (
              <>
                <Button asChild size="lg" className="bg-gradient-primary hover:opacity-90 text-lg px-8 py-4">
                  <Link to="/dashboard">לוח המשתמש שלי</Link>
                </Button>
                {profile?.is_admin && (
                  <Button asChild variant="outline" size="lg" className="text-lg px-8 py-4 glass">
                    <Link to="/admin">ניהול מערכת</Link>
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button asChild size="lg" className="bg-gradient-primary hover:opacity-90 text-lg px-8 py-4">
                  <Link to="/auth">התחל עכשיו בחינם</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg px-8 py-4 glass">
                  <Link to="#pricing">צפה במחירים</Link>
                </Button>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-2">
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;