@echo off
echo Running simplified promotion stats fix...

node -e "const { createClient } = require('@supabase/supabase-js'); const fs = require('fs'); require('dotenv').config(); const supabaseUrl = process.env.SUPABASE_URL; const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; if (!supabaseKey) { console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required.'); process.exit(1); } const supabase = createClient(supabaseUrl, supabaseKey); async function applySql() { try { const sql = fs.readFileSync('fix_promotion_stats_simple.sql', 'utf8'); console.log('📊 Applying promotion stats fix...'); const { error } = await supabase.rpc('exec_sql', { sql_query: sql }); if (error) { console.error('❌ Error:', error.message); } else { console.log('✅ Fix applied successfully!'); console.log('\n🔍 Testing the function...'); const { data, error: statsError } = await supabase.rpc('get_promotion_stats_cached'); if (statsError) { console.error('❌ Error testing function:', statsError.message); } else { console.log('✅ Function works! Stats:', data); } } } catch (error) { console.error('❌ Unexpected error:', error.message); } } applySql();"

echo.
echo Press any key to exit...
pause > nul 