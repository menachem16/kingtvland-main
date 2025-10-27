import { useQueryClient } from '@tanstack/react-query';
import { useCart } from '@/components/CartContext';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  features: any;
  is_active: boolean;
}

/**
 * Hook for optimistic cart updates
 * Provides instant UI feedback while operations complete in background
 */
export const useOptimisticCart = () => {
  const { addToCart, removeFromCart } = useCart();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const optimisticAdd = async (plan: SubscriptionPlan) => {
    // Add to cart immediately (optimistic)
    addToCart(plan);
    
    toast({
      title: "נוסף לעגלה",
      description: `חבילת ${plan.name} נוספה לעגלה`,
    });

    // Invalidate queries that might be affected
    await queryClient.invalidateQueries({ queryKey: ['cart'] });
  };

  const optimisticRemove = async (planId: string) => {
    // Remove from cart immediately (optimistic)
    removeFromCart(planId);
    
    toast({
      title: "הוסר מהעגלה",
      description: "המוצר הוסר מהעגלה",
    });

    // Invalidate queries that might be affected
    await queryClient.invalidateQueries({ queryKey: ['cart'] });
  };

  return {
    optimisticAdd,
    optimisticRemove,
  };
};
