import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

/**
 * Check if a request should be rate limited
 * @param identifier - IP address or user ID
 * @param endpoint - Endpoint name
 * @param config - Rate limit configuration
 * @returns true if rate limited, false otherwise
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<{ limited: boolean; remaining: number }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[rateLimit] Missing Supabase credentials, skipping rate limit');
    return { limited: false, remaining: config.maxRequests };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Calculate window start time
  const windowStart = new Date(Date.now() - config.windowMs);

  try {
    // Get current count for this identifier+endpoint in the time window
    const { data: existing, error } = await supabase
      .from('rate_limits')
      .select('request_count')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString())
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('[rateLimit] Error checking rate limit:', error);
      return { limited: false, remaining: config.maxRequests };
    }

    const currentCount = existing?.request_count || 0;

    // Check if limit exceeded
    if (currentCount >= config.maxRequests) {
      console.log(`[rateLimit] Rate limit exceeded for ${identifier} on ${endpoint}`);
      return { limited: true, remaining: 0 };
    }

    // Update or insert rate limit record
    if (existing) {
      await supabase
        .from('rate_limits')
        .update({ 
          request_count: currentCount + 1 
        })
        .eq('identifier', identifier)
        .eq('endpoint', endpoint)
        .gte('window_start', windowStart.toISOString());
    } else {
      await supabase
        .from('rate_limits')
        .insert({
          identifier,
          endpoint,
          request_count: 1,
          window_start: new Date().toISOString(),
        });
    }

    return { 
      limited: false, 
      remaining: config.maxRequests - currentCount - 1 
    };

  } catch (error) {
    console.error('[rateLimit] Unexpected error:', error);
    return { limited: false, remaining: config.maxRequests };
  }
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
  config: RateLimitConfig,
  remaining: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': new Date(Date.now() + config.windowMs).toISOString(),
  };
}
