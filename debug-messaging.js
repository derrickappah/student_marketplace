const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://ivdsmrlcbhanwafntncx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2ZHNtcmxjYmhhbndhZm50bmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NTUyNTcsImV4cCI6MjA1OTAzMTI1N30.e6fflcrC6rsiiWVoThX_8qTYVcVXCPCSfjI7O_vUesM';

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User credentials
const testUserEmail = "derrickappah@gmail.com";
const testUserPassword = "zzzzzzzz";

async function debugMessagingContext() {
  console.log('=== DEBUGGING MESSAGING CONTEXT ===');
  
  try {
    // 1. Sign in with the provided user credentials
    console.log(`Attempting to sign in as ${testUserEmail}...`);
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testUserEmail,
      password: testUserPassword
    });
    
    if (signInError) {
      console.error('Error signing in:', signInError);
      return;
    }
    
    console.log('Successfully signed in as:', signInData.user.id);
    const userId = signInData.user.id;
    
    // 2. Try to fetch conversations with detailed logging
    console.log('\nFetching conversations with the same query used in MessagingContext...');
    console.log('Query structure:');
    console.log(`
- From: conversations
- Select: 
  * all fields
  * participants:conversation_participants(user_id, user:users(id, name, avatar_url, email))
  * listing:listings(id, title, price, image_url)
  * last_message:messages(id, content, created_at, sender_id, has_attachments, read_by)
- Order by: updated_at descending
    `);
    
    // First, check if the conversations table exists and has the right structure
    console.log('\nChecking conversations table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Error accessing conversations table:', tableError);
      
      // Check if this is a schema issue
      if (tableError.message.includes('does not exist') || tableError.message.includes('schema cache')) {
        console.log('\nSchema issue detected. Checking available tables...');
        const { data: tableList } = await supabase.rpc('get_tables');
        console.log('Available tables:', tableList || 'Unable to retrieve table list');
      }
    } else {
      console.log('Conversations table exists and is accessible');
      console.log('First conversation fields:', Object.keys(tableInfo[0] || {}));
    }
    
    // Now try the actual query from the MessagingContext
    console.log('\nExecuting full query from MessagingContext...');
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants(
          user_id,
          user:users(id, name, avatar_url, email)
        ),
        listing:listings(id, title, price, image_url),
        last_message:messages(
          id, content, created_at, sender_id, has_attachments, read_by
        )
      `)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching conversations:', error);
      
      if (error.message.includes('recursion detected')) {
        console.log('\nRecursion error detected, this might be due to:');
        console.log('1. RLS policies creating circular references');
        console.log('2. No conversations exist yet in the database');
        console.log('3. The relationships between tables are not set up correctly');
        
        // Check if any conversations exist at all
        console.log('\nChecking if any conversations exist...');
        const { data: simpleConvData, error: simpleConvError } = await supabase
          .from('conversations')
          .select('id')
          .limit(5);
        
        if (simpleConvError) {
          console.error('Error checking conversations:', simpleConvError);
        } else {
          console.log(`Found ${simpleConvData.length} conversations:`, simpleConvData);
        }
        
        // Check if conversation_participants table is accessible
        console.log('\nChecking conversation_participants table...');
        const { data: partData, error: partError } = await supabase
          .from('conversation_participants')
          .select('*')
          .limit(5);
        
        if (partError) {
          console.error('Error accessing conversation_participants:', partError);
        } else {
          console.log(`Found ${partData.length} participant entries:`, partData);
        }
      }
    } else {
      console.log('Successfully fetched conversations!');
      console.log(`Found ${data.length} conversations`);
      
      if (data.length > 0) {
        console.log('First conversation:', {
          id: data[0].id,
          created_at: data[0].created_at,
          updated_at: data[0].updated_at,
          participants: data[0].participants?.length || 0,
          has_listing: !!data[0].listing,
          has_messages: data[0].last_message?.length > 0
        });
      }
    }
    
    // 3. Check user access and permissions
    console.log('\nChecking current user profile...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('Error fetching user profile:', userError);
    } else {
      console.log('User profile found:', {
        id: userData.id,
        name: userData.name,
        email: userData.email
      });
    }
    
    console.log('\n=== DEBUGGING COMPLETED ===');
    
  } catch (err) {
    console.error('Unexpected error during debugging:', err);
  }
}

debugMessagingContext().catch(console.error); 