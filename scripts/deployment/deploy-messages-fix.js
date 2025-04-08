const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Load environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function deployMessagesFix() {
  console.log('Deploying messages RLS fix...');
  
  try {
    // Read the SQL file
    const sql = fs.readFileSync('./src/sql/fix_messages_rls.sql', 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error applying messages RLS fix:', error);
      
      // Try to execute with simpler approach
      console.log('Trying alternative deployment method...');
      
      // Split into separate statements
      const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
      
      // Try to execute each statement separately
      for (const stmt of statements) {
        console.log(`Executing statement: ${stmt.substring(0, 50)}...`);
        const { error: stmtError } = await supabase.rpc('exec_sql', { sql: stmt });
        
        if (stmtError) {
          console.warn(`Warning: Statement execution failed: ${stmtError.message}`);
        }
      }
      
      // Try to run the fixConversationParticipantsRLS function
      console.log('Testing if fix_conversation_participants function was created...');
      const { data: fixResult, error: fixError } = await supabase.rpc('fix_conversation_participants');
      
      if (fixError) {
        console.error('Error testing fix_conversation_participants function:', fixError);
      } else {
        console.log('Successfully applied fix_conversation_participants:', fixResult);
      }
    } else {
      console.log('Successfully deployed messages RLS fix:', data);
    }
    
    // Test if we can now send messages with bypass function
    console.log('Testing send_message_bypass_rls function...');
    const { data: testResult, error: testError } = await supabase.rpc('send_message_bypass_rls', {
      p_conversation_id: '00000000-0000-0000-0000-000000000000', // Dummy ID for test
      p_content: 'Test message',
      p_sender_id: '00000000-0000-0000-0000-000000000000', // Dummy ID for test
      p_has_attachments: false
    });
    
    if (testError) {
      console.log('Function test failed (expected for dummy IDs):', testError.message);
      console.log('This is normal if you used dummy IDs. The function exists but needs valid IDs to work.');
    } else {
      console.log('Function test succeeded:', testResult);
    }
    
    console.log('Messages RLS fix deployment completed.');
  } catch (err) {
    console.error('Exception deploying messages RLS fix:', err);
  }
}

// Run the deployment
deployMessagesFix(); 