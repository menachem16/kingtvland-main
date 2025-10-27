import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CheckoutRequest {
  planId: string
  couponCode?: string
}

// Input validation
function validateCheckoutRequest(data: any): CheckoutRequest {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid request body')
  }
  
  if (!data.planId || typeof data.planId !== 'string' || data.planId.trim() === '') {
    throw new Error('Plan ID is required')
  }
  
  if (data.couponCode && typeof data.couponCode !== 'string') {
    throw new Error('Invalid coupon code format')
  }
  
  return {
    planId: data.planId.trim(),
    couponCode: data.couponCode?.trim().toUpperCase()
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('[create-checkout-session] Starting request')

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('[create-checkout-session] Missing authorization header')
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      console.error('[create-checkout-session] Unauthorized:', userError)
      throw new Error('Unauthorized')
    }

    console.log('[create-checkout-session] User authenticated:', user.id)

    // Parse and validate request body
    const requestData = await req.json()
    const { planId, couponCode } = validateCheckoutRequest(requestData)

    console.log('[create-checkout-session] Request data:', { planId, couponCode: couponCode ? 'present' : 'none' })

    // Fetch plan details
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .maybeSingle()

    if (planError) {
      console.error('[create-checkout-session] Plan fetch error:', planError)
      throw new Error('Failed to fetch plan')
    }

    if (!plan) {
      console.error('[create-checkout-session] Plan not found or inactive')
      throw new Error('Plan not found or inactive')
    }

    console.log('[create-checkout-session] Plan found:', plan.name, plan.price)

    let discountAmount = 0
    let finalAmount = plan.price

    // Validate coupon if provided
    if (couponCode) {
      console.log('[create-checkout-session] Validating coupon:', couponCode)
      
      const { data: coupon, error: couponError } = await supabaseClient
        .from('coupons')
        .select('*')
        .eq('code', couponCode)
        .eq('is_active', true)
        .maybeSingle()

      if (couponError) {
        console.error('[create-checkout-session] Coupon fetch error:', couponError)
      }

      if (coupon) {
        const now = new Date()
        const validFrom = new Date(coupon.valid_from)
        const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null

        const isDateValid = now >= validFrom && (!validUntil || now <= validUntil)
        const isUsageValid = !coupon.max_uses || coupon.used_count < coupon.max_uses

        if (isDateValid && isUsageValid) {
          // Calculate discount
          if (coupon.discount_type === 'percentage') {
            if (coupon.discount_value > 100 || coupon.discount_value < 0) {
              throw new Error('Invalid discount percentage')
            }
            discountAmount = (plan.price * coupon.discount_value) / 100
          } else {
            discountAmount = coupon.discount_value
          }
          finalAmount = Math.max(0, plan.price - discountAmount)

          console.log('[create-checkout-session] Coupon applied:', {
            discount: discountAmount,
            finalAmount
          })

          // Update coupon usage count
          await supabaseClient
            .from('coupons')
            .update({ used_count: coupon.used_count + 1 })
            .eq('id', coupon.id)
        } else {
          console.log('[create-checkout-session] Coupon invalid:', { isDateValid, isUsageValid })
        }
      } else {
        console.log('[create-checkout-session] Coupon not found or inactive')
      }
    }

    // TODO: Integrate with real payment provider (Stripe)
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    
    if (!stripeSecretKey || stripeSecretKey === 'PLACEHOLDER') {
      console.log('[create-checkout-session] Running in mock mode - no Stripe key configured')
    }
    
    // Create order in database
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: user.id,
        plan_id: planId,
        amount: finalAmount,
        discount_amount: discountAmount,
        coupon_code: couponCode || null,
        payment_status: 'pending',
        currency: 'ILS',
        stripe_session_id: `mock_session_${Date.now()}`,
      })
      .select()
      .single()

    if (orderError) {
      console.error('[create-checkout-session] Order creation error:', orderError)
      throw new Error('Failed to create order')
    }

    console.log('[create-checkout-session] Order created:', order.id)

    // Mock Stripe checkout URL
    const origin = req.headers.get('origin') || 'http://localhost:5173'
    const mockCheckoutUrl = `${origin}/payment-success?session_id=mock_session_${Date.now()}`

    console.log('[create-checkout-session] Success - returning checkout URL')

    return new Response(
      JSON.stringify({ 
        url: mockCheckoutUrl,
        message: stripeSecretKey && stripeSecretKey !== 'PLACEHOLDER' 
          ? 'Checkout session created'
          : 'Mock checkout session created (add STRIPE_SECRET_KEY to enable real payments)'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('[create-checkout-session] Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})