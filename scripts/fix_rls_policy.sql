-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;

-- Create a simpler policy that allows anonymous inserts
CREATE POLICY "Anyone can submit contact messages"
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create a policy to allow authenticated users to select all contact messages
DROP POLICY IF EXISTS "Admins can see all contact messages" ON public.contact_messages;
CREATE POLICY "Admins can see all contact messages"
  ON public.contact_messages
  FOR SELECT 
  TO authenticated
  USING (true);

-- Create a policy for administrative changes (update, delete)
DROP POLICY IF EXISTS "Admins can insert and update contact messages" ON public.contact_messages;
CREATE POLICY "Admins can update contact messages"
  ON public.contact_messages
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admins can delete contact messages"
  ON public.contact_messages
  FOR DELETE
  TO authenticated
  USING (true); 