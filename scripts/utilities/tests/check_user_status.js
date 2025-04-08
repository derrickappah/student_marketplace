require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkUserStatus() {
  // Initialize Supabase client
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get the first 10 users and their status
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, status')
      .limit(10);
    
    if (error) {
      throw error;
    }
    
    if (!users || users.length === 0) {
      console.log('No users found in the database.');
      return;
    }
    
    console.log('User Status Check:');
    console.log('-----------------');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'Unknown'} (${user.email})`);
      console.log(`   Status: ${user.status || 'NULL'}`);
      console.log(`   ID: ${user.id}`);
      console.log('-----------------');
    });
    
    // Get status counts
    const statuses = users.reduce((acc, user) => {
      const status = user.status || 'NULL';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nStatus Distribution:');
    Object.entries(statuses).forEach(([status, count]) => {
      console.log(`${status}: ${count} users`);
    });
    
    // Test updating a user's status
    if (users.length > 0) {
      const testUser = users[0];
      const newStatus = testUser.status === 'active' ? 'suspended' : 'active';
      
      console.log(`\nTesting status update for user: ${testUser.name || testUser.email}`);
      console.log(`Changing status from "${testUser.status}" to "${newStatus}"...`);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', testUser.id);
      
      if (updateError) {
        console.error('Error updating status:', updateError.message);
      } else {
        console.log('Status updated successfully!');
        
        // Verify the update
        const { data: updatedUser, error: verifyError } = await supabase
          .from('users')
          .select('status')
          .eq('id', testUser.id)
          .single();
        
        if (verifyError) {
          console.error('Error verifying update:', verifyError.message);
        } else {
          console.log(`Verified new status: "${updatedUser.status}"`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error checking user status:', error);
  }
}

checkUserStatus(); 