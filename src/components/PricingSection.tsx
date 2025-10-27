import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, Zap, Shield, Check, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/components/CartContext';
import { useToast } from '@/hooks/use-toast';

import type { Json } from '@/integrations/supabase/types';
import { formatFeatures } from '@/lib/utils/formatFeatures';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  features: Json;
  is_active: boolean;
}

const getIcon = (planName: string) => {
  switch (planName.toLowerCase()) {
    case 'king':
    case 'קינג':
      return Crown;
    case 'premium':
    case 'פרימיום':
      return Star;
    case 'crystal':
    case 'קריסטל':
      return Zap;
    case 'israeli':
    case 'ישראלי':
      return Shield;
    default:
      return Crown;
  }
};

const getGradient = (planName: string) => {
  switch (planName.toLowerCase()) {
    case 'king':
    case 'קינג':
      return 'from-yellow-400 to-orange-500';
    case 'premium':
    case 'פרימיום':
      return 'from-purple-500 to-pink-500';
    case 'crystal':
    case 'קריסטל':
      return 'from-blue-400 to-cyan-500';
    case 'israeli':
    case 'ישראלי':
      return 'from-green-400 to-blue-500';
    default:
      return 'from-primary to-primary/80';
  }
};

interface PricingSectionProps {
  plans: SubscriptionPlan[];
}

const PricingSection = ({ plans }: PricingSectionProps) => {
  const { user } = useAuth();
  const { addToCart, removeFromCart, isInCart } = useCart();
  const { toast } = useToast();

  // Filter active plans and sort by price
  const activePlans = plans
    .filter(plan => plan.is_active)
    .sort((a, b) => a.price - b.price);

  // Group plans by name and get the latest version (highest price)
  const uniquePlans = activePlans.reduce((acc, plan) => {
    const existing = acc.find(p => p.name === plan.name);
    if (!existing || plan.price > existing.price) {
      return [...acc.filter(p => p.name !== plan.name), plan];
    }
    return acc;
  }, [] as SubscriptionPlan[]);

  const handleAddToCart = (plan: SubscriptionPlan) => {
    if (isInCart(plan.id)) {
      removeFromCart(plan.id);
      toast({
        title: "הוסר מהעגלה",
        description: `חבילת ${plan.name} הוסרה מהעגלה`,
      });
    } else {
      addToCart(plan);
      toast({
        title: "נוסף לעגלה",
        description: `חבילת ${plan.name} נוספה לעגלה`,
      });
    }
  };

  const handleQuickPurchase = async (plan: SubscriptionPlan) => {
    if (!user) {
      window.location.href = '/auth?redirect=checkout&plan=' + plan.id;
      return;
    }
    
    // Add to cart and proceed to checkout immediately
    addToCart(plan);
    // The checkout will be handled by the CartDrawer component
  };

  return (
    <section id="pricing" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">
            חבילות המנויים שלנו
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            בחר את החבילה המתאימה לך ותתחיל ליהנות מחוויית הצפייה הטובה ביותר
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {uniquePlans.map((plan) => {
            const Icon = getIcon(plan.name);
            const features = formatFeatures(plan.features);
            const isPopular = plan.name === 'King' || plan.name === 'Premium';

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                  isPopular ? 'ring-2 ring-primary glass animate-glow' : 'hover:ring-1 hover:ring-primary/50'
                }`}
              >
                {isPopular && (
                  <Badge className="absolute top-4 right-4 bg-gradient-primary">
                    פופולרי
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className={`mx-auto mb-4 p-3 rounded-full bg-gradient-to-r ${getGradient(plan.name)} w-16 h-16 flex items-center justify-center animate-float`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mt-2">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-primary">₪{plan.price}</span>
                    <span className="text-muted-foreground">/חודש</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 mt-6">
                    <Button
                      className={`w-full ${
                        isPopular 
                          ? 'bg-gradient-primary hover:opacity-90' 
                          : ''
                      }`}
                      size="lg"
                      onClick={() => handleQuickPurchase(plan)}
                    >
                      {user ? 'רכישה מהירה' : 'התחבר ורכוש'}
                    </Button>
                    
                    <Button
                      variant={isInCart(plan.id) ? "destructive" : "outline"}
                      size="lg"
                      className="w-full"
                      onClick={() => handleAddToCart(plan)}
                    >
                      <ShoppingCart className="h-4 w-4 ml-2" />
                      {isInCart(plan.id) ? 'הסר מהעגלה' : 'הוסף לעגלה'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            כל החבילות כוללות תמיכה 24/7 וללא התחייבות לתקופה
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;