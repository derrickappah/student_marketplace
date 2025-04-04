# SQL Scripts for Database Fixes

This directory contains SQL scripts to fix various issues with the database.

## Fixing the `get_promotion_stats_cached` Function Error

If you're seeing this error:
```
POST https://ivdsmrlcbhanwafntncx.supabase.co/rest/v1/rpc/get_promotion_stats_cached 404 (Not Found)
```

Or this error:
```
Error with get_promotion_stats_cached: {
  code: 'PGRST202', 
  details: 'Searched for the function public.get_promotion_stats_cached, but no matches were found in the schema cache.', 
  hint: 'Perhaps you meant to call the function public.get_promotion_stats', 
  message: 'Could not find the function public.get_promotion_stats_cached without parameters in the schema cache'
}
```

### Solution:

1. **Deploy the fix script:**

   Execute the `deploy_promotion_stats_cached.sql` file in your Supabase SQL editor or via the Supabase CLI:

   ```bash
   # Using Supabase CLI
   supabase db execute < src/sql/deploy_promotion_stats_cached.sql
   ```

   Or copy and paste the contents into the Supabase SQL editor in the web interface.

2. **Code changes:**

   We've also updated `ListingPromotionApprovals.js` to better handle this error, with a graceful fallback to the base `get_promotion_stats` function in case the cached version isn't available.

### What the fix does:

1. Checks if the base `get_promotion_stats` function exists and creates it if needed
2. Creates or replaces the `get_promotion_stats_cached` function
3. Sets appropriate permissions for both functions
4. Updates the JavaScript code to handle errors more gracefully

### Further improvements:

To optimize performance in the future, consider enhancing the `get_promotion_stats_cached` function to use a materialized view or cache table that updates periodically, rather than calculating the statistics on each request. 