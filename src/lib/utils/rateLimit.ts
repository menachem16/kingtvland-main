/**
 * Rate limiting utilities for Edge Functions
 * Used to prevent abuse and ensure fair usage
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  'chat-message': {
    maxRequests: 30, // 30 messages
    windowMs: 60000, // per minute
  },
  'checkout': {
    maxRequests: 5, // 5 checkout attempts
    windowMs: 300000, // per 5 minutes
  },
  'coupon': {
    maxRequests: 10, // 10 coupon checks
    windowMs: 60000, // per minute
  },
  'default': {
    maxRequests: 60, // 60 requests
    windowMs: 60000, // per minute
  },
};

export const getRateLimitConfig = (endpoint: string): RateLimitConfig => {
  return RATE_LIMIT_CONFIGS[endpoint] || RATE_LIMIT_CONFIGS.default;
};
