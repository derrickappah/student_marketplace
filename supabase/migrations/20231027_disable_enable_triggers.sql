-- Migration to add functions for disabling/enabling seller statistics triggers
-- This helps work around the 'column reference "seller_id" is ambiguous' error

-- Function to disable seller statistics triggers
CREATE OR REPLACE FUNCTION disable_seller_stats_triggers()
RETURNS VOID AS $$
BEGIN
  -- Disable the listings trigger
  ALTER TABLE IF EXISTS listings DISABLE TRIGGER after_listing_change;
  
  -- Disable the offers trigger
  ALTER TABLE IF EXISTS offers DISABLE TRIGGER after_offer_change;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to re-enable seller statistics triggers
CREATE OR REPLACE FUNCTION enable_seller_stats_triggers()
RETURNS VOID AS $$
BEGIN
  -- Re-enable the listings trigger
  ALTER TABLE IF EXISTS listings ENABLE TRIGGER after_listing_change;
  
  -- Re-enable the offers trigger
  ALTER TABLE IF EXISTS offers ENABLE TRIGGER after_offer_change;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION disable_seller_stats_triggers() TO authenticated;
GRANT EXECUTE ON FUNCTION enable_seller_stats_triggers() TO authenticated; 