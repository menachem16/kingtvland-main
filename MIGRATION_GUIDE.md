# Migration Guide: From Supabase to Google Sheets

## ✅ Completed Changes

### 1. Core Infrastructure
- ✅ Created `src/integrations/google-sheets/client.ts` - Google Sheets API client replacement for Supabase
- ✅ Updated `src/contexts/AuthContext.tsx` - Now uses Google Sheets authentication with localStorage
- ✅ Updated `src/components/CartContext.tsx` - Removed Supabase types dependency
- ✅ Updated `src/hooks/useAuditLog.ts` - Removed Supabase dependency
- ✅ Removed `@supabase/supabase-js` from `package.json`
- ✅ Removed `lovable-tagger` from `package.json` devDependencies
- ✅ Created `netlify.toml` for Netlify deployment configuration
- ✅ Updated Google Apps Script (`google-apps-script/Code.gs`) with complete authentication handlers

### 2. Updated Pages
- ✅ `src/pages/Dashboard.tsx` - Now uses Google Sheets API
- ✅ `src/pages/Index.tsx` - Now uses Google Sheets API for fetching plans

## ⚠️ Remaining Work

### 1. Pages That Still Need Updates
- ⏳ `src/pages/Subscription.tsx` - Replace Supabase queries
- ⏳ `src/pages/Profile.tsx` - Replace Supabase queries
- ⏳ `src/pages/Support.tsx` - Replace Supabase queries
- ⏳ `src/pages/Admin.tsx` - Replace Supabase queries

### 2. Admin Components That Need Updates
- ⏳ `src/components/admin/AdminSettingsTab.tsx`
- ⏳ `src/components/admin/AdminCouponsTab.tsx`
- ⏳ `src/components/admin/AdminChatTab.tsx`
- ⏳ `src/components/admin/AdminPlansTab.tsx`
- ⏳ `src/components/admin/AdminOrdersTab.tsx`
- ⏳ `src/components/admin/AdminUsersTab.tsx`
- ⏳ `src/components/admin/AdminAuditTab.tsx`

### 3. Other Components
- ⏳ `src/components/ChatWidget.tsx`
- ⏳ `src/components/FeaturesSection.tsx`
- ⏳ `src/components/HeroSection.tsx`
- ⏳ `src/components/PricingSection.tsx`
- ⏳ `src/components/TestimonialsSection.tsx`

### 4. Files to Remove
- ⏳ `src/integrations/supabase/` directory
- ⏳ `supabase/` directory (all functions and migrations)

## 🔧 Configuration Required

### Environment Variables
Add to your Netlify environment variables:
```
VITE_GOOGLE_SHEETS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### Google Sheets Setup
1. Deploy the Google Apps Script (`google-apps-script/Code.gs`) as a Web App
2. Get the Web App URL
3. Add it to your environment variables
4. Create the following sheets in your Google Spreadsheet:
   - **Customers** - User data with columns: מזהה, שם פרטי, שם משפחה, אימייל, סיסמה, etc.
   - **Plans** - Subscription plans data
   - **Orders** - User orders data
   - **Subscriptions** - User subscriptions data

### Google Sheets Schema

#### Customers Sheet
| מזהה | שם פרטי | שם משפחה | אימייל | סיסמה | טלפון | מנהל | תאריך הצטרפות |
|------|---------|----------|--------|--------|--------|------|----------------|
| uuid | First   | Last     | email  | pass   | phone  | true/false | date |

#### Plans Sheet
| מזהה | שם | תיאור | מחיר | תכונות | פעיל |
|------|-----|-------|------|--------|------|
| id   | name| desc  | price| features| true/false |

## 📝 Implementation Pattern

For each file that uses Supabase, follow this pattern:

### Before (Supabase)
```typescript
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', value);
```

### After (Google Sheets)
```typescript
import { googleSheets } from '@/integrations/google-sheets/client';

const data = await googleSheets.getMethodName();
```

## 🚀 Deployment Steps

1. **Test Locally**
   ```bash
   npm install
   npm run dev
   ```

2. **Build for Production**
   ```bash
   npm run build
   ```

3. **Deploy to Netlify**
   - Connect your Git repository
   - Set environment variable: `VITE_GOOGLE_SHEETS_SCRIPT_URL`
   - Deploy from main branch

4. **Verify Google Sheets Connection**
   - Test authentication
   - Verify data reads/writes

## ⚡ Key Changes

1. **Authentication**: Now uses localStorage instead of Supabase sessions
2. **Database**: Google Sheets replaces PostgreSQL
3. **Real-time**: Real-time features removed (no subscriptions)
4. **Auth State**: Stored in localStorage, not Supabase session
5. **API Calls**: Direct calls to Google Apps Script instead of Supabase REST API

## 📚 Resources

- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [Netlify Deployment Guide](https://docs.netlify.com/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

## 🔒 Security Notes

1. Google Apps Script requires "Anyone" access but can validate credentials
2. Passwords should be stored hashed in production
3. Consider using JWT tokens for better security
4. Add CORS headers to Google Apps Script if needed
5. Implement rate limiting in Google Apps Script

## 🐛 Troubleshooting

### Issue: "Google Sheets URL not configured"
- **Solution**: Add `VITE_GOOGLE_SHEETS_SCRIPT_URL` to environment variables

### Issue: Authentication not working
- **Solution**: Check Google Apps Script is deployed as Web App with "Anyone" access

### Issue: Data not loading
- **Solution**: Verify sheet names match in Google Apps Script and spreadsheet

AssemblyLabelInfo
