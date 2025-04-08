const { supabase } = require('../src/services/supabase');

const createContactMessagesTable = async () => {
  console.log('Creating contact_messages table in Supabase...');

  try {
    // Attempt to insert a test record to see if the table exists
    const { error: testError } = await supabase
      .from('contact_messages')
      .select('id')
      .limit(1);
    
    // If no error or error is not about missing table, then table exists
    if (!testError || testError.code !== '42P01') {
      console.log('contact_messages table already exists or can be accessed.');
      return { success: true, message: 'Table already exists or can be accessed' };
    }
    
    console.log('Table does not exist, attempting to create...');

    // Attempt to create the table via RPC function
    console.log('Attempting to use RPC function to create table...');
    const { error: createTableError } = await supabase
      .rpc('create_contact_messages_table_sql');

    if (createTableError) {
      console.error('Error creating table via RPC:', createTableError);
      
      // Display manual creation instructions
      console.log('You need to manually create the table in the Supabase console with the following SQL:');
      console.log(`
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  topic TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES auth.users(id)
);

-- Set up Row Level Security
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Admin users can see all messages
CREATE POLICY "Admins can see all contact messages"
  ON public.contact_messages
  FOR SELECT 
  TO authenticated
  USING (auth.jwt() ? 'is_admin');

-- Admin users can insert and update messages
CREATE POLICY "Admins can insert and update contact messages"
  ON public.contact_messages
  FOR ALL
  TO authenticated
  USING (auth.jwt() ? 'is_admin');

-- Anonymous users can insert messages
CREATE POLICY "Anyone can submit contact messages"
  ON public.contact_messages
  FOR INSERT
  TO anon
  WITH CHECK (true);
`);
      return { success: false, error: 'Table creation failed, manual setup required' };
    }

    console.log('Successfully created contact_messages table');
    return { success: true };
  } catch (error) {
    console.error('Error in createContactMessagesTable:', error);
    return { success: false, error: error.message };
  }
};

// Function to create an RPC function for creating the table
const createRpcFunction = async () => {
  console.log('Creating RPC function for table creation...');
  
  try {
    // This would require admin privileges and is better done in the Supabase dashboard
    console.log(`
To create the RPC function, please go to the Supabase dashboard and execute the following SQL:

CREATE OR REPLACE FUNCTION create_contact_messages_table_sql()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    topic TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'new',
    notes TEXT,
    responded_at TIMESTAMPTZ,
    responded_by UUID REFERENCES auth.users(id)
  );
  
  -- Set up Row Level Security
  ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
  
  -- Create policies
  -- Admin users can see all messages
  DROP POLICY IF EXISTS "Admins can see all contact messages" ON public.contact_messages;
  CREATE POLICY "Admins can see all contact messages"
    ON public.contact_messages
    FOR SELECT 
    TO authenticated
    USING (auth.jwt() ? 'is_admin');
  
  -- Admin users can insert and update messages
  DROP POLICY IF EXISTS "Admins can insert and update contact messages" ON public.contact_messages;
  CREATE POLICY "Admins can insert and update contact messages"
    ON public.contact_messages
    FOR ALL
    TO authenticated
    USING (auth.jwt() ? 'is_admin');
  
  -- Anonymous users can insert messages
  DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;
  CREATE POLICY "Anyone can submit contact messages"
    ON public.contact_messages
    FOR INSERT
    TO anon
    WITH CHECK (true);
    
  RETURN TRUE;
END;
$$;
`);
    
    return { success: true, message: 'RPC function creation instructions displayed' };
  } catch (error) {
    console.error('Error in createRpcFunction:', error);
    return { success: false, error: error.message };
  }
};

// Test if we can directly create the contact_messages table
const testDirectTableCreation = async () => {
  console.log('Testing direct table creation attempt...');
  try {
    // Try inserting a test record to see if the table exists or can be created
    const { error: insertError } = await supabase
      .from('contact_messages')
      .insert([
        {
          name: 'Test User',
          email: 'test@example.com',
          topic: 'general',
          message: 'Test message',
          created_at: new Date().toISOString(),
          status: 'new'
        }
      ]);
    
    if (!insertError) {
      console.log('Successfully inserted test record, table exists!');
      return { success: true };
    }
    
    console.log('Insert test result:', insertError);
    return { success: false, error: insertError };
  } catch (error) {
    console.error('Error in testDirectTableCreation:', error);
    return { success: false, error: error.message };
  }
};

// Main function to run all setup operations
const setupDatabase = async () => {
  console.log('Starting database setup...');
  
  // Display RPC function creation instructions
  await createRpcFunction();
  
  // Create contact_messages table
  const result = await createContactMessagesTable();
  
  // If table creation failed, try a direct insertion test
  if (!result.success) {
    console.log('Attempting alternative approach...');
    const testResult = await testDirectTableCreation();
    
    if (testResult.success) {
      console.log('Database setup completed successfully via alternative method!');
      process.exit(0);
      return;
    }
  } else {
    console.log('Database setup completed successfully!');
    process.exit(0);
    return;
  }
  
  console.log('Please follow the manual instructions above to create the table in the Supabase dashboard.');
  process.exit(1);
};

// Run the setup
setupDatabase(); 