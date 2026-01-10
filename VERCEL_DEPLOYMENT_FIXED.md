# Vercel Deployment Configuration - FIXED

## Environment Variables Required in Vercel

Set these environment variables in your Vercel dashboard:

### Required Variables
```
DATABASE_URL=postgresql://pharmino_user:NLgoelbEvmiy1mZP7bCSMOeqrZc3HOwA@dpg-d597njpr0fns73fkhusg-a.oregon-postgres.render.com/pharmino
BETTER_AUTH_SECRET=47bc7eadd2c59e2d0e06882412d1ef7db1e224287a67f1e76a01f7e1144df8ae
BETTER_AUTH_URL=https://your-app-name.vercel.app
NODE_ENV=production
```

## Steps to Deploy

1. **Update BETTER_AUTH_URL**: Change from `http://localhost:3000/` to your Vercel app URL (without trailing slash)
2. **Set Environment Variables**: Add all variables in Vercel dashboard
3. **Deploy**: Push your code to trigger deployment

## Critical Fix Applied ✅

Updated `src/lib/auth.ts` with proper cookie configuration:
- Added session cookie cache with 7-day expiration
- Configured secure cookies for production
- Set proper domain handling (localhost vs production)
- Added `sameSite: "lax"` for cross-site navigation

## Cookie Configuration Now Includes:
- `httpOnly: true` - Prevents XSS attacks
- `sameSite: "lax"` - Allows cookies in cross-site navigation
- `secure: true` - Only sends cookies over HTTPS in production
- `credentials: 'include'` - Includes cookies in all API requests
- Proper domain handling for localhost vs production

## What This Fixes:
1. **Cookie Persistence**: Cookies now persist for 7 days instead of session-only
2. **Production Security**: Secure cookies in production, non-secure in development
3. **Cross-Site Issues**: Proper sameSite configuration for Vercel deployment
4. **Domain Handling**: Automatically handles localhost vs production domains

## Your Frontend Code Remains Unchanged ✅
- All your existing employee actions will work as-is
- No changes needed to your Directory component
- Cookie-based authentication is preserved

## Testing After Deployment:

1. **Login**: Test login functionality first
2. **Check Cookies**: Browser DevTools → Application → Cookies → Verify `better-auth.session_token` exists
3. **Test CRUD**: Try creating, updating, deleting employees
4. **Check Network**: DevTools → Network → Look for 401/403 errors

## Troubleshooting:

If CRUD operations still don't work:
1. **Environment Variables**: Double-check BETTER_AUTH_URL in Vercel dashboard
2. **Cookie Domain**: Ensure no custom domain conflicts
3. **HTTPS**: Verify your Vercel app uses HTTPS
4. **Logs**: Check Vercel function logs for authentication errors

## Important Notes:
- **No Frontend Changes Required**: Your existing code will work
- **Database**: Using your existing Render PostgreSQL database
- **Security**: Production-ready cookie configuration applied
- **Compatibility**: Works with your current better-auth setup