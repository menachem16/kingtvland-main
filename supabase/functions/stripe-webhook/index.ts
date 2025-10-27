import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0'

serve(async (req) => {
  console.log('[stripe-webhook] Incoming webhook request')

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      console.error('[stripe-webhook] Missing stripe-signature header')
      throw new Error('Missing stripe-signature header')
    }

    if (!stripeWebhookSecret || stripeWebhookSecret === 'PLACEHOLDER') {
      console.log('[stripe-webhook] Running in mock mode - no webhook secret configured')
    }

    const body = await req.text()
    
    // TODO: Verify webhook signature with Stripe when secret is configured
    // For now, parse the event directly
    let event
    try {
      event = JSON.parse(body)
    } catch (parseError) {
      console.error('[stripe-webhook] Failed to parse event body:', parseError)
      throw new Error('Invalid JSON in webhook body')
    }

    if (!event || !event.type) {
      throw new Error('Invalid webhook event structure')
    }

    console.log('[stripe-webhook] Event received:', event.type, event.id || 'no-id')

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data?.object
        if (!session || !session.id) {
          console.error('[stripe-webhook] Invalid session data')
          break
        }

        console.log('[stripe-webhook] Processing checkout.session.completed:', session.id)
        
        // Update order status
        const { error: orderUpdateError } = await supabaseClient
          .from('orders')
          .update({
            payment_status: 'completed',
            stripe_payment_intent_id: session.payment_intent || null,
          })
          .eq('stripe_session_id', session.id)

        if (orderUpdateError) {
          console.error('[stripe-webhook] Error updating order:', orderUpdateError)
        }

        // Create subscription
        const { data: order, error: orderFetchError } = await supabaseClient
          .from('orders')
          .select('*, subscription_plans(*)')
          .eq('stripe_session_id', session.id)
          .maybeSingle()

        if (orderFetchError) {
          console.error('[stripe-webhook] Error fetching order:', orderFetchError)
          break
        }

        if (order && order.subscription_plans) {
          const endDate = new Date()
          endDate.setMonth(endDate.getMonth() + (order.subscription_plans.duration_months || 1))

          const { error: subscriptionError } = await supabaseClient
            .from('subscriptions')
            .insert({
              user_id: order.user_id,
              plan_id: order.plan_id,
              status: 'active',
              start_date: new Date().toISOString(),
              end_date: endDate.toISOString(),
              stripe_subscription_id: session.subscription || null,
            })

          if (subscriptionError) {
            console.error('[stripe-webhook] Error creating subscription:', subscriptionError)
          } else {
            console.log('[stripe-webhook] Subscription created successfully')
          }
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data?.object
        if (!paymentIntent || !paymentIntent.id) {
          console.error('[stripe-webhook] Invalid payment intent data')
          break
        }

        console.log('[stripe-webhook] Processing payment_intent.payment_failed:', paymentIntent.id)
        
        const { error } = await supabaseClient
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('stripe_payment_intent_id', paymentIntent.id)

        if (error) {
          console.error('[stripe-webhook] Error updating failed payment:', error)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data?.object
        if (!subscription || !subscription.id) {
          console.error('[stripe-webhook] Invalid subscription data')
          break
        }

        console.log('[stripe-webhook] Processing customer.subscription.deleted:', subscription.id)
        
        const { error } = await supabaseClient
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('[stripe-webhook] Error cancelling subscription:', error)
        }
        break
      }

      default:
        console.log('[stripe-webhook] Unhandled event type:', event.type)
    }

    console.log('[stripe-webhook] Webhook processed successfully')

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('[stripe-webhook] Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})