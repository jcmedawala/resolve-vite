# Quick Start Guide

## 🎉 What You Got

A complete admin authentication system using professional shadcn blocks:

### Login Page (shadcn login-03)
- ✅ Apple login button (disabled, for display)
- ✅ Google login button (disabled, for display)
- ✅ Email & password sign in (working)
- ✅ "Sign up" link to admin registration

### Admin Signup Page (shadcn signup-02)
- ✅ First Name field
- ✅ Last Name field
- ✅ Email field
- ✅ Password field
- ✅ **Admin Secret Code** field (validates server-side)
- ✅ "Sign in" link back to login

### Authenticated View
- ✅ Clean header with "Admin Dashboard" title
- ✅ Sign out button
- ✅ Your existing content

## ⚙️ Setup (Required)

### 1. Set Environment Variable in Convex Dashboard

**This is REQUIRED for the app to work!**

1. Go to: https://dashboard.convex.dev
2. Select your project
3. Click **Settings** → **Environment Variables**
4. Add new variable:
   - Name: `ADMIN_SECRET_CODE`
   - Value: `your-secret-code-here` (choose a secure value)
5. Click **Save**

**Note**: This works for BOTH dev and prod. No need for `.env.local` files.

### 2. Run the App

```bash
npm run dev
```

The app will start with:
- Backend: `convex dev`
- Frontend: Vite dev server
- Dashboard: Convex dashboard will open

## 🧪 Testing the Flow

1. **Visit the app** - You'll see the login page
2. **Click "Sign up"** - Switch to admin signup form
3. **Fill in the form**:
   - First Name: John
   - Last Name: Doe
   - Email: admin@example.com
   - Password: password123
   - Admin Secret Code: (use the one you set in Convex dashboard)
4. **Click "Create Admin Account"**
5. **Success!** You're now signed in and see the admin dashboard

## 🔍 What Happens Behind the Scenes

1. **Secret Code Validation**:
   - Frontend sends secret code to Convex mutation
   - Server validates against `ADMIN_SECRET_CODE` from dashboard
   - If invalid, signup fails with error message

2. **Account Creation**:
   - Creates user via Convex Password auth
   - Automatically sets:
     - `role`: "admin"
     - `isPeopleManager`: "No"
     - `teamLead`: null
     - `firstName` and `lastName` from form

3. **Auto Sign-In**:
   - User is automatically signed in after successful signup
   - Redirects to authenticated dashboard view

## 📊 Database Schema

Every admin user has these fields:

```typescript
{
  email: string
  firstName: string
  lastName: string
  name: string // "FirstName LastName"
  role: "admin"
  isPeopleManager: "No"
  teamLead: null
}
```

## 🔐 Security Notes

- Secret code is validated **server-side only**
- Environment variable is **cloud-based** (not in your code)
- All passwords are hashed by Convex Password auth
- No plain-text credentials stored

## 🎨 UI Components Used

- **shadcn/ui login-03** - Professional login form with OAuth buttons
- **shadcn/ui signup-02** - Professional signup form with validation
- **shadcn/ui Card** - Card container for forms
- **shadcn/ui Button** - All buttons
- **shadcn/ui Input** - Form inputs
- **shadcn/ui Field** - Form field layout

## 📝 Next Steps

- [ ] Set `ADMIN_SECRET_CODE` in Convex dashboard
- [ ] Test signup with correct secret code
- [ ] Test signup with wrong secret code (should fail)
- [ ] Test sign in with created account
- [ ] Verify user fields in Convex dashboard

## 🆘 Troubleshooting

**Error: "Admin secret code not configured"**
- You forgot to set `ADMIN_SECRET_CODE` in Convex dashboard
- Go to Settings > Environment Variables and add it

**Error: "Invalid secret code"**
- The secret code you entered doesn't match the one in dashboard
- Double-check the value in Convex dashboard

**Can't see the signup page**
- Click "Sign up" link on the login page
- It's below the "Sign in" button

**Apple/Google buttons disabled**
- They're for visual display only (as requested)
- Use email/password sign in for actual authentication
