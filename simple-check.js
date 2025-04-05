const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://ivdsmrlcbhanwafntncx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2ZHNtcmxjYmhhbndhZm50bmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NTUyNTcsImV4cCI6MjA1OTAzMTI1N30.e6fflcrC6rsiiWVoThX_8qTYVcVXCPCSfjI7O_vUesM';

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function simpleTableCheck() {
  console.log('=== SIMPLE DATABASE CHECK ===');
  
  try {
    // 1. Check users table with a simple count
    console.log('Checking users table...');
    try {
      const { count: userCount, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
        
      if (countError) {
        console.error('Error counting users:', countError);
      } else {
        console.log(`Users table contains ${userCount} rows`);
      }
    } catch (e) {
      console.error('Error with users table:', e);
    }

    // 2. Check conversations table with a simple count
    console.log('\nChecking conversations table...');
    try {
      const { count: convCount, error: convError } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true });
        
      if (convError) {
        console.error('Error counting conversations:', convError);
      } else {
        console.log(`Conversations table contains ${convCount} rows`);
      }
    } catch (e) {
      console.error('Error with conversations table:', e);
    }

    // 3. Check conversation_participants table with a simple count
    console.log('\nChecking conversation_participants table...');
    try {
      const { count: partCount, error: partError } = await supabase
        .from('conversation_participants')
        .select('*', { count: 'exact', head: true });
        
      if (partError) {
        console.error('Error counting participants:', partError);
      } else {
        console.log(`Conversation_participants table contains ${partCount} rows`);
      }
    } catch (e) {
      console.error('Error with conversation_participants table:', e);
    }

    // 4. Check messages table with a simple count
    console.log('\nChecking messages table...');
    try {
      const { count: msgCount, error: msgError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });
        
      if (msgError) {
        console.error('Error counting messages:', msgError);
      } else {
        console.log(`Messages table contains ${msgCount} rows`);
      }
    } catch (e) {
      console.error('Error with messages table:', e);
    }

    // 5. Check listings table with a simple count
    console.log('\nChecking listings table...');
    try {
      const { count: listingCount, error: listingError } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true });
        
      if (listingError) {
        console.error('Error counting listings:', listingError);
      } else {
        console.log(`Listings table contains ${listingCount} rows`);
      }
    } catch (e) {
      console.error('Error with listings table:', e);
    }
    
    // Try a simple query to check if the listings table has an image_url column
    console.log('\nChecking columns in listings table...');
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('id, title')
        .limit(1);
        
      if (error) {
        console.error('Error querying listings:', error);
      } else if (data && data.length > 0) {
        console.log('Available columns in first listing:', Object.keys(data[0]));
      } else {
        console.log('No listings found to check columns');
      }
    } catch (e) {
      console.error('Error checking listing columns:', e);
    }
    
    console.log('\n=== SIMPLE CHECK COMPLETED ===');
    
  } catch (err) {
    console.error('General error during database check:', err);
  }
}

simpleTableCheck().catch(console.error); 