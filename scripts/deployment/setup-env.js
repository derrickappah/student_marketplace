const fs = require('fs');

// Supabase credentials
const supabaseUrl = 'https://ivdsmrlcbhanwafntncx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2ZHNtcmxjYmhhbndhZm50bmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NTUyNTcsImV4cCI6MjA1OTAzMTI1N30.e6fflcrC6rsiiWVoThX_8qTYVcVXCPCSfjI7O_vUesM';

// Create .env.local file
const envContent = `# Supabase Configuration
REACT_APP_SUPABASE_URL=${supabaseUrl}
REACT_APP_SUPABASE_ANON_KEY=${supabaseKey}
`;

fs.writeFileSync('.env.local', envContent);

console.log('Created .env.local file with Supabase credentials');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey.substring(0, 10) + '...');
console.log('\nYou can now run your application with:');
console.log('npm start'); 