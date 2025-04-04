-- Update the action_type constraint in admin_logs to include promotion-related actions
ALTER TABLE admin_logs DROP CONSTRAINT IF EXISTS admin_logs_action_type_check;

ALTER TABLE admin_logs ADD CONSTRAINT admin_logs_action_type_check CHECK (
  action_type IN (
    'create', 'update', 'delete', 'view', 'settings', 'export', 'import', 'bulk_action',
    'approved_promotion', 'rejected_promotion', 'promotion_update'
  )
); 