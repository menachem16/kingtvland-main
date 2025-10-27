import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Save, X, Percent, Trash2, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { adminCouponSchema, type AdminCouponInput } from '@/lib/validations';

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

const AdminCouponsTab = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const emptyCoupon: Omit<Coupon, 'id' | 'created_at' | 'used_count'> = {
    code: '',
    discount_type: 'percentage',
    discount_value: 0,
    max_uses: null,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: null,
    is_active: true,
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון את רשימת הקופונים',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveCoupon = async (couponData: Omit<Coupon, 'id' | 'created_at' | 'used_count'>) => {
    try {
      let result;
      if (editingCoupon) {
        result = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('coupons')
          .insert([{ ...couponData, used_count: 0 }])
          .select()
          .single();
      }

      if (result.error) throw result.error;

      await fetchCoupons();
      setEditingCoupon(null);
      setIsCreating(false);

      toast({
        title: 'נשמר בהצלחה',
        description: editingCoupon ? 'הקופון עודכן' : 'הקופון נוצר',
      });
    } catch (error) {
      console.error('Error saving coupon:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשמור את הקופון',
        variant: 'destructive',
      });
    }
  };

  const deleteCoupon = async (couponId: string) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', couponId);

      if (error) throw error;

      setCoupons(coupons.filter(coupon => coupon.id !== couponId));

      toast({
        title: 'נמחק בהצלחה',
        description: 'הקופון נמחק מהמערכת',
      });
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן למחוק את הקופון',
        variant: 'destructive',
      });
    }
  };

  const getDiscountDisplay = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}%`;
    }
    return `₪${coupon.discount_value}`;
  };

  const isExpired = (coupon: Coupon) => {
    if (!coupon.valid_until) return false;
    return new Date(coupon.valid_until) < new Date();
  };

  const isMaxUsesReached = (coupon: Coupon) => {
    if (!coupon.max_uses) return false;
    return coupon.used_count >= coupon.max_uses;
  };

  const CouponForm = ({ coupon, onSave, onCancel }: {
    coupon: Omit<Coupon, 'id' | 'created_at' | 'used_count'>;
    onSave: (data: Omit<Coupon, 'id' | 'created_at' | 'used_count'>) => void;
    onCancel: () => void;
  }) => {
    const form = useForm<AdminCouponInput>({
      resolver: zodResolver(adminCouponSchema),
      defaultValues: {
        code: coupon.code,
        discount_type: coupon.discount_type as 'percentage' | 'fixed',
        discount_value: coupon.discount_value,
        max_uses: coupon.max_uses,
        valid_from: new Date(coupon.valid_from),
        valid_until: coupon.valid_until ? new Date(coupon.valid_until) : null,
      },
    });

    const handleSubmit = (data: AdminCouponInput) => {
      onSave({
        code: data.code,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        max_uses: data.max_uses,
        valid_from: data.valid_from.toISOString(),
        valid_until: data.valid_until ? data.valid_until.toISOString() : null,
        is_active: coupon.is_active,
      });
    };

    return (
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="code">קוד הקופון</Label>
            <Input
              id="code"
              {...form.register('code')}
              placeholder="SUMMER20"
            />
            {form.formState.errors.code && (
              <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="discount_type">סוג הנחה</Label>
            <Select
              value={form.watch('discount_type')}
              onValueChange={(value) => form.setValue('discount_type', value as 'percentage' | 'fixed')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">אחוזים</SelectItem>
                <SelectItem value="fixed">סכום קבוע</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.discount_type && (
              <p className="text-sm text-destructive">{form.formState.errors.discount_type.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="discount_value">
              ערך ההנחה {form.watch('discount_type') === 'percentage' ? '(%)' : '(₪)'}
            </Label>
            <Input
              id="discount_value"
              type="number"
              step="0.01"
              {...form.register('discount_value', { valueAsNumber: true })}
            />
            {form.formState.errors.discount_value && (
              <p className="text-sm text-destructive">{form.formState.errors.discount_value.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="max_uses">מגבלת שימושים (אופציונלי)</Label>
            <Input
              id="max_uses"
              type="number"
              {...form.register('max_uses', { 
                valueAsNumber: true,
                setValueAs: (v) => v === '' ? null : Number(v)
              })}
            />
            {form.formState.errors.max_uses && (
              <p className="text-sm text-destructive">{form.formState.errors.max_uses.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="valid_from">תחילת תוקף</Label>
            <Input
              id="valid_from"
              type="date"
              {...form.register('valid_from', {
                setValueAs: (v) => new Date(v)
              })}
            />
            {form.formState.errors.valid_from && (
              <p className="text-sm text-destructive">{form.formState.errors.valid_from.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="valid_until">סוף תוקף (אופציונלי)</Label>
            <Input
              id="valid_until"
              type="date"
              {...form.register('valid_until', {
                setValueAs: (v) => v ? new Date(v) : null
              })}
            />
            {form.formState.errors.valid_until && (
              <p className="text-sm text-destructive">{form.formState.errors.valid_until.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          <Switch
            id="is_active"
            checked={coupon.is_active}
            onCheckedChange={(checked) => onSave({ ...coupon, is_active: checked })}
          />
          <Label htmlFor="is_active">קופון פעיל</Label>
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit">
            <Save className="h-4 w-4 ml-1" />
            שמור
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 ml-1" />
            ביטול
          </Button>
        </div>
      </form>
    );
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              ניהול קופונים
            </CardTitle>
            <CardDescription>
              יצירה ועריכה של קופוני הנחה
            </CardDescription>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-1" />
                קופון חדש
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>יצירת קופון חדש</DialogTitle>
                <DialogDescription>
                  הוסף קופון הנחה חדש למערכת
                </DialogDescription>
              </DialogHeader>
              <CouponForm
                coupon={emptyCoupon}
                onSave={saveCoupon}
                onCancel={() => setIsCreating(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="border rounded-lg p-4 bg-card/50"
            >
              {editingCoupon?.id === coupon.id ? (
                <CouponForm
                  coupon={editingCoupon}
                  onSave={saveCoupon}
                  onCancel={() => setEditingCoupon(null)}
                />
              ) : (
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-lg font-mono">{coupon.code}</h4>
                      <Badge variant="outline" className="font-bold text-primary">
                        {getDiscountDisplay(coupon)}
                      </Badge>
                      {!coupon.is_active && (
                        <Badge variant="secondary">לא פעיל</Badge>
                      )}
                      {isExpired(coupon) && (
                        <Badge variant="destructive">פג תוקף</Badge>
                      )}
                      {isMaxUsesReached(coupon) && (
                        <Badge variant="outline">מוצה</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">שימושים:</span>
                        <div className="font-medium">
                          {coupon.used_count}
                          {coupon.max_uses && ` / ${coupon.max_uses}`}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-muted-foreground">תוקף מ:</span>
                        <div className="font-medium">
                          {new Date(coupon.valid_from).toLocaleDateString('he-IL')}
                        </div>
                      </div>
                      
                      {coupon.valid_until && (
                        <div>
                          <span className="text-muted-foreground">תוקף עד:</span>
                          <div className="font-medium">
                            {new Date(coupon.valid_until).toLocaleDateString('he-IL')}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <span className="text-muted-foreground">נוצר:</span>
                        <div className="font-medium">
                          {new Date(coupon.created_at).toLocaleDateString('he-IL')}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCoupon(coupon)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteCoupon(coupon.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {coupons.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              אין קופונים במערכת
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminCouponsTab;