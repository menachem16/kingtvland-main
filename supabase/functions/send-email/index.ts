import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  type?: 'welcome' | 'subscription' | 'payment' | 'support';
}

// Input validation
function validateEmailRequest(data: any): EmailRequest {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid request body')
  }
  
  if (!data.to || typeof data.to !== 'string' || !data.to.includes('@')) {
    throw new Error('Valid recipient email is required')
  }
  
  if (!data.subject || typeof data.subject !== 'string' || data.subject.trim() === '') {
    throw new Error('Subject is required')
  }
  
  if (!data.html || typeof data.html !== 'string' || data.html.trim() === '') {
    throw new Error('Email content is required')
  }
  
  if (data.subject.length > 200) {
    throw new Error('Subject is too long (max 200 characters)')
  }
  
  if (data.html.length > 50000) {
    throw new Error('Email content is too long (max 50000 characters)')
  }
  
  const validTypes = ['welcome', 'subscription', 'payment', 'support']
  if (data.type && !validTypes.includes(data.type)) {
    throw new Error('Invalid email type')
  }
  
  return {
    to: data.to.trim(),
    subject: data.subject.trim(),
    html: data.html,
    type: data.type || 'support'
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[send-email] Starting email send request')

  try {
    // Check for API key
    const resendApiKey = Deno.env.get("RESEND_API_KEY")
    
    if (!resendApiKey || resendApiKey === 'PLACEHOLDER') {
      console.error('[send-email] RESEND_API_KEY not configured')
      throw new Error('Email service not configured. Please add RESEND_API_KEY secret.')
    }

    const resend = new Resend(resendApiKey);

    // Parse and validate request
    const requestData = await req.json();
    const { to, subject, html, type } = validateEmailRequest(requestData);

    console.log('[send-email] Sending email:', { to, subject, type });

    // Email templates
    const templates = {
      welcome: (content: string) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0;">ברוכים הבאים!</h1>
          </div>
          <div style="padding: 40px; background: #f9fafb;">
            ${content}
          </div>
          <div style="background: #1f2937; padding: 20px; text-align: center; color: #9ca3af;">
            <p>תודה שבחרת בנו</p>
          </div>
        </div>
      `,
      subscription: (content: string) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl;">
          <div style="background: #10b981; padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0;">עדכון מנוי</h1>
          </div>
          <div style="padding: 40px; background: #f9fafb;">
            ${content}
          </div>
        </div>
      `,
      payment: (content: string) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl;">
          <div style="background: #3b82f6; padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0;">אישור תשלום</h1>
          </div>
          <div style="padding: 40px; background: #f9fafb;">
            ${content}
          </div>
        </div>
      `,
      support: (content: string) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl;">
          <div style="padding: 40px; background: #f9fafb;">
            ${content}
          </div>
        </div>
      `
    };

    const templateFunc = templates[type] || templates.support;
    const finalHtml = templateFunc(html);

    const emailResponse = await resend.emails.send({
      from: "Lovable <onboarding@resend.dev>", // TODO: Change to custom domain
      to: [to],
      subject: subject,
      html: finalHtml,
    });

    console.log("[send-email] Email sent successfully:", emailResponse.id || 'no-id');

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("[send-email] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);