import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Retry logic
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  maxRetries = 3
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status} ${response.statusText}`);
      }
      
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      console.log(`[sync-google-sheets] Attempt ${i + 1} failed, retrying...`);
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        console.log(`[sync-google-sheets] Attempt ${i + 1} failed:`, error);
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
  
  throw lastError || new Error('Max retries reached');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[sync-google-sheets] Starting sync operation');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get API key and Sheet ID from request body or environment
    let apiKey: string | undefined;
    let sheetId: string | undefined;
    
    try {
      const body = await req.json();
      apiKey = body.apiKey;
      sheetId = body.sheetId;
    } catch {
      // Body is optional, will use env vars
    }

    const GOOGLE_API_KEY = apiKey || Deno.env.get('GOOGLE_API_KEY');
    const SHEET_ID = sheetId || Deno.env.get('GOOGLE_SHEET_ID');

    if (!GOOGLE_API_KEY || GOOGLE_API_KEY === 'PLACEHOLDER') {
      console.log('[sync-google-sheets] Google API key not configured');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Google API Key not configured. Add GOOGLE_API_KEY and GOOGLE_SHEET_ID secrets.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!SHEET_ID || SHEET_ID === 'PLACEHOLDER') {
      throw new Error('Google Sheet ID not configured');
    }

    console.log('[sync-google-sheets] Fetching customer data from database');

    // Fetch customers data with pagination for large datasets
    const BATCH_SIZE = 1000;
    let allProfiles: any[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .range(offset, offset + BATCH_SIZE - 1);

      if (profilesError) {
        console.error('[sync-google-sheets] Error fetching profiles:', profilesError);
        throw profilesError;
      }

      if (!profiles || profiles.length === 0) {
        hasMore = false;
      } else {
        allProfiles = allProfiles.concat(profiles);
        offset += BATCH_SIZE;
        
        // Safety check for very large datasets
        if (allProfiles.length >= 10000) {
          console.log('[sync-google-sheets] Reached 10k rows limit, stopping pagination');
          hasMore = false;
        }
      }
    }

    console.log(`[sync-google-sheets] Processing ${allProfiles.length} profiles`);

    // Format data for Google Sheets
    const sheetData = allProfiles.map(profile => {
      return [
        profile.id,
        profile.first_name || '',
        profile.last_name || '',
        profile.phone || '',
        profile.email || '',
        profile.created_at,
        profile.updated_at
      ];
    });

    // Add headers row
    const headers = [
      'מזהה',
      'שם פרטי',
      'שם משפחה',
      'טלפון',
      'אימייל',
      'תאריך הצטרפות',
      'תאריך עדכון'
    ];

    const allData = [headers, ...sheetData];

    console.log('[sync-google-sheets] Syncing to Google Sheets');

    // Clear existing data with retry
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/A1:clear?key=${GOOGLE_API_KEY}`;
    
    await fetchWithRetry(clearUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('[sync-google-sheets] Cleared existing data');

    // Update with new data with retry
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/A1:append?valueInputOption=RAW&key=${GOOGLE_API_KEY}`;
    
    const response = await fetchWithRetry(updateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        values: allData
      })
    });

    const result = await response.json();
    console.log('[sync-google-sheets] Sync completed successfully:', result);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Data synced successfully',
        rowCount: allData.length,
        profileCount: allProfiles.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[sync-google-sheets] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});