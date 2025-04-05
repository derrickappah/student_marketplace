// Test file to query conversations directly
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Client
const supabaseUrl = 'https://tcxzmfabevvmglmffjhj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjeHptZmFiZXZ2bWdsbWZmamhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODY1OTE1NzgsImV4cCI6MjAwMjE2NzU3OH0.f1mFBvw-Q0OBvSlFQx5vy0h9kNL_lTZxfkfvOSVKrzE';
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to authenticate user
async function signInUser() {
  try {
    console.log('Attempting to sign in...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'derrickappah@gmail.com',
      password: 'zzzzzzzz',
    });
    
    if (error) {
      console.error('Sign in error:', error);
      return null;
    }
    
    console.log('Sign in successful:', data.user.id);
    return data.user;
  } catch (error) {
    console.error('Error in signInUser:', error);
    return null;
  }
}

// Function to fetch conversations directly
async function fetchConversations(userId) {
  try {
    console.log('Fetching conversations for user:', userId);
    
    // First check if there are any conversations
    const { count, error: countError } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });
    
    console.log('Count result:', { count, error: countError });
    
    if (countError) {
      console.error('Count error:', countError);
      return [];
    }
    
    if (count === 0) {
      console.log('No conversations found');
      return [];
    }
    
    // Try to run the actual query
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants(
          user_id,
          user:users(id, name, avatar_url, email)
        ),
        listing:listings(id, title, price),
        last_message:messages(
          id, content, created_at, sender_id, has_attachments, read_by
        )
      `)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Query error:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.log('No data returned from main query');
      return [];
    }
    
    console.log('Raw conversations data:', data);
    
    // Process conversations
    const processedConversations = data.map(conversation => {
      const otherParticipants = (conversation.participants || [])
        .filter(p => p.user && p.user_id !== userId)
        .map(p => p.user);
      
      return {
        ...conversation,
        otherParticipants,
        last_message: conversation.last_message && conversation.last_message.length > 0 
          ? conversation.last_message[0] 
          : null
      };
    });
    
    console.log('Processed conversations:', processedConversations);
    return processedConversations;
  } catch (err) {
    console.error('Unexpected error:', err);
    return [];
  }
}

// Check database tables function
async function checkDatabaseTables() {
  try {
    // Check if the conversations table exists
    const { data: tablesData, error: tablesError } = await supabase
      .rpc('get_tables');
    
    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
    } else {
      console.log('Database tables:', tablesData);
    }

    // Check conversations table specifically
    console.log('Checking conversations table...');
    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .select('count(*)', { count: 'exact', head: true });
    
    if (convError) {
      console.error('Error checking conversations table:', convError);
    } else {
      console.log('Conversations count:', convData);
    }
    
    // Check conversation_participants table
    console.log('Checking conversation_participants table...');
    const { data: partData, error: partError } = await supabase
      .from('conversation_participants')
      .select('count(*)', { count: 'exact', head: true });
    
    if (partError) {
      console.error('Error checking conversation_participants table:', partError);
    } else {
      console.log('Conversation participants count:', partData);
    }
    
    // Check users table
    console.log('Checking users table...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
      .limit(5);
    
    if (usersError) {
      console.error('Error checking users table:', usersError);
    } else {
      console.log('Sample users:', usersData);
    }
  } catch (err) {
    console.error('Error in checkDatabaseTables:', err);
  }
}

// Create a test conversation
async function createTestConversation(userId) {
  try {
    console.log('Creating a test conversation...');
    
    // Find another user to chat with
    const { data: otherUsers, error: usersError } = await supabase
      .from('users')
      .select('id, name')
      .neq('id', userId)
      .limit(1);
    
    if (usersError || !otherUsers || otherUsers.length === 0) {
      console.error('Error finding other user:', usersError);
      return null;
    }
    
    const otherUserId = otherUsers[0].id;
    console.log('Found other user:', otherUsers[0].name, otherUserId);
    
    // Create a conversation
    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .insert({
        created_by: userId,
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (convError || !convData) {
      console.error('Error creating conversation:', convError);
      return null;
    }
    
    const conversationId = convData[0].id;
    console.log('Created conversation with ID:', conversationId);
    
    // Add participants
    const participants = [
      { conversation_id: conversationId, user_id: userId },
      { conversation_id: conversationId, user_id: otherUserId }
    ];
    
    const { error: partError } = await supabase
      .from('conversation_participants')
      .insert(participants);
    
    if (partError) {
      console.error('Error adding participants:', partError);
      return null;
    }
    
    console.log('Added participants to conversation');
    
    // Add a test message
    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: 'This is a test message'
      });
    
    if (msgError) {
      console.error('Error adding test message:', msgError);
    } else {
      console.log('Added test message to conversation');
    }
    
    return conversationId;
  } catch (err) {
    console.error('Error in createTestConversation:', err);
    return null;
  }
}

// Main function
async function main() {
  // First authenticate
  const user = await signInUser();
  if (!user) {
    console.log('Failed to authenticate. Exiting.');
    return;
  }
  
  // Check database tables
  await checkDatabaseTables();
  
  // Try to fetch conversations
  const conversations = await fetchConversations(user.id);
  console.log('Conversations found:', conversations.length);
  
  // If no conversations, create a test one
  if (conversations.length === 0) {
    console.log('No conversations found. Creating a test conversation...');
    const newConvId = await createTestConversation(user.id);
    if (newConvId) {
      console.log('Test conversation created successfully. Fetching conversations again...');
      const updatedConversations = await fetchConversations(user.id);
      console.log('Updated conversations count:', updatedConversations.length);
    }
  }
}

// Run the main function
main().catch(console.error); 