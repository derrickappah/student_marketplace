const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://ivdsmrlcbhanwafntncx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2ZHNtcmxjYmhhbndhZm50bmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NTUyNTcsImV4cCI6MjA1OTAzMTI1N30.e6fflcrC6rsiiWVoThX_8qTYVcVXCPCSfjI7O_vUesM';

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User credentials provided by the user
const testUserEmail = "derrickappah@gmail.com";
const testUserPassword = "zzzzzzzz";

// User IDs we know exist from our diagnostics
const userId1 = '2f73081f-28a3-4355-8a9f-35d93079d60b'; // derrickappah@gmail.com (the user we'll sign in as)
const userId2 = '72d28dad-c9b5-4ca3-8f54-396bdbe9b374'; // samuelowusuobiri2005@gmail.com (participant)

const createTestConversation = async () => {
  console.log('Creating test conversation between users...');
  
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
    const authenticatedUserId = signInData.user.id;
    
    // 2. Try to directly create a message to a user to test the UI
    console.log('\nAttempting to create a direct message in the database...');
    
    // First check if any conversations already exist (as a sanity check)
    const { data: existingConvs, error: existingError } = await supabase
      .from('conversations')
      .select('id, created_at')
      .limit(5);
      
    if (existingError) {
      console.error('Error checking for existing conversations:', existingError);
    } else {
      console.log(`Found ${existingConvs.length} existing conversations:`);
      existingConvs.forEach(conv => console.log(`- ${conv.id} (created: ${new Date(conv.created_at).toLocaleString()})`));
    }
    
    // Try to create a conversation with listing_id as null (direct message)
    console.log('\nCreating direct message conversation...');
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .insert([{
        listing_id: null // Explicitly set to null for direct message
      }])
      .select();
      
    if (conversationError) {
      console.error('Error creating conversation:', conversationError);
      
      // If this fails, try an even simpler insert
      console.log('\nTrying minimal insert...');
      const { data: simpleConv, error: simpleError } = await supabase
        .from('conversations')
        .insert([{}])
        .select();
        
      if (simpleError) {
        console.error('Error with minimal insert:', simpleError);
        return;
      } else {
        console.log('Created conversation with minimal data:', simpleConv[0].id);
        
        // Use this conversation
        conversation = simpleConv;
      }
    } else {
      console.log('Conversation created with ID:', conversation[0].id);
    }
    
    // Wait a second before adding participants
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. Add the authenticated user as a participant first
    console.log('\nAdding authenticated user as participant...');
    const { error: ownerError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: conversation[0].id, user_id: authenticatedUserId }
      ]);
      
    if (ownerError) {
      console.error('Error adding authenticated user as participant:', ownerError);
    } else {
      console.log('Authenticated user added as participant');
    }
    
    // Wait a second before adding the other participant
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 4. Add the other user as a participant
    console.log('\nAdding other user as participant...');
    const { error: otherError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: conversation[0].id, user_id: userId2 }
      ]);
      
    if (otherError) {
      console.error('Error adding other user as participant:', otherError);
    } else {
      console.log('Other user added as participant');
    }
    
    // Wait a second before adding a message
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 5. Add a test message
    console.log('\nAdding test message...');
    const { error: messageError } = await supabase
      .from('messages')
      .insert([{
        conversation_id: conversation[0].id,
        sender_id: authenticatedUserId,
        content: 'This is a test message to fix the "Failed to load conversations" error.',
        read_by: [authenticatedUserId]
      }]);
      
    if (messageError) {
      console.error('Error adding test message:', messageError);
    } else {
      console.log('Test message added successfully!');
    }
    
    console.log('\n✅ Test complete!');
    console.log('Even if not all operations succeeded, check the app to see if the "Failed to load conversations" error is resolved.');
    console.log('You may need to refresh the app or log out and back in to see the changes.');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
};

createTestConversation().catch(console.error); 