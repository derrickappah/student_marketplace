@echo off
echo Creating test promotion data...

node -e "const { createClient } = require('@supabase/supabase-js'); const fs = require('fs'); require('dotenv').config(); const supabaseUrl = process.env.SUPABASE_URL; const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; if (!supabaseKey) { console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required.'); process.exit(1); } const supabase = createClient(supabaseUrl, supabaseKey); async function applySql() { try { const sql = fs.readFileSync('create_test_promotion.sql', 'utf8'); console.log('📊 Inserting test promotion data...'); const { error } = await supabase.rpc('exec_sql', { sql_query: sql }); if (error) { console.error('❌ Error:', error.message); } else { console.log('✅ Test data inserted successfully!'); console.log('\n🔍 Checking promotion statistics...'); const { data, error: statsError } = await supabase.rpc('get_promotion_stats_cached'); if (statsError) { console.error('❌ Error checking statistics:', statsError.message); } else { console.log('✅ Statistics updated:'); console.log(JSON.stringify(data, null, 2)); } } } catch (error) { console.error('❌ Unexpected error:', error.message); } } applySql();"

echo.
echo Press any key to exit...
pause > nul 