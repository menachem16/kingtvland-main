import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  MessageSquare,
  CreditCard,
  Shield,
  Smartphone,
  Headphones,
  Globe,
  Zap,
  Crown,
  LucideIcon,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { googleSheets } from '@/integrations/google-sheets/client';
import { Skeleton } from '@/components/ui/skeleton';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  gradient: string;
}

const iconMap: Record<string, LucideIcon> = {
  Crown,
  Users,
  MessageSquare,
  CreditCard,
  Shield,
  Smartphone,
  Headphones,
  Globe,
  Zap,
};

const FeaturesSection = () => {
  const { data: features, isLoading } = useQuery({
    queryKey: ['features'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('features')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as Feature[];
    },
  });
  return (
    <section className="py-20 px-4 bg-muted/20">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            למה לבחור בנו?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            אנחנו מציעים חוויית סטרימינג מושלמת עם כל הכלים שאתה צריך לניהול העסק שלך
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {isLoading ? (
            Array.from({ length: 9 }).map((_, idx) => (
              <Card key={idx} className="glass border-0">
                <CardHeader className="text-center pb-4">
                  <Skeleton className="mx-auto mb-4 h-16 w-16 rounded-full" />
                  <Skeleton className="h-6 w-32 mx-auto" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))
          ) : (
            features?.map((feature) => {
              const IconComponent = iconMap[feature.icon] || Shield;
              return (
              <Card
                key={feature.id}
                className="group hover:scale-105 transition-all duration-300 hover:shadow-xl glass border-0"
              >
                <CardHeader className="text-center pb-4">
                  <div className={`mx-auto mb-4 p-4 rounded-full bg-gradient-to-r ${feature.gradient} w-16 h-16 flex items-center justify-center group-hover:animate-float`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-muted-foreground leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
              );
            })
          )}
        </div>

        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-4 bg-card border rounded-xl p-6 glass">
            <Shield className="h-8 w-8 text-primary" />
            <div className="text-right">
              <h3 className="font-semibold text-lg">אחריות מלאה</h3>
              <p className="text-sm text-muted-foreground">
                החזר כספי מלא תוך 30 יום אם לא תהיה מרוצה
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;