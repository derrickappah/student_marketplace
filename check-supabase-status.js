const { createClient } = require('@supabase/supabase-js');
const https = require('https');

// Supabase configuration
const supabaseUrl = 'https://ivdsmrlcbhanwafntncx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2ZHNtcmxjYmhhbndhZm50bmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NTUyNTcsImV4cCI6MjA1OTAzMTI1N30.e6fflcrC6rsiiWVoThX_8qTYVcVXCPCSfjI7O_vUesM';

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSupabaseStatus() {
  console.log('=== CHECKING SUPABASE SERVICE STATUS ===');
  
  // 1. Check if the Supabase endpoint is reachable
  console.log('\nTesting Supabase endpoint connectivity...');
  try {
    await new Promise((resolve, reject) => {
      const req = https.get(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json'
        }
      }, (res) => {
        console.log(`Supabase endpoint response status: ${res.statusCode}`);
        console.log(`Response headers:`, res.headers);
        
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (data) {
            try {
              console.log('Response data:', JSON.parse(data));
            } catch (e) {
              console.log('Response data (not JSON):', data);
            }
          }
          resolve();
        });
      });
      
      req.on('error', (err) => {
        console.error('Error making request:', err);
        reject(err);
      });
      
      req.end();
    });
  } catch (err) {
    console.error('Failed to connect to Supabase endpoint:', err);
  }
  
  // 2. Try a simple health check query
  console.log('\nTesting Supabase client health with a simple query...');
  try {
    const start = Date.now();
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    const end = Date.now();
    
    console.log(`Query response time: ${end - start}ms`);
    
    if (error) {
      console.error('Query error:', error);
      
      // Check if it's a 503 error
      if (error.code === '503') {
        console.log('\nDetected 503 Service Unavailable error.');
        console.log('This typically means:');
        console.log('1. The database is paused (free tier projects pause after inactivity)');
        console.log('2. The database is overloaded or experiencing issues');
      }
    } else {
      console.log('Query successful:', data);
    }
  } catch (err) {
    console.error('Error executing test query:', err);
  }
  
  // 3. Check if auth service is working
  console.log('\nTesting Supabase auth service...');
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth service error:', error);
    } else {
      console.log('Auth service response:', data ? 'Success' : 'No session');
    }
  } catch (err) {
    console.error('Error accessing auth service:', err);
  }
  
  console.log('\n=== STATUS CHECK COMPLETED ===');
  console.log('\nRECOMMENDATIONS:');
  console.log('1. If you received 503 errors, check if your Supabase project is paused in the Supabase dashboard');
  console.log('2. Try restarting your Supabase project from the dashboard if it\'s unresponsive');
  console.log('3. If on the free tier, make sure you haven\'t exceeded usage limits');
  console.log('4. Check https://status.supabase.com/ for any ongoing service issues');
}

checkSupabaseStatus().catch(console.error); 