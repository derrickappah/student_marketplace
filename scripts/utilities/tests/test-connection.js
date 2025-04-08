const { createClient } = require('@supabase/supabase-js');

// Supabase configuration - must match with what's in supabaseClient.js
const supabaseUrl = 'https://ivdsmrlcbhanwafntncx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2ZHNtcmxjYmhhbndhZm50bmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NTUyNTcsImV4cCI6MjA1OTAzMTI1N30.e6fflcrC6rsiiWVoThX_8qTYVcVXCPCSfjI7O_vUesM';

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const testConnection = async () => {
  console.log(`Connecting to Supabase at: ${supabaseUrl}`);
  
  try {
    // Check listings table structure
    console.log("\nChecking listings table structure...");
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('*')
      .limit(1);
      
    if (listingsError) {
      console.error("Error querying listings:", listingsError);
    } else {
      console.log("Listings table available!");
      if (listings.length > 0) {
        console.log("Listing fields:", Object.keys(listings[0]));
      } else {
        console.log("No listings found in the database");
      }
    }
    
    // Test with a simpler conversations query
    console.log("\nTesting simplified conversation query...");
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants(
          user_id
        )
      `)
      .limit(3);
    
    if (convError) {
      console.error("Error querying conversations (simple):", convError);
    } else {
      console.log("Simple conversation query successful!");
      console.log(`Retrieved ${conversations?.length || 0} conversations`);
      
      if (conversations && conversations.length > 0) {
        console.log("Conversation fields:", Object.keys(conversations[0]));
      }
    }
    
    // Try conversation query with related tables but no image_url field
    console.log("\nTrying modified conversations query...");
    const { data: convWithRelations, error: relError } = await supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants(
          user_id,
          user:users(id, name, avatar_url, email)
        ),
        listing:listings(id, title, price, description),
        last_message:messages(
          id, content, created_at, sender_id, has_attachments, read_by
        )
      `)
      .limit(2);
    
    if (relError) {
      console.error("Error with modified conversation query:", relError);
    } else {
      console.log("Modified conversation query successful!");
      if (convWithRelations && convWithRelations.length > 0) {
        console.log("First conversation has the following participants:", convWithRelations[0].participants?.length || 0);
      }
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
};

testConnection().catch(console.error); 