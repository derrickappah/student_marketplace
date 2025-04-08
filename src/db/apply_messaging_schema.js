const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or service key is missing in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMessagingSchema() {
  try {
    console.log('Reading SQL schema file...');
    const schemaFilePath = path.join(__dirname, 'messaging_schema.sql');
    const sqlSchema = fs.readFileSync(schemaFilePath, 'utf8');
    
    // Split SQL by semicolons to execute each statement separately
    // But be careful with functions and triggers that have internal semicolons
    const statements = splitSqlStatements(sqlSchema);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;
      
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      console.log(`Statement type: ${getStatementType(statement)}`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Special handling for DROP FUNCTION errors since they're often not critical
          if (statement.toUpperCase().includes('DROP FUNCTION') && 
              (error.message.includes('does not exist') || error.message.includes('unknown'))) {
            console.log(`Ignoring error for DROP FUNCTION statement: ${error.message}`);
          } else {
            console.error(`Error executing statement ${i + 1}:`, error);
            console.error('Statement:', statement);
          }
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
        }
      } catch (statementError) {
        // Special handling for DROP FUNCTION errors since they're often not critical
        if (statement.toUpperCase().includes('DROP FUNCTION') && 
            (statementError.message?.includes('does not exist') || 
             statementError.message?.includes('unknown'))) {
          console.log(`Ignoring error for DROP FUNCTION statement: ${statementError.message}`);
        } else {
          console.error(`Exception executing statement ${i + 1}:`, statementError);
          console.error('Statement:', statement);
        }
      }
    }
    
    console.log('Messaging schema applied successfully');
  } catch (error) {
    console.error('Error applying messaging schema:', error);
    process.exit(1);
  }
}

// Helper function to identify statement type
function getStatementType(statement) {
  statement = statement.toUpperCase();
  if (statement.includes('CREATE TABLE')) return 'CREATE TABLE';
  if (statement.includes('ALTER TABLE')) return 'ALTER TABLE';
  if (statement.includes('CREATE POLICY')) return 'CREATE POLICY';
  if (statement.includes('CREATE FUNCTION')) return 'CREATE FUNCTION';
  if (statement.includes('CREATE OR REPLACE FUNCTION')) return 'CREATE OR REPLACE FUNCTION';
  if (statement.includes('CREATE TRIGGER')) return 'CREATE TRIGGER';
  if (statement.includes('DROP FUNCTION')) return 'DROP FUNCTION';
  return 'OTHER';
}

// Helper function to split SQL statements properly
function splitSqlStatements(sql) {
  const statements = [];
  let currentStatement = '';
  let inFunction = false;
  let inTrigger = false;
  let parenthesesCount = 0;
  
  // Split by lines to better handle comments and functions
  const lines = sql.split('\n');
  
  for (const line of lines) {
    // Skip empty lines and comments
    const trimmedLine = line.trim();
    if (trimmedLine === '' || trimmedLine.startsWith('--')) {
      currentStatement += line + '\n';
      continue;
    }
    
    // Check if we're entering or exiting a function/trigger definition
    if (trimmedLine.includes('CREATE OR REPLACE FUNCTION') || 
        trimmedLine.includes('CREATE FUNCTION')) {
      inFunction = true;
    }
    
    if (trimmedLine.includes('CREATE TRIGGER')) {
      inTrigger = true;
    }
    
    // Count opening and closing parentheses to track nesting
    for (const char of trimmedLine) {
      if (char === '(') parenthesesCount++;
      if (char === ')') parenthesesCount--;
    }
    
    // Check if we're exiting a function definition
    if (inFunction && trimmedLine.includes('LANGUAGE plpgsql')) {
      inFunction = false;
    }
    
    // Add the line to the current statement
    currentStatement += line + '\n';
    
    // If we reach a semicolon and we're not inside a function or trigger,
    // or if we're at the end of a function/trigger, consider it a complete statement
    if (trimmedLine.endsWith(';') && !inFunction && !inTrigger && parenthesesCount === 0) {
      statements.push(currentStatement);
      currentStatement = '';
    }
  }
  
  // Add any remaining statement
  if (currentStatement.trim()) {
    statements.push(currentStatement);
  }
  
  return statements;
}

// Execute the script
applyMessagingSchema()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 