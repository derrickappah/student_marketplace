# Supabase Edge Functions for Real-Time Messaging

This directory contains Edge Functions for enhancing the real-time messaging capabilities of the application.

## Functions Included

1. **api-set-offline.js** - Handles the `navigator.sendBeacon` requests to mark users as offline when they leave the page.

## Deployment Instructions

To deploy these functions to your Supabase project:

1. Install the Supabase CLI if you haven't already:
```bash
npm install -g supabase
```

2. Login to your Supabase account:
```bash
supabase login
```

3. Link your project (if not already linked):
```bash
supabase link --project-ref <your-project-id>
```

4. Deploy a specific function:
```bash
supabase functions deploy api-set-offline --no-verify-jwt
```

The `--no-verify-jwt` flag allows the endpoint to be called without authentication, which is necessary for the `sendBeacon` API.

## Environment Variables

The functions require the following environment variables to be set in your Supabase dashboard:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

To set these variables:

1. Go to your Supabase dashboard
2. Navigate to Settings > API
3. Copy the URL and service role key
4. Navigate to Settings > Functions
5. Add the environment variables with their respective values

## Testing

You can test the functions using cURL:

```bash
curl -X POST 'https://<your-project-id>.supabase.co/functions/v1/api-set-offline' \
  -H 'Content-Type: application/json' \
  -d '{"conversation_id": "your-conversation-id", "user_id": "your-user-id"}'
```

## Security Considerations

- The `api-set-offline` function doesn't require authentication to handle browser close events properly.
- Only the necessary data is accepted and validated to prevent misuse.
- The function uses the service role key internally, which bypasses RLS policies, so input validation is critical. 