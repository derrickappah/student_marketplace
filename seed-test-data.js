const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://ivdsmrlcbhanwafntncx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2ZHNtcmxjYmhhbndhZm50bmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NTUyNTcsImV4cCI6MjA1OTAzMTI1N30.e6fflcrC6rsiiWVoThX_8qTYVcVXCPCSfjI7O_vUesM';

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const diagnoseDatabaseConnection = async () => {
  console.log('Diagnose database connection and check tables structure...');
  
  try {
    // Check tables exist
    console.log('\nChecking tables:');
    const tables = ['users', 'listings', 'conversations', 'conversation_participants', 'messages'];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error(`  ❌ Error checking '${table}' table:`, error);
        } else {
          console.log(`  ✅ Table '${table}' exists and has ${count} rows`);
        }
      } catch (err) {
        console.error(`  ❌ Error checking '${table}' table:`, err);
      }
    }
    
    // Check for existing users
    console.log('\nLooking for existing users:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name')
      .limit(5);
    
    if (usersError) {
      console.error('  ❌ Error getting users:', usersError);
    } else if (users && users.length > 0) {
      console.log(`  ✅ Found ${users.length} users in the database:`);
      users.forEach(user => console.log(`    - ${user.name} (${user.email}): ${user.id}`));
      console.log('\nYou can use these user IDs for testing the messaging functionality.');
    } else {
      console.log('  ⚠️ No users found in the database');
      console.log('  You will need to register a user to test the messaging functionality');
    }
    
    // Check for existing conversations
    console.log('\nLooking for existing conversations:');
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select(`
        id, 
        created_at,
        participants:conversation_participants(user_id)
      `)
      .limit(5);
    
    if (convError) {
      console.error('  ❌ Error getting conversations:', convError);
    } else if (conversations && conversations.length > 0) {
      console.log(`  ✅ Found ${conversations.length} conversations in the database:`);
      conversations.forEach(conv => {
        const participantIds = conv.participants.map(p => p.user_id);
        console.log(`    - ID: ${conv.id}, Participants: ${participantIds.join(', ')}`);
      });
    } else {
      console.log('  ⚠️ No conversations found in the database');
    }
    
    // Check for existing messages
    console.log('\nLooking for existing messages:');
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, content')
      .limit(5);
    
    if (msgError) {
      console.error('  ❌ Error getting messages:', msgError);
    } else if (messages && messages.length > 0) {
      console.log(`  ✅ Found ${messages.length} messages in the database:`);
      messages.forEach(msg => {
        console.log(`    - ID: ${msg.id}, From: ${msg.sender_id}, Content: ${msg.content.substring(0, 30)}${msg.content.length > 30 ? '...' : ''}`);
      });
    } else {
      console.log('  ⚠️ No messages found in the database');
    }
    
    console.log('\nDatabase diagnosis complete!');
    
  } catch (err) {
    console.error('Unexpected error during diagnosis:', err);
  }
};

diagnoseDatabaseConnection().catch(console.error); 