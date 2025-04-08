async function checkMessageDelivery() {
  const { data, error } = await supabase
    .from('messages')
    .select('id, created_at, delivered_at')
    .is('delivered_at', null)
    .lt('created_at', new Date(Date.now() - 300000).toISOString()); // 5 minutes old
  
  if (error) throw error;
  
  if (data.length > 0) {
    console.error(`${data.length} undelivered messages older than 5 minutes`);
    // Trigger alert
  }
}