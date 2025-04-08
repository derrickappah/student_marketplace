const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://ivdsmrlcbhanwafntncx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2ZHNtcmxjYmhhbndhZm50bmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NTUyNTcsImV4cCI6MjA1OTAzMTI1N30.e6fflcrC6rsiiWVoThX_8qTYVcVXCPCSfjI7O_vUesM';

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User credentials
const testUserEmail = "derrickappah@gmail.com";
const testUserPassword = "zzzzzzzz";

async function checkDatabaseStructure() {
  console.log('=== CHECKING DATABASE STRUCTURE ===');
  
  try {
    // 1. Sign in with the provided user credentials
    console.log(`Signing in as ${testUserEmail}...`);
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testUserEmail,
      password: testUserPassword
    });
    
    if (signInError) {
      console.error('Error signing in:', signInError);
      return;
    }
    
    console.log('Successfully signed in as:', signInData.user.id);
    
    // Try to get a list of all tables using a SQL query
    try {
      console.log('\nChecking database tables...');
      const { data: tables, error: tablesError } = await supabase.rpc('get_tables');
      
      if (tablesError) {
        console.error('Error listing tables via RPC:', tablesError);
        
        // Fallback to a direct SQL query
        const { data: sqlTables, error: sqlError } = await supabase.from('pg_tables')
          .select('schemaname, tablename')
          .eq('schemaname', 'public');
          
        if (sqlError) {
          console.error('Error listing tables via SQL:', sqlError);
        } else {
          console.log('Tables in schema (via SQL):', sqlTables);
        }
      } else {
        console.log('Tables in schema (via RPC):', tables);
      }
    } catch (e) {
      console.error('Error while checking tables:', e);
    }
    
    // Now check specific tables we care about
    
    // Users table
    console.log('\nChecking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
      .limit(5);
      
    if (usersError) {
      console.error('Error accessing users table:', usersError);
    } else {
      console.log(`Found ${users.length} users`);
      users.forEach(user => {
        console.log(`- ${user.name} (${user.email}): ${user.id}`);
      });
    }
    
    // Conversations table - simple query
    console.log('\nChecking conversations table...');
    
    const { data: convs, error: convsError } = await supabase
      .from('conversations')
      .select('*')
      .limit(5);
      
    if (convsError) {
      console.error('Error accessing conversations table:', convsError);
      if (convsError.message.includes('recursion detected')) {
        console.log('Recursion error detected! This is a common issue with RLS policies.');
        console.log('Attempting to get table structure using schema introspection...');
        
        // Try using PostgreSQL system catalogs to check the structure
        // Note: This might not work due to RLS as well
        const { data: columns, error: columnsError } = await supabase.from('pg_attribute')
          .select('attname')
          .eq('attrelid', 'conversations'::regclass);
          
        if (columnsError) {
          console.error('Error accessing schema information:', columnsError);
        } else {
          console.log('Conversations table columns:', columns.map(c => c.attname));
        }
      }
    } else {
      console.log(`Found ${convs.length} conversations`);
      if (convs.length > 0) {
        console.log('First conversation fields:', Object.keys(convs[0]));
        console.log('Sample conversation:', convs[0]);
      }
    }
    
    // Conversation Participants - simple query
    console.log('\nChecking conversation_participants table...');
    
    const { data: parts, error: partsError } = await supabase
      .from('conversation_participants')
      .select('*')
      .limit(5);
      
    if (partsError) {
      console.error('Error accessing conversation_participants table:', partsError);
    } else {
      console.log(`Found ${parts.length} participant entries`);
      if (parts.length > 0) {
        console.log('Participant fields:', Object.keys(parts[0]));
        console.log('Sample participant entry:', parts[0]);
      }
    }
    
    // Messages - simple query
    console.log('\nChecking messages table...');
    
    const { data: msgs, error: msgsError } = await supabase
      .from('messages')
      .select('*')
      .limit(5);
      
    if (msgsError) {
      console.error('Error accessing messages table:', msgsError);
    } else {
      console.log(`Found ${msgs.length} messages`);
      if (msgs.length > 0) {
        console.log('Message fields:', Object.keys(msgs[0]));
        console.log('Sample message:', msgs[0]);
      }
    }
    
    // Listings - simple query
    console.log('\nChecking listings table...');
    
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('*')
      .limit(5);
      
    if (listingsError) {
      console.error('Error accessing listings table:', listingsError);
    } else {
      console.log(`Found ${listings.length} listings`);
      if (listings.length > 0) {
        console.log('Listing fields:', Object.keys(listings[0]));
        console.log('Checking if image_url field exists:', listings[0].hasOwnProperty('image_url'));
      }
    }
    
    console.log('\n=== DATABASE STRUCTURE CHECK COMPLETED ===');
    
  } catch (err) {
    console.error('Unexpected error during database structure check:', err);
  }
}

checkDatabaseStructure().catch(console.error); 