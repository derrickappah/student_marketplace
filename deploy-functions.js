const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function deployFunctions() {
  try {
    console.log('Deploying SQL functions to Supabase...');
    
    // Read the SQL files
    const functionDir = path.join(__dirname, 'supabase', 'functions');
    const deleteOffersSQL = fs.readFileSync(path.join(functionDir, 'delete_listing_offers.sql'), 'utf8');
    const deleteCompleteSQL = fs.readFileSync(path.join(functionDir, 'delete_listing_complete.sql'), 'utf8');
    
    // Deploy each function
    console.log('Deploying delete_listing_offers function...');
    const { error: offersError } = await supabase.rpc('pg_execute', { 
      sql_statement: deleteOffersSQL 
    });
    
    if (offersError) {
      console.error('Error deploying delete_listing_offers:', offersError);
    } else {
      console.log('delete_listing_offers function deployed successfully');
    }
    
    console.log('Deploying delete_listing_complete function...');
    const { error: completeError } = await supabase.rpc('pg_execute', { 
      sql_statement: deleteCompleteSQL 
    });
    
    if (completeError) {
      console.error('Error deploying delete_listing_complete:', completeError);
    } else {
      console.log('delete_listing_complete function deployed successfully');
    }
    
    console.log('Deployment completed!');
  } catch (error) {
    console.error('Error deploying functions:', error);
  }
}

deployFunctions(); 