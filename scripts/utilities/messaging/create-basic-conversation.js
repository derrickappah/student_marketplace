const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://ivdsmrlcbhanwafntncx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2ZHNtcmxjYmhhbndhZm50bmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NTUyNTcsImV4cCI6MjA1OTAzMTI1N30.e6fflcrC6rsiiWVoThX_8qTYVcVXCPCSfjI7O_vUesM';

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User credentials
const testUserEmail = "derrickappah@gmail.com";
const testUserPassword = "zzzzzzzz";

// User IDs 
const userId1 = '2f73081f-28a3-4355-8a9f-35d93079d60b'; // derrickappah@gmail.com (as confirmed in previous tests)
const userId2 = '72d28dad-c9b5-4ca3-8f54-396bdbe9b374'; // samuelowusuobiri2005@gmail.com

async function createBasicConversation() {
  console.log('=== CREATING BASIC CONVERSATION ===');
  
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
    const userId = signInData.user.id;
    
    // 2. Create conversation with administrator context
    console.log('\nAttempting to create conversation with service role (bypassing RLS)...');
    
    // This is a simpler approach - first check if any conversations exist
    console.log('Checking if any conversations already exist...');
    
    const { data: existingConversations, error: checkError } = await supabase
      .from('conversations')
      .select('id')
      .limit(5);
      
    if (checkError) {
      console.error('Error checking for existing conversations:', checkError);
    } else {
      console.log(`Found ${existingConversations?.length || 0} existing conversations`);
      
      if (existingConversations && existingConversations.length > 0) {
        console.log('Existing conversation IDs:', existingConversations.map(c => c.id));
      }
    }
    
    // RPC is another option to bypass RLS issues
    console.log('\nTrying to create conversation via RPC...');
    console.log('Checking if create_conversation function exists...');
    
    // First try a direct insert - sometimes this works when the join queries don't
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert([
        { created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ])
      .select()
      .single();
      
    if (createError) {
      console.error('Error creating conversation via direct insert:', createError);
    } else {
      console.log('Successfully created conversation:', newConversation);
      const conversationId = newConversation.id;
      
      // 3. Add participants one at a time
      console.log('\nAdding first participant (current user)...');
      const { data: part1, error: part1Error } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversationId, user_id: userId }
        ]);
        
      if (part1Error) {
        console.error('Error adding first participant:', part1Error);
      } else {
        console.log('Added first participant');
        
        // Add second participant
        console.log('Adding second participant...');
        const { data: part2, error: part2Error } = await supabase
          .from('conversation_participants')
          .insert([
            { conversation_id: conversationId, user_id: userId2 }
          ]);
          
        if (part2Error) {
          console.error('Error adding second participant:', part2Error);
        } else {
          console.log('Added second participant');
        }
      }
      
      // 4. Add a test message
      console.log('\nAdding a test message...');
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: conversationId,
            sender_id: userId,
            content: 'This is a test message created at ' + new Date().toLocaleString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
        
      if (messageError) {
        console.error('Error adding message:', messageError);
      } else {
        console.log('Successfully added test message');
      }
    }
    
    console.log('\n=== CREATION ATTEMPT COMPLETED ===');
    
  } catch (err) {
    console.error('Unexpected error during conversation creation:', err);
  }
}

createBasicConversation().catch(console.error); 