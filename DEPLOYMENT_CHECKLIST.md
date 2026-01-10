# Deployment Checklist ✅

## Pre-Deployment Steps

### 1. Code Changes Applied ✅
- [x] Updated `src/lib/auth.ts` with proper cookie configuration
- [x] Added session cookie cache with 7-day expiration
- [x] Configured secure cookies for production
- [x] Set proper domain handling (localhost vs production)

### 2. Environment Variables for Vercel
Set these in your Vercel dashboard:

```
DATABASE_URL=postgresql://pharmino_user:NLgoelbEvmiy1mZP7bCSMOeqrZc3HOwA@dpg-d597njpr0fns73fkhusg-a.oregon-postgres.render.com/pharmino
BETTER_AUTH_SECRET=47bc7eadd2c59e2d0e06882412d1ef7db1e224287a67f1e76a01f7e1144df8ae
BETTER_AUTH_URL=https://your-app-name.vercel.app
NODE_ENV=production
```

**Important**: Replace `your-app-name` with your actual Vercel app name!

## Deployment Steps

### 1. Deploy to Vercel
```bash
# If using Vercel CLI
vercel --prod

# Or push to your connected Git repository
git add .
git commit -m "Fix cookie authentication for production"
git push origin main
```

### 2. Update Environment Variables
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all the variables listed above
3. Make sure `BETTER_AUTH_URL` matches your deployed URL exactly
4. Redeploy after adding environment variables

## Post-Deployment Testing

### 1. Basic Authentication Test
1. Visit your deployed app
2. Login with admin credentials
3. Check browser DevTools → Application → Cookies
4. Verify `better-auth.session_token` cookie exists

### 2. CRUD Operations Test
1. Go to HR Management → Directory
2. Try creating a new employee
3. Try editing an existing employee
4. Try deleting an employee
5. All operations should work without errors

### 3. Automated Test (Optional)
1. Open browser console on your deployed app
2. Copy and paste the content from `test-deployment.js`
3. Run the script to automatically test all functionality

## Troubleshooting

### If CRUD Operations Don't Work:

#### Check 1: Environment Variables
- Verify `BETTER_AUTH_URL` in Vercel dashboard
- Ensure it matches your deployed URL exactly
- No trailing slash in the URL

#### Check 2: Browser Cookies
- Open DevTools → Application → Cookies
- Look for `better-auth.session_token`
- If missing, try logging out and logging back in

#### Check 3: Network Requests
- Open DevTools → Network tab
- Try a CRUD operation
- Look for 401 (Unauthorized) or 403 (Forbidden) errors
- Check request headers include cookies

#### Check 4: Vercel Function Logs
- Go to Vercel Dashboard → Your Project → Functions
- Check logs for authentication errors
- Look for any error messages

### Common Issues & Solutions:

#### Issue: 401 Unauthorized
**Solution**: Session cookie not being sent
- Check `BETTER_AUTH_URL` environment variable
- Verify cookie exists in browser
- Try logging out and back in

#### Issue: 403 Forbidden
**Solution**: User doesn't have admin role
- Check user role in database
- Ensure logged-in user has `role: "ADMIN"`

#### Issue: CORS Errors
**Solution**: Cookie domain mismatch
- Verify `BETTER_AUTH_URL` matches deployment URL
- Check for any custom domain configurations

## Success Indicators ✅

When everything works correctly, you should see:
- ✅ Login/logout works
- ✅ Session cookie persists for 7 days
- ✅ All CRUD operations work (Create, Read, Update, Delete)
- ✅ No 401/403 errors in network tab
- ✅ Employee directory loads and functions properly

## Your Code Status ✅

**No Frontend Changes Required**: Your existing code is perfect!
- Employee actions already use proper cookie authentication
- API routes correctly handle authentication
- Frontend components don't need any modifications

The only change needed was the cookie configuration in `auth.ts`, which is now fixed.

## Support

If you still encounter issues:
1. Check Vercel function logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test the automated script in browser console
4. Ensure you're using HTTPS (not HTTP) for the deployed app