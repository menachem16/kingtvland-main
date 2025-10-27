# 🎯 IPTV Subscription Management System

A comprehensive full-stack subscription management platform built with React, TypeScript, and Google Sheets. This system provides complete subscription lifecycle management with admin dashboard, payment processing, and customer support features.

## ✨ Key Features

### User Features
- 🔐 **Secure Authentication**: Email/password authentication via Google Sheets
- 📦 **Subscription Plans**: Browse and subscribe to different service tiers
- 💳 **Payment Processing**: Stripe integration for secure payments
- 🎟️ **Coupon System**: Apply discount codes during checkout
- 💬 **Live Support**: Customer support chat system
- 👤 **Profile Management**: Update personal information and view subscription status
- 🛒 **Shopping Cart**: Add multiple plans before checkout

### Admin Features
- 📊 **Comprehensive Dashboard**: System statistics and insights
- 👥 **User Management**: View and manage all user accounts
- 📋 **Plan Management**: Create, update, and deactivate subscription plans
- 💰 **Order Tracking**: Monitor transactions and payment status
- 🎫 **Coupon Management**: Create and manage discount campaigns
- 💬 **Chat Support**: Respond to customer inquiries
- 🔍 **Audit Logs**: Track all admin actions for security compliance
- ⚙️ **Settings**: Manage global site configuration

## 🏗️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** + shadcn/ui components
- **React Query** for server state
- **React Router** for navigation
- **Zod** for validation

### Backend
- **Google Sheets** as the primary database
- **Google Apps Script** for serverless API endpoints
- **localStorage** for client-side session management

### Integrations
- **Stripe** - Payment processing
- **Resend** - Email delivery
- **Google Sheets** - Data storage and management

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google account for Google Sheets and Apps Script
- Stripe account (for payments)
- Netlify account (for hosting)

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

### Google Sheets Setup

1. Create a new Google Spreadsheet
2. Copy the content of `google-apps-script/Code.gs`
3. Open Script Editor in Google Sheets (Extensions > Apps Script)
4. Paste the code and save
5. Deploy as Web App:
   - Click "Deploy" > "New deployment"
   - Select type: "Web app"
   - Execute as: "Me"
   - Who has access: "Anyone"
   - Copy the Web App URL

### Environment Configuration

Create a `.env` file in the root directory:

```env
VITE_GOOGLE_SHEETS_SCRIPT_URL=YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL
```

### Required Secrets (Netlify)

Add these environment variables in Netlify dashboard:
- `VITE_GOOGLE_SHEETS_SCRIPT_URL` - Your Google Apps Script Web App URL

### Google Sheets Schema

Your spreadsheet needs these sheets:

#### Customers Sheet
| מזהה | שם פרטי | שם משפחה | אימייל | סיסמה | טלפון | מנהל | תאריך הצטרפות |
|------|---------|----------|--------|--------|--------|------|----------------|

#### Plans Sheet
| מזהה | שם | תיאור | מחיר | תכונות | פעיל |
|------|-----|-------|------|--------|------|

#### Orders Sheet
| מזהה | user_id | amount | payment_status | created_at |
|------|---------|--------|----------------|------------|

#### Subscriptions Sheet
| מזהה | user_id | plan_id | status | start_date | end_date |
|------|---------|---------|--------|------------|----------|

## 📁 Project Structure

```
├── src/
│   ├── components/          # Reusable components
│   │   ├── admin/          # Admin-specific components
│   │   └── ui/             # UI components (shadcn/ui)
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and helpers
│   └── integrations/       # API clients
│       └── google-sheets/  # Google Sheets client
├── google-apps-script/     # Google Apps Script code
└── public/                 # Static assets
```

## 🔒 Security Features

- ✅ Input validation (client + server)
- ✅ Rate limiting on critical endpoints
- ✅ Audit logging for admin actions
- ✅ Secure password storage
- ✅ CORS protection

## 🚀 Deployment

### Using Netlify (Recommended)

1. **Connect Your Repository**
   - Go to [Netlify](https://netlify.com)
   - Click "Add new site" > "Import an existing project"
   - Connect your Git provider

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - These are already configured in `netlify.toml`

3. **Add Environment Variables**
   - Go to Site settings > Environment variables
   - Add: `VITE_GOOGLE_SHEETS_SCRIPT_URL`
   - Set the value to your Google Apps Script URL

4. **Deploy**
   - Click "Deploy site"
   - Your app will be live!

### Custom Domain

Navigate to Site settings > Domain management and connect your domain.

## 📝 API Endpoints

All API endpoints are handled by Google Apps Script:

### Authentication
- `GET ?action=signin&email=...&password=...` - Sign in
- `GET ?action=signup&email=...&password=...` - Sign up

### Data Retrieval
- `GET ?action=getSubscription&userId=...` - Get user subscription
- `GET ?action=getPlans` - Get all subscription plans
- `GET ?action=getOrders&userId=...` - Get user orders
- `GET ?action=getAllUsers` - Get all users (Admin)

### Data Updates
- `POST { action: 'updateProfile', userId, updates }` - Update profile
- `POST { action: 'createSubscription', ... }` - Create subscription
- `POST { action: 'createOrder', ... }` - Create order

## 🎨 Design System

- Semantic HSL color tokens
- Custom typography scale
- Smooth animations
- Full dark mode support
- Mobile-first responsive design

## 🐛 Troubleshooting

### Database Issues
- Verify Google Sheets Script URL is correct
- Check that sheets are named correctly in the spreadsheet
- Ensure Google Apps Script is deployed with "Anyone" access

### Authentication Issues
- Check that user credentials exist in Google Sheets
- Verify column names match (Hebrew or English)
- Check browser console for errors

### Payment Issues
- Confirm Stripe webhook secret
- Verify API keys
- Check redirect URLs

## 📄 Technologies

This project is built with:
- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Google Sheets
- Google Apps Script

## 📧 RAFική

For issues or questions, please open an issue in the repository.

## 🎯 Future Roadmap

- [ ] Two-factor authentication (2FA)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] API documentation site
- [ ] Automated testing suite
- [ ] Real-time data synchronization

---

Built with ❤️ for subscription management
