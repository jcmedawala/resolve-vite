# Admin Signup Setup

This project includes an admin signup flow that requires a secret code for registration.

## Environment Variable Setup

**IMPORTANT**: The admin secret code is read from Convex cloud environment variables for BOTH development and production. This means:
- ✅ Set in Convex Dashboard for both dev and prod deployments
- ❌ NOT read from local `.env.local` files
- ✅ Ensures consistent security across all environments

### Setup Instructions

1. Go to your Convex dashboard: https://dashboard.convex.dev
2. Select your project
3. Navigate to **Settings** > **Environment Variables**
4. Add a new environment variable:
   - **Name**: `ADMIN_SECRET_CODE`
   - **Value**: Your secure secret code (e.g., a randomly generated string)
5. The environment variable will be available immediately in both dev and prod

### For Multiple Environments

If you have separate Convex projects for development and production:
- Set `ADMIN_SECRET_CODE` in your **development** project
- Set `ADMIN_SECRET_CODE` in your **production** project
- You can use the same or different values depending on your security requirements

**Note**: Changes to environment variables take effect immediately without redeployment.

## How Admin Signup Works

1. Users navigate to the admin signup form (accessible via "Sign up as Admin" link)
2. They fill in:
   - First Name
   - Last Name
   - Email
   - Password
   - Admin Secret Code
3. The system validates the secret code against `ADMIN_SECRET_CODE` environment variable
4. Upon successful validation, a new user is created with:
   - `role`: "admin"
   - `isPeopleManager`: "No"
   - `teamLead`: null
   - `firstName` and `lastName` fields populated

## Database Schema

The `users` table includes the following custom fields for admin management:

- `firstName`: string (optional)
- `lastName`: string (optional)
- `role`: string (optional) - defaults to "admin" for admin signups
- `isPeopleManager`: string (optional) - defaults to "No"
- `teamLead`: string | null (optional) - defaults to null

## Security Considerations

- The secret code should be a strong, randomly generated value
- Rotate the secret code periodically
- Monitor admin signups in your dashboard
- Consider implementing rate limiting on the signup endpoint
- Add additional validation as needed for your use case

## Testing

To test the admin signup flow:

1. Ensure `ADMIN_SECRET_CODE` is set in your environment
2. Run the app locally: `npm run dev`
3. Click "Sign up as Admin" on the login page
4. Fill in the form with the correct secret code
5. Verify the user is created with admin privileges in the Convex dashboard
