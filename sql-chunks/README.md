# Database Setup Instructions

Follow these steps to set up your database schema in Supabase using the SQL Editor:

## Step 1: Access SQL Editor

1. Go to your Supabase project dashboard at https://app.supabase.com
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query" to create a new query

## Step 2: Run SQL Scripts

**Important**: Run the scripts in the numbered order! Each script depends on the previous ones.

1. **01-users.sql** - Creates the `users` table and timestamp function
2. **02-categories.sql** - Creates the `categories` table and adds initial data
3. **03-listings.sql** - Creates the `listings` table
4. **04-reviews.sql** - Creates the `reviews` table
5. **05-offers.sql** - Creates the `offers` table
6. **06-saved-viewed-listings.sql** - Creates `saved_listings` and `viewed_listings` tables
7. **07-conversations.sql** - Creates `conversations`, `conversation_participants`, and `messages` tables
8. **08-notifications-broadcasts.sql** - Creates `notifications` and `broadcasts` tables

For each script:
1. Copy the entire content of the SQL file
2. Paste it into a new SQL Editor query
3. Click "Run" to execute the query
4. Check the output to make sure there are no errors

## Step 3: Set Up Storage Buckets

After setting up the database tables, you need to set up storage buckets:

1. Go to "Storage" in the left sidebar
2. Create three buckets:
   - `listings` (public access)
   - `avatars` (public access)
   - `message-attachments` (private access)
3. Set the appropriate permissions for each bucket

## Step 4: Verify Setup

To verify that everything is set up correctly:

1. Go to "Table Editor" in the left sidebar
2. Check that all tables have been created
3. Try inserting a test user and listing to make sure the relationships work

## Troubleshooting

If you encounter errors:

- Make sure you're running the scripts in the correct order
- Check that the extension `uuid-ossp` is enabled
- Verify that you have the necessary privileges in your Supabase project
- If you get foreign key constraint errors, check that the referenced tables exist 