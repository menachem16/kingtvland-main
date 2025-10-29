// Google Sheets API Client
// This replaces the Supabase client for Google Sheets integration

const GOOGLE_SHEETS_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SHEETS_SCRIPT_URL || '';

interface GoogleSheetsUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  subscriptionPlan?: string;
  subscriptionEndDate?: string;
  totalRevenue?: number;
  joinDate?: string;
  orderCount?: number;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  features: any;
  is_active: boolean;
}

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string;
  subscription_plans?: SubscriptionPlan;
}

interface Order {
  id: string;
  user_id: string;
  amount: number;
  payment_status: string;
  created_at: string;
}

class GoogleSheetsClient {
  private sheetsUrl: string;

  constructor() {
    this.sheetsUrl = GOOGLE_SHEETS_SCRIPT_URL;
    
    // Debug logging
    if (!this.sheetsUrl) {
      console.error('❌ VITE_GOOGLE_SHEETS_SCRIPT_URL לא מוגדר!');
      console.error('הוסף את המשתנה ל-.env ובסביבת Netlify');
    } else {
      console.log('✅ Google Sheets URL מוגדר:', this.sheetsUrl.replace(/\/exec.*$/, '/exec'));
    }
  }

  // Authentication methods
  async signIn(email: string, password: string): Promise<{ user: GoogleSheetsUser | null; error: any }> {
    if (!this.sheetsUrl) {
      return { 
        user: null, 
        error: { 
          message: 'Google Sheets URL לא מוגדר. בדוק את משתנה הסביבה VITE_GOOGLE_SHEETS_SCRIPT_URL' 
        } 
      };
    }

    try {
      const url = `${this.sheetsUrl}?action=signin&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
      console.log('🔐 מנסה להתחבר ל-Google Sheets');
      console.log('📤 URL:', url.replace(/password=[^&]*/, 'password=***'));
      
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
      });
      
      console.log('📥 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        return { 
          user: null, 
          error: { 
            message: `HTTP ${response.status}: ${errorText || 'Authentication failed'}` 
          } 
        };
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Expected JSON but got:', contentType);
        console.error('Response text:', text.substring(0, 200));
        return { 
          user: null, 
          error: { 
            message: 'Server returned non-JSON response. Check CORS and Google Apps Script settings.' 
          } 
        };
      }

      const result = await response.json();
      console.log('✅ Response received:', result.success ? 'Success' : 'Failed');
      
      if (!result.success) {
        console.error('❌ Authentication failed:', result.message);
        return { user: null, error: { message: result.message || 'Authentication failed' } };
      }

      if (result.success && result.data) {
        const userData = result.data;
        console.log('👤 User data received:', Object.keys(userData));
        
        const user: GoogleSheetsUser = {
          id: userData['מזהה'] || userData['ID'] || userData['id'] || '',
          email: userData['אימייל'] || userData['Email'] || email,
          firstName: userData['שם פרטי'] || userData['First Name'] || '',
          lastName: userData['שם משפחה'] || userData['Last Name'] || '',
          phone: userData['טלפון'] || userData['Phone'] || null,
          avatarUrl: userData['תמונת פרופיל'] || userData['Avatar'] || null,
          isAdmin: userData['מנהל'] === true || userData['מנהל'] === 'TRUE' || userData['Admin'] === true || userData['is_admin'] === true,
          subscriptionPlan: userData['תוכנית מנוי'] || userData['Subscription Plan'] || undefined,
          subscriptionEndDate: userData['תאריך סיום'] || userData['End Date'] || undefined,
          totalRevenue: userData['סה"כ הכנסות'] || userData['Total Revenue'] || undefined,
          joinDate: userData['תאריך הצטרפות'] || userData['Join Date'] || undefined,
          orderCount: userData['מספר הזמנות'] || userData['Order Count'] || undefined,
        };
        
        console.log('✅ User authenticated:', user.email);
        return { user, error: null };
      } else {
        return { user: null, error: { message: result.message || 'Authentication failed' } };
      }
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      return { 
        user: null, 
        error: { 
          message: error.message || 'Network error. Check console for details.' 
        } 
      };
    }
  }

  async signUp(email: string, password: string, firstName: string, lastName: string): Promise<{ user: GoogleSheetsUser | null; error: any }> {
    if (!this.sheetsUrl) {
      return { 
        user: null, 
        error: { 
          message: 'Google Sheets URL לא מוגדר' 
        } 
      };
    }

    try {
      console.log('📝 מנסה להירשם:', email);
      
      // Use URL-encoded form to avoid CORS preflight
      const form = new URLSearchParams();
      form.append('action', 'signup');
      form.append('email', email);
      form.append('password', password);
      form.append('firstName', firstName);
      form.append('lastName', lastName);
      
      const response = await fetch(this.sheetsUrl, {
        method: 'POST',
        // Do NOT set Content-Type header explicitly to keep it a simple request
        body: form,
        redirect: 'follow',
      });

      console.log('📥 Signup response status:', response.status);

      // Try to parse JSON; Apps Script may not set JSON content-type for form posts
      let result: any;
      try {
        result = await response.json();
      } catch (_) {
        const text = await response.text();
        try {
          result = JSON.parse(text);
        } catch (e) {
          console.error('❌ Signup non-JSON response:', text.substring(0, 200));
          return {
            user: null,
            error: { message: 'Server returned non-JSON response' },
          };
        }
      }
      console.log('✅ Signup response:', result.success ? 'Success' : 'Failed');

      if (result.success && result.data) {
        const userData = result.data;
        const user: GoogleSheetsUser = {
          id: userData.id || '',
          email,
          firstName,
          lastName,
          phone: null,
          avatarUrl: null,
          isAdmin: userData.isAdmin || false,
        };
        console.log('✅ User registered:', user.email);
        return { user, error: null };
      } else {
        console.error('❌ Registration failed:', result.message);
        return { 
          user: null, 
          error: { 
            message: result.message || 'Registration failed' 
          } 
        };
      }
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      return { 
        user: null, 
        error: { 
          message: error.message || 'Network error' 
        } 
      };
    }
  }

  // Subscription methods
  async getUserSubscription(userId: string): Promise<Subscription | null> {
    if (!this.sheetsUrl) {
      return null;
    }

    try {
      const url = `${this.sheetsUrl}?action=getSubscription&userId=${encodeURIComponent(userId)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return null;
      }

      const result = await response.json();

      if (result.success && result.data) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Get subscription error:', error);
      return null;
    }
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    if (!this.sheetsUrl) {
      return [];
    }

    try {
      const url = `${this.sheetsUrl}?action=getPlans`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return [];
      }

      const result = await response.json();

      if (result.success && result.data) {
        return result.data;
      }
      return [];
    } catch (error) {
      console.error('Get subscription plans error:', error);
      return [];
    }
  }

  // Orders methods
  async getUserOrders(userId: string): Promise<Order[]> {
    if (!this.sheetsUrl) {
      return [];
    }

    try {
      const url = `${this.sheetsUrl}?action=getOrders&userId=${encodeURIComponent(userId)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return [];
      }

      const result = await response.json();

      if (result.success && result.data) {
        return result.data;
      }
      return [];
    } catch (error) {
      console.error('Get orders error:', error);
      return [];
    }
  }

  // Profile update
  async updateProfile(userId: string, updates: Partial<GoogleSheetsUser>): Promise<{ success: boolean; error?: any }> {
    if (!this.sheetsUrl) {
      return { success: false, error: 'Google Sheets URL not configured' };
    }

    try {
      const response = await fetch(this.sheetsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateProfile',
          userId,
          updates,
        }),
      });

      const result = await response.json();
      return { success: result.success || false, error: result.error };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error };
    }
  }

  // Admin methods
  async getAllUsers(): Promise<GoogleSheetsUser[]> {
    if (!this.sheetsUrl) {
      return [];
    }

    try {
      const url = `${this.sheetsUrl}?action=getAllUsers`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return [];
      }

      const result = await response.json();

      if (result.success && result.data) {
        return result.data;
      }
      return [];
    } catch (error) {
      console.error('Get all users error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const googleSheets = new GoogleSheetsClient();

// Export types
export type { GoogleSheetsUser, SubscriptionPlan, Subscription, Order };

