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
    if (!this.sheetsUrl) {
      console.warn('Google Sheets Script URL not configured');
    }
  }

  // Authentication methods
  async signIn(email: string, password: string): Promise<{ user: GoogleSheetsUser | null; error: any }> {
    if (!this.sheetsUrl) {
      return { user: null, error: 'Google Sheets URL not configured' };
    }

    try {
      const url = `${this.sheetsUrl}?action=signin&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const result = await response.json();

      if (result.success && result.data) {
        const userData = result.data;
        const user: GoogleSheetsUser = {
          id: userData['מזהה'] || userData['ID'] || userData['id'] || '',
          email: userData['אימייל'] || userData['Email'] || email,
          firstName: userData['שם פרטי'] || userData['First Name'] || '',
          lastName: userData['שם משפחה'] || userData['Last Name'] || '',
          phone: userData['טלפון'] || userData['Phone'] || null,
          avatarUrl: userData['תמונת פרופיל'] || userData['Avatar'] || null,
          isAdmin: userData['מנהל'] === true || userData['Admin'] === true || userData['is_admin'] === true,
          subscriptionPlan: userData['תוכנית מנוי'] || userData['Subscription Plan'] || undefined,
          subscriptionEndDate: userData['תאריך סיום'] || userData['End Date'] || undefined,
          totalRevenue: userData['סה"כ הכנסות'] || userData['Total Revenue'] || undefined,
          joinDate: userData['תאריך הצטרפות'] || userData['Join Date'] || undefined,
          orderCount: userData['מספר הזמנות'] || userData['Order Count'] || undefined,
        };
        return { user, error: null };
      } else {
        return { user: null, error: result.message || 'Authentication failed' };
      }
    } catch (error) {
      console.error('Sign in error:', error);
      return { user: null, error };
    }
  }

  async signUp(email: string, password: string, firstName: string, lastName: string): Promise<{ user: GoogleSheetsUser | null; error: any }> {
    if (!this.sheetsUrl) {
      return { user: null, error: 'Google Sheets URL not configured' };
    }

    try {
      const url = `${this.sheetsUrl}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'signup',
          email,
          password,
          firstName,
          lastName,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const userData = result.data;
        const user: GoogleSheetsUser = {
          id: userData.id || '',
          email,
          firstName,
          lastName,
          phone: null,
          avatarUrl: null,
          isAdmin: false,
        };
        return { user, error: null };
      } else {
        return { user: null, error: result.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Sign up error:', error);
      return { user: null, error };
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

