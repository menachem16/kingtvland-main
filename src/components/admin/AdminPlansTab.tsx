import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Save, X, Package, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Json } from '@/integrations/supabase/types';
import { planSchema, type PlanInput } from '@/lib/validations';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_months: number;
  features: Json;
  is_active: boolean;
  created_at: string;
}

interface AdminPlansTabProps {
  onStatsUpdate: () => void;
}

const AdminPlansTab = ({ onStatsUpdate }: AdminPlansTabProps) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const emptyPlan: Omit<SubscriptionPlan, 'id' | 'created_at'> = {
    name: '',
    description: '',
    price: 0,
    duration_months: 1,
    features: [],
    is_active: true,
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון את רשימת התוכניות',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async (planData: Omit<SubscriptionPlan, 'id' | 'created_at'>) => {
    try {
      let result;
      if (editingPlan) {
        result = await supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', editingPlan.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('subscription_plans')
          .insert([planData])
          .select()
          .single();
      }

      if (result.error) throw result.error;

      await fetchPlans();
      setEditingPlan(null);
      setIsCreating(false);
      onStatsUpdate();

      toast({
        title: 'נשמר בהצלחה',
        description: editingPlan ? 'התוכנית עודכנה' : 'התוכנית נוצרה',
      });
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשמור את התוכנית',
        variant: 'destructive',
      });
    }
  };

  const deletePlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      setPlans(plans.filter(plan => plan.id !== planId));
      onStatsUpdate();

      toast({
        title: 'נמחק בהצלחה',
        description: 'התוכנית נמחקה מהמערכת',
      });
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן למחוק את התוכנית',
        variant: 'destructive',
      });
    }
  };

  const PlanForm = ({ plan, onSave, onCancel }: {
    plan: Omit<SubscriptionPlan, 'id' | 'created_at'>;
    onSave: (data: Omit<SubscriptionPlan, 'id' | 'created_at'>) => void;
    onCancel: () => void;
  }) => {
    const [featuresText, setFeaturesText] = useState(
      Array.isArray(plan.features) ? plan.features.join('\n') : ''
    );

    const form = useForm<PlanInput>({
      resolver: zodResolver(planSchema),
      defaultValues: {
        name: plan.name,
        description: plan.description || '',
        price: plan.price,
        duration_months: plan.duration_months,
        features: Array.isArray(plan.features) ? plan.features.map(String) : [],
      },
    });

    const handleSubmit = (data: PlanInput) => {
      const features = featuresText.split('\n').filter(f => f.trim());
      onSave({ 
        ...plan,
        name: data.name,
        description: data.description,
        price: data.price,
        duration_months: data.duration_months,
        features 
      });
    };

    return (
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="name">שם התוכנית</Label>
          <Input
            id="name"
            {...form.register('name')}
          />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="description">תיאור</Label>
          <Textarea
            id="description"
            {...form.register('description')}
          />
          {form.formState.errors.description && (
            <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">מחיר (₪)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              {...form.register('price', { valueAsNumber: true })}
            />
            {form.formState.errors.price && (
              <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="duration_months">משך (חודשים)</Label>
            <Input
              id="duration_months"
              type="number"
              {...form.register('duration_months', { valueAsNumber: true })}
            />
            {form.formState.errors.duration_months && (
              <p className="text-sm text-destructive">{form.formState.errors.duration_months.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="features">תכונות (תכונה בכל שורה)</Label>
          <Textarea
            id="features"
            value={featuresText}
            onChange={(e) => setFeaturesText(e.target.value)}
            placeholder="תכונה 1&#10;תכונה 2&#10;תכונה 3"
            rows={5}
          />
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          <Switch
            id="is_active"
            checked={plan.is_active}
            onCheckedChange={(checked) => onSave({ ...plan, is_active: checked })}
          />
          <Label htmlFor="is_active">תוכנית פעילה</Label>
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
              <Package className="h-5 w-5" />
              ניהול תוכניות מנוי
            </CardTitle>
            <CardDescription>
              יצירה ועריכה של תוכניות המנוי במערכת
            </CardDescription>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-1" />
                תוכנית חדשה
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>יצירת תוכנית מנוי חדשה</DialogTitle>
                <DialogDescription>
                  הוסף תוכנית מנוי חדשה למערכת
                </DialogDescription>
              </DialogHeader>
              <PlanForm
                plan={emptyPlan}
                onSave={savePlan}
                onCancel={() => setIsCreating(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="border rounded-lg p-4 bg-card/50"
            >
              {editingPlan?.id === plan.id ? (
                <PlanForm
                  plan={editingPlan}
                  onSave={savePlan}
                  onCancel={() => setEditingPlan(null)}
                />
              ) : (
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-lg">{plan.name}</h4>
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? "פעיל" : "לא פעיל"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{plan.description}</p>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-primary">
                        ₪{plan.price.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {plan.duration_months} חודשים
                      </span>
                    </div>
                    {Array.isArray(plan.features) && plan.features.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-1">תכונות:</h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {plan.features.map((feature, index) => (
                            <li key={index}>• {String(feature)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingPlan(plan)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deletePlan(plan.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {plans.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              אין תוכניות מנוי במערכת
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminPlansTab;