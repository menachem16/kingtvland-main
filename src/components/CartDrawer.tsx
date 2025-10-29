import { useState } from 'react';
import { useCart } from '@/components/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Trash2, CreditCard, Check, Percent, X } from 'lucide-react';
import { googleSheets } from '@/integrations/google-sheets/client';
import { useToast } from '@/hooks/use-toast';
import { couponCodeSchema } from '@/lib/validations';
import { formatFeatures } from '@/lib/utils/formatFeatures';

export const CartDrawer = () => {
  const { cartItems, removeFromCart, clearCart, getCartTotal, getCartCount } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount: number} | null>(null);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;

    // Validate coupon code format
    const validation = couponCodeSchema.safeParse({ code: couponCode });
    if (!validation.success) {
      toast({
        title: 'קוד קופון לא תקין',
        description: validation.error.issues[0].message,
        variant: 'destructive',
      });
      return;
    }

    try {
      // Not implemented with Google Sheets; simulate not found
      const coupon: any = null;
      if (!coupon) {
        toast({
          title: 'קוד קופון לא תקין',
          description: 'הקופון לא קיים או אינו פעיל',
          variant: 'destructive',
        });
        return;
      }

      const now = new Date();
      const validFrom = new Date(coupon.valid_from);
      const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

      if (now < validFrom || (validUntil && now > validUntil)) {
        toast({
          title: 'הקופון אינו תקף',
          description: 'הקופון פג תוקף או עדיין לא תקף',
          variant: 'destructive',
        });
        return;
      }

      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        toast({
          title: 'הקופון מוצה',
          description: 'הקופון הגיע למספר השימושים המקסימלי',
          variant: 'destructive',
        });
        return;
      }

      const total = getCartTotal();
      let discount = 0;
      if (coupon.discount_type === 'percentage') {
        discount = (total * coupon.discount_value) / 100;
      } else {
        discount = coupon.discount_value;
      }

      setAppliedCoupon({
        code: coupon.code,
        discount: Math.min(discount, total),
      });

      toast({
        title: 'קופון הופעל!',
        description: `הנחה של ₪${Math.min(discount, total).toFixed(2)} הופעלה`,
      });
    } catch (error) {
      console.error('Coupon error:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להפעיל את הקופון',
        variant: 'destructive',
      });
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const getFinalTotal = () => {
    const total = getCartTotal();
    return appliedCoupon ? Math.max(0, total - appliedCoupon.discount) : total;
  };

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: "נדרש התחברות",
        description: "עליך להתחבר כדי לבצע רכישה",
        variant: "destructive",
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "העגלה ריקה",
        description: "הוסף מוצרים לעגלה כדי לבצע רכישה",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Not implemented with Google Sheets; show demo message
      toast({
        title: "מצב הדגמה",
        description: "תהליך תשלום אינו מחובר ל-Stripe בגרסה זו",
      });
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "שגיאה בתשלום",
        description: "אירעה שגיאה בעת ביצוע התשלום. נסה שוב.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="lg" className="relative glass">
          <ShoppingCart className="h-5 w-5 ml-2" />
          עגלת קניות
          {getCartCount() > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-gradient-primary">
              {getCartCount()}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-full sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-2xl">
            <ShoppingCart className="h-6 w-6" />
            עגלת קניות
          </SheetTitle>
          <SheetDescription>
            סקור את המנויים שבחרת ובצע רכישה
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">העגלה שלך ריקה</p>
              <p className="text-sm text-muted-foreground mt-2">
                הוסף מנויים כדי להתחיל
              </p>
            </div>
          ) : (
            <>
              {cartItems.map((item) => {
                const features = formatFeatures(item.plan.features);
                return (
                  <Card key={item.plan.id} className="glass border-0">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{item.plan.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {item.plan.description}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.plan.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-primary">
                            ₪{item.plan.price}
                          </span>
                          <span className="text-muted-foreground">/חודש</span>
                        </div>
                        
                        <div className="space-y-2">
                          {features.slice(0, 3).map((feature, index) => (
                            <div key={index} className="flex items-center text-sm">
                              <Check className="h-3 w-3 text-primary ml-2 flex-shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                          {features.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              ועוד {features.length - 3} תכונות נוספות...
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              <Separator className="my-6" />

              {/* Coupon Section */}
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <Label className="text-sm font-medium">יש לך קופון?</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="הזן קוד קופון"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={!!appliedCoupon}
                    className="flex-1"
                  />
                  {appliedCoupon ? (
                    <Button 
                      variant="outline" 
                      onClick={removeCoupon}
                      className="px-4"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={applyCoupon}
                      disabled={!couponCode.trim()}
                      className="px-4"
                    >
                      הפעל
                    </Button>
                  )}
                </div>
                {appliedCoupon && (
                  <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <Percent className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">
                      קופון {appliedCoupon.code} הופעל - הנחה של ₪{appliedCoupon.discount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Cart Summary */}
              <div className="space-y-4">
                {appliedCoupon && (
                  <>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>סכום ראשוני:</span>
                      <span>₪{getCartTotal()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-green-600">
                      <span>הנחה:</span>
                      <span>-₪{appliedCoupon.discount.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>סה"כ לתשלום:</span>
                  <span className="text-primary">₪{getFinalTotal().toFixed(2)}</span>
                </div>
                
                <div className="space-y-3">
                  <Button
                    onClick={handleCheckout}
                    disabled={isProcessing || cartItems.length === 0}
                    className="w-full bg-gradient-primary hover:opacity-90"
                    size="lg"
                  >
                    <CreditCard className="h-5 w-5 ml-2" />
                    {isProcessing ? 'מעבד...' : 'בצע תשלום'}
                  </Button>
                  
                  {cartItems.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={clearCart}
                      className="w-full"
                    >
                      נקה עגלה
                    </Button>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground text-center">
                  התשלום מאובטח באמצעות Stripe
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};