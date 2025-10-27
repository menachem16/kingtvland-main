import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { checkRateLimit, getRateLimitHeaders } from "../_shared/rateLimit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT_CONFIG = {
  maxRequests: 10, // 10 login attempts
  windowMs: 300000, // per 5 minutes
};

// Input validation
function validateAuthRequest(data: any): { email: string; password: string; googleSheetsUrl: string } {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid request body');
  }

  if (!data.email || typeof data.email !== 'string' || !data.email.includes('@')) {
    throw new Error('Valid email is required');
  }

  if (!data.password || typeof data.password !== 'string' || data.password.length < 1) {
    throw new Error('Password is required');
  }

  if (!data.googleSheetsUrl || typeof data.googleSheetsUrl !== 'string' || !data.googleSheetsUrl.startsWith('http')) {
    throw new Error('Valid Google Sheets URL is required');
  }

  return {
    email: data.email.trim(),
    password: data.password,
    googleSheetsUrl: data.googleSheetsUrl.trim()
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[google-sheets-auth] Incoming authentication request');

  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const { limited, remaining } = await checkRateLimit(ip, 'google-sheets-auth', RATE_LIMIT_CONFIG);
    
    if (limited) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'יותר מדי נסיונות התחברות. נסה שוב מאוחר יותר' 
        }),
        {
          status: 429,
          headers: { 
            ...corsHeaders, 
            ...getRateLimitHeaders(RATE_LIMIT_CONFIG, remaining),
            'Content-Type': 'application/json' 
          }
        }
      );
    }

    // Parse and validate request
    const requestData = await req.json();
    const { email, password, googleSheetsUrl } = validateAuthRequest(requestData);

    console.log('[google-sheets-auth] Authenticating user via Google Sheets:', { email, hasPassword: !!password });

    // Call Google Apps Script Web App with proper encoding
    const url = `${googleSheetsUrl}?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow'
    });

    if (!response.ok) {
      console.error('[google-sheets-auth] Google Sheets request failed:', response.status, response.statusText);
      throw new Error(`Google Sheets authentication failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result || typeof result !== 'object') {
      throw new Error('Invalid response from Google Sheets');
    }

    if (!result.success) {
      console.log('[google-sheets-auth] Authentication failed:', result.message);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: result.message || 'Authentication failed' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[google-sheets-auth] Authentication successful, syncing with Supabase');

    // Authentication successful - now create/update user in Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract user data from Google Sheets response
    const userData = result.data || {};
    const firstName = userData['שם פרטי'] || userData['First Name'] || '';
    const lastName = userData['שם משפחה'] || userData['Last Name'] || '';

    // Check if profile exists by email
    const { data: existingProfile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (profileFetchError && profileFetchError.code !== 'PGRST116') {
      console.error('[google-sheets-auth] Error fetching profile:', profileFetchError);
    }

    if (existingProfile) {
      console.log('[google-sheets-auth] Existing profile found');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Authentication successful',
          data: {
            ...userData,
            profile: existingProfile
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // User doesn't exist - create new profile
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: null
      })
      .select()
      .maybeSingle();

    if (profileError) {
      console.error('[google-sheets-auth] Error creating profile:', profileError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to create user profile'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[google-sheets-auth] New profile created');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Authentication successful',
        data: {
          ...userData,
          profile: newProfile
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('[google-sheets-auth] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});