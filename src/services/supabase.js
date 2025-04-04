import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';

// Hardcoded values to ensure correct format
const supabaseUrl = 'https://ivdsmrlcbhanwafntncx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2ZHNtcmxjYmhhbndhZm50bmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NTUyNTcsImV4cCI6MjA1OTAzMTI1N30.e6fflcrC6rsiiWVoThX_8qTYVcVXCPCSfjI7O_vUesM';

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Contact form submission
export const submitContactForm = async ({ name, email, topic, message }) => {
  try {
    // Validate required fields
    if (!name || !email || !topic || !message) {
      throw new Error('All fields are required');
    }
    
    console.log('Submitting contact form with data:', { name, email, topic, message: message.slice(0, 20) + '...' });
    
    // Insert the contact form submission into the contact_messages table
    const { data, error } = await supabase
      .from('contact_messages')
      .insert([{
        name,
        email,
        topic,
        message,
        created_at: new Date().toISOString(),
        status: 'new'
      }]);
    
    if (error && Object.keys(error).length > 0) {
      console.error('Error submitting contact form:', error);
      
      // If the table doesn't exist, attempt to create it
      if (error.code === '42P01') {
        console.log('Contact messages table does not exist. Creating table...');
        return { success: false, error: 'The contact form system is not properly set up yet. Please contact the administrator.' };
      }
      
      throw new Error(error.message || 'Failed to submit contact form');
    }
    
    console.log('Contact form submitted successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error in submitContactForm:', error);
    return { success: false, error: error.message || 'An unknown error occurred' };
  }
};

// Admin functions for contact messages
export const getContactMessages = async ({ status = null, limit = 50, page = 1 }) => {
  try {
    const { data: authData } = await supabase.auth.getUser();
    
    if (!authData || !authData.user) {
      throw new Error('You must be logged in to access contact messages');
    }
    
    console.log('Fetching contact messages with filters:', { status, limit, page });
    
    let query = supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching contact messages:', error);
      throw error;
    }
    
    // Get the total count
    const { count: totalCount, error: countError } = await supabase
      .from('contact_messages')
      .select('*', { count: 'exact' });
      
    if (countError) {
      console.error('Error getting count:', countError);
    }
    
    return { 
      data, 
      count: totalCount || 0,
      page,
      limit,
      totalPages: Math.ceil((totalCount || 0) / limit)
    };
  } catch (error) {
    console.error('Error in getContactMessages:', error);
    return { 
      data: [], 
      count: 0, 
      page, 
      limit,
      totalPages: 0,
      error: error.message
    };
  }
};

export const updateContactMessageStatus = async (messageId, status, notes = null) => {
  try {
    const { data: authData } = await supabase.auth.getUser();
    
    if (!authData || !authData.user) {
      throw new Error('You must be logged in to update contact messages');
    }
    
    const updates = {
      status,
      responded_by: authData.user.id
    };
    
    // Add notes if provided
    if (notes) {
      updates.notes = notes;
    }
    
    // Add responded_at timestamp if marking as responded
    if (status === 'responded') {
      updates.responded_at = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('contact_messages')
      .update(updates)
      .eq('id', messageId);
      
    if (error) {
      console.error('Error updating contact message:', error);
      throw error;
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error in updateContactMessageStatus:', error);
    return { success: false, error: error.message };
  }
};

export const deleteContactMessage = async (messageId) => {
  try {
    const { data: authData } = await supabase.auth.getUser();
    
    if (!authData || !authData.user) {
      throw new Error('You must be logged in to delete contact messages');
    }
    
    const { data, error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', messageId);
      
    if (error) {
      console.error('Error deleting contact message:', error);
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in deleteContactMessage:', error);
    return { success: false, error: error.message };
  }
};

// Create contact_messages table if it doesn't exist
const createContactMessagesTable = async () => {
  try {
    const { error } = await supabase.rpc('create_contact_messages_table');
    
    if (error) {
      // If RPC doesn't exist, create the table with SQL
      const { error: sqlError } = await supabase.auth.getUser();
      
      if (sqlError) throw sqlError;
      
      // Using supabase query to create the table
      // This requires admin rights, but we'll try it anyway
      // In a real app, you'd handle this server-side
      console.log('Attempting to create contact_messages table directly...');
      
      // Since we can't execute raw SQL from the client, we'll insert into a
      // non-existent table, which will fail but give us helpful information
      const { error: testError } = await supabase
        .from('contact_messages')
        .insert([{
          name: 'Test User',
          email: 'test@example.com',
          topic: 'Test',
          message: 'Test message',
          created_at: new Date().toISOString(),
          status: 'new'
        }]);
      
      console.error('Table creation failed:', testError);
      throw new Error('Could not create contact_messages table. Please contact the administrator.');
    }
    
    console.log('Successfully created contact_messages table');
    return { success: true };
  } catch (error) {
    console.error('Error creating contact_messages table:', error);
    return { success: false, error: error.message };
  }
};

// Auth helper functions
export const signUp = async ({ email, password, name, university }) => {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        university
      }
    }
  });

  if (authError) throw authError;

  // After successful signup, create the user profile
  const { error: profileError } = await supabase
    .from('users')
    .insert([
      {
        id: authData.user.id,
        email,
        name,
        university,
        created_at: new Date().toISOString()
      },
    ]);

  if (profileError) throw profileError;

  return authData;
};

export const signIn = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const resetPassword = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  
  if (error) throw error;
  return { success: true };
};

export const updatePassword = async (newPassword) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  
  if (error) throw error;
  return { success: true };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Listings helper functions
export const getListings = async ({ 
  page = 1, 
  itemsPerPage = 10, 
  category = null, 
  search = null, 
  minPrice = null, 
  maxPrice = null, 
  condition = null,
  isPriority = false,
  showPromotedOnly = false,
  sortBy = 'newest',
  excludeIds = []
}) => {
  try {
    console.log('Fetching listings with filters:', { 
      page, 
      itemsPerPage, 
      category, 
      search, 
      minPrice, 
      maxPrice, 
      condition,
      isPriority,
      showPromotedOnly,
      sortBy,
      excludeIds
    });
    
    let query = supabase
      .from('listings')
      .select(`
        *,
        users (name, university),
        category:category_id (id, name)
      `, { count: 'exact' })
      .eq('status', 'available');

    // Apply category filter
    if (category) {
      query = query.eq('category_id', category);
    }

    // Apply search filter
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // Apply price filters
    if (minPrice !== null && minPrice !== undefined) {
      query = query.gte('price', minPrice);
    }

    if (maxPrice !== null && maxPrice !== undefined) {
      query = query.lte('price', maxPrice);
    }

    // Apply condition filter
    if (condition) {
      query = query.eq('condition', condition);
    }
    
    // Apply promotion filters
    if (isPriority) {
      query = query
        .eq('is_priority', true)
        .eq('promotion_status', 'approved');
    } else if (showPromotedOnly) {
      query = query
        .eq('is_featured', true)
        .eq('promotion_status', 'approved');
    }
    
    // Exclude specific IDs (useful for filtering out priority listings that are shown separately)
    if (excludeIds && excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Add pagination
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    
    if (error) {
      console.error('Error fetching listings:', error);
      throw error;
    }
    
    console.log(`Successfully fetched ${data?.length || 0} listings (total: ${count})`);
    return { data, count, error };
  } catch (error) {
    console.error('Error in getListings:', error);
    return { data: [], count: 0, error };
  }
};

export const getUserListings = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('User not authenticated');
  
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      category:category_id (id, name)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return { data, error };
};

// User profile functions
export const ensureUserProfile = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('User not authenticated in ensureUserProfile');
      return { success: false, error: 'User not authenticated' };
    }
    
    console.log('Checking user profile for ID:', user.id);
    
    // Check if the user exists in the users table
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();
      
    if (checkError) { 
      // Only consider it an error if it's not the expected "not found" error
      if (checkError.code !== 'PGRST116') {
        console.error('Error checking user existence:', checkError);
        return { success: false, error: `Error checking profile: ${checkError.message}` };
      }
      console.log('User not found in database, will create profile');
    } else {
      console.log('User profile already exists:', existingUser);
      return { success: true, error: null };
    }
    
    // If user doesn't exist in the users table, create their profile
    console.log('Creating user profile with ID:', user.id);
    const userData = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || 'New User',
      university: user.user_metadata?.university || 'Default University',
      created_at: new Date().toISOString()
    };
    
    console.log('User data for profile creation:', userData);
    
    const { error: insertError } = await supabase
      .from('users')
      .insert([userData]);
      
    if (insertError) {
      console.error('Error creating user profile:', insertError);
      return { success: false, error: `Error creating profile: ${insertError.message}` };
    }
    
    console.log('Successfully created user profile for:', user.id);
    return { success: true, error: null };
  } catch (error) {
    console.error('Exception in ensureUserProfile:', error);
    return { success: false, error: `Exception: ${error.message}` };
  }
};

export const createListing = async ({ 
  title, 
  description, 
  price, 
  category_id, 
  condition, 
  images, 
  onProgressUpdate,
  promotionOptions = {}
}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');
    
    // First ensure the user profile exists
    const profileResult = await ensureUserProfile();
    if (!profileResult.success) {
      throw new Error(profileResult.error || 'Failed to ensure user profile. Please try logging out and back in.');
    }
  
    // Continue with image uploads...
    const imageUrls = [];
    const totalImages = images.length;
    
    // Report initial progress
    if (onProgressUpdate) {
      onProgressUpdate(0);
    }
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      try {
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const { data, error } = await supabase.storage
          .from('listings')
          .upload(fileName, image);
  
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('listings')
          .getPublicUrl(fileName);
  
        imageUrls.push(publicUrl);
        
        // Report progress
        if (onProgressUpdate) {
          const progress = ((i + 1) / totalImages) * 100;
          onProgressUpdate(progress);
        }
      } catch (e) {
        console.error('Image upload error:', e);
      }
    }
  
    console.log('User profile ensured, creating listing for user ID:', user.id);

    // Temporarily disable the problematic triggers before creating the listing
    try {
      await supabase.rpc('disable_seller_stats_triggers');
    } catch (triggerError) {
      console.log('Could not disable triggers, continuing anyway:', triggerError);
    }
    
    // Now create the listing
    try {
      // First try with promotion options
      const listingData = {
        title: title,
        description: description,
        price: price,
        user_id: user.id
      };
      
      if (category_id) listingData.category_id = category_id;
      if (condition) listingData.condition = condition;
      if (imageUrls.length > 0) listingData.images = imageUrls;
      
      // Add promotion options if provided
      const hasPromotionOptions = promotionOptions.featured || promotionOptions.priority;
      
      if (promotionOptions.featured) {
        listingData.is_featured = true;
      }
      
      if (promotionOptions.priority) {
        listingData.is_priority = true;
      }
      
      // Set promotion status based on whether promotion options are selected
      listingData.promotion_status = hasPromotionOptions ? 'pending' : 'none';
      
      // Debug log
      console.log('Creating listing with data:', {
        ...listingData,
        promotionStatus: listingData.promotion_status,
        hasPromotionOptions
      });
      
      const { data, error } = await supabase
        .from('listings')
        .insert([listingData]);
    
      if (error) {
        // If error mentions missing columns, try again without promotion fields
        if (error.message && error.message.includes('column') && 
            (error.message.includes('is_featured') || error.message.includes('is_priority') || 
             error.message.includes('promotion_status'))) {
          console.error('Promotion columns error:', error);
          throw new Error('Missing promotion columns');
        }
        throw error;
      }

      // Re-enable the triggers after successfully creating the listing
      try {
        await supabase.rpc('enable_seller_stats_triggers');
      } catch (triggerError) {
        console.log('Could not re-enable triggers:', triggerError);
      }
      
      return { data: { success: true, id: data?.[0]?.id }, error: null };
    } catch (columnError) {
      // If the previous attempt failed because of missing columns, try without promotion fields
      if (columnError.message === 'Missing promotion columns') {
        console.log('Retrying without promotion fields');
        const basicListingData = {
          title: title,
          description: description,
          price: price,
          user_id: user.id
        };
        
        if (category_id) basicListingData.category_id = category_id;
        if (condition) basicListingData.condition = condition;
        if (imageUrls.length > 0) basicListingData.images = imageUrls;
        
        const { data, error } = await supabase
          .from('listings')
          .insert([basicListingData]);
      
        if (error) {
          console.error('Supabase error details:', error);
          return { data: null, error: `${error.message} (Code: ${error.code})` };
        }
        
        // Re-enable the triggers after successfully creating the listing
        try {
          await supabase.rpc('enable_seller_stats_triggers');
        } catch (triggerError) {
          console.log('Could not re-enable triggers:', triggerError);
        }
        
        return { 
          data: { 
            success: true, 
            id: data?.[0]?.id,
            message: 'Created without promotion options - database schema needs updating'
          }, 
          error: null 
        };
      } else {
        // Re-enable the triggers even if there was an error
        try {
          await supabase.rpc('enable_seller_stats_triggers');
        } catch (triggerError) {
          console.log('Could not re-enable triggers:', triggerError);
        }
        
        throw columnError;
      }
    }
  } catch (error) {
    console.error('Error in createListing:', error);
    return { data: null, error: error.message };
  }
};

// Image helper functions
export const uploadImage = async (file, bucket = 'avatars', storagePath = 'public/') => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image size must be less than 5MB');
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Only JPEG, PNG, GIF, and WebP images are allowed');
    }
    
    // Check if specified bucket exists or find an alternative
    const { success: bucketsSuccess, buckets } = await listStorageBuckets();
    let bucketToUse = bucket;
    
    if (bucketsSuccess && buckets) {
      const bucketExists = buckets.some(b => b.name === bucket);
      if (!bucketExists && buckets.length > 0) {
        bucketToUse = buckets[0].name;
        console.log(`Specified bucket "${bucket}" not found, using "${bucketToUse}" instead`);
      }
    } else {
      console.warn('Could not verify buckets, attempting to use specified bucket anyway');
    }
    
    // Generate a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    
    // Use the provided storage path
    let filePath;
    if (storagePath) {
      // Make sure storage path ends with a slash
      const normalizedPath = storagePath.endsWith('/') ? storagePath : `${storagePath}/`;
      filePath = `${normalizedPath}${fileName}`;
    } else {
      // Default to user ID folder if no path specified
      filePath = `${user.id}/${fileName}`;
    }
    
    console.log(`Uploading image to ${bucketToUse}/${filePath}`);
    
    // Upload the file with appropriate options
    const { data, error } = await supabase.storage
      .from(bucketToUse)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });
      
    if (error) {
      console.error('Storage upload error:', error);
      
      // If the error is about permissions or paths, try root folder as last resort
      if (error.message.includes('permission') || error.message.includes('not found')) {
        console.log('Trying to upload to root folder as fallback...');
        
        const rootFilePath = fileName;
        const { data: rootData, error: rootError } = await supabase.storage
          .from(bucketToUse)
          .upload(rootFilePath, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type
          });
          
        if (rootError) {
          console.error('Root folder upload also failed:', rootError);
          throw error; // Throw the original error
        }
        
        // Get the public URL for the file in root
        const { data: rootUrlData } = supabase.storage
          .from(bucketToUse)
          .getPublicUrl(rootData.path);
          
        const rootPublicUrl = rootUrlData.publicUrl;
        console.log('Upload to root successful, public URL:', rootPublicUrl);
        
        return { 
          success: true, 
          data: { 
            path: rootPublicUrl,
            filename: fileName,
            bucket: bucketToUse,
            location: 'root'
          }
        };
      }
      
      throw error;
    }
    
    // Get the public URL for the file
    const { data: urlData } = supabase.storage
      .from(bucketToUse)
      .getPublicUrl(data.path);
    
    const publicUrl = urlData.publicUrl;
    console.log('Upload successful, public URL:', publicUrl);
    
    return { 
      success: true, 
      data: { 
        path: publicUrl,
        filename: fileName,
        bucket: bucketToUse
      }
    };
  } catch (error) {
    console.error('Image upload error:', error.message);
    return { success: false, error: error.message };
  }
};

export const deleteImage = async (imageUrl) => {
  // Extract file path from URL
  const fileName = imageUrl.split('/').pop();
  
  const { error } = await supabase.storage
    .from('listings')
    .remove([fileName]);

  if (error) throw error;
  return { success: true };
};

// Messages helper functions
export const sendMessage = async ({ conversation_id, content, image_url = null }) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Use the RLS-bypassing function to send the message
    const { data: result, error: sendError } = await supabase.rpc(
      'send_message_to_conversation',
      {
        conv_id: conversation_id,
        sender_id: user.id,
        message_content: content.trim(),
        message_image_url: image_url,
        related_listing_id: null
      }
    );
    
    if (sendError) {
      console.error('Error sending message:', sendError);
      throw new Error(`Failed to send message: ${sendError.message}`);
    }
    
    if (!result || !result.success) {
      console.error('Function returned error:', result?.error || 'Unknown error');
      throw new Error(result?.error || 'Failed to send message');
    }
    
    return { data: result.message, error: null };
  } catch (error) {
    console.error('Error in sendMessage:', error);
    return { data: null, error };
  }
};

export const getMessages = async (conversationId) => {
  try {
    if (!conversationId) throw new Error('Conversation ID is required');
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');
    
    // Use the RLS-bypassing function to get messages
    const { data: result, error: funcError } = await supabase.rpc(
      'get_conversation_messages',
      { conv_id: conversationId }
    );
    
    if (funcError) {
      console.error('Error getting messages:', funcError);
      throw new Error(`Failed to load messages: ${funcError.message}`);
    }
    
    if (!result || !result.success) {
      console.error('Function returned error:', result?.error || 'Unknown error');
      throw new Error(result?.error || 'Failed to load messages');
    }
    
    return { data: result.messages || [], error: null };
  } catch (error) {
    console.error('Error fetching messages:', error);
    return { data: null, error };
  }
};

/**
 * Get conversation details by ID
 */
export const getConversation = async (conversationId) => {
  try {
    if (!conversationId) throw new Error('Conversation ID is required');
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        listing:listing_id (
          id, 
          title, 
          price,
          images
        ),
        buyer:buyer_id (
          id,
          name,
          avatar_url
        ),
        seller:seller_id (
          id,
          name,
          avatar_url
        )
      `)
      .eq('id', conversationId)
      .single();
      
    // Make sure the user is part of this conversation
    if (data && data.buyer_id !== user.id && data.seller_id !== user.id) {
      return {
        data: null,
        error: { message: 'You do not have permission to view this conversation' }
      };
    }
    
    // Format the data for easier consumption
    if (data) {
      const formattedData = {
        id: data.id,
        listing_id: data.listing_id,
        listing_title: data.listing?.title || 'Unknown Item',
        listing_price: data.listing?.price,
        listing_image: data.listing?.images?.[0] || null,
        buyer_id: data.buyer_id,
        buyer_name: data.buyer?.name || 'Unknown User',
        buyer_avatar: data.buyer?.avatar_url,
        seller_id: data.seller_id,
        seller_name: data.seller?.name || 'Unknown Seller',
        seller_avatar: data.seller?.avatar_url,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      
      return { data: formattedData, error: null };
    }
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return { data: null, error };
  }
};

/**
 * Mark a conversation thread as read by the current user
 */
export const markThreadAsRead = async (conversationId) => {
  try {
    if (!conversationId) throw new Error('Conversation ID is required');
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');
    
    // Get the conversation to determine if user is buyer or seller
    const { data: conversation } = await supabase
      .from('conversations')
      .select('buyer_id, seller_id')
      .eq('id', conversationId)
      .single();
      
    if (!conversation) throw new Error('Conversation not found');
    
    // Determine which column to update
    let updateColumn;
    if (conversation.buyer_id === user.id) {
      updateColumn = 'last_read_by_buyer';
    } else if (conversation.seller_id === user.id) {
      updateColumn = 'last_read_by_seller';
    } else {
      throw new Error('User is not part of this conversation');
    }
    
    // Update the last read timestamp
    const { error } = await supabase
      .from('conversations')
      .update({ [updateColumn]: new Date().toISOString() })
      .eq('id', conversationId);
      
    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error marking thread as read:', error);
    return { success: false, error };
  }
};

export const getConversations = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');
    
    // Use our RLS-bypassing function to get all conversations
    const { data: result, error: funcError } = await supabase.rpc(
      'get_user_conversations',
      { user_uuid: user.id }
    );
    
    if (funcError) {
      console.error('Error getting conversations:', funcError);
      throw new Error(`Failed to load conversations: ${funcError.message}`);
    }
    
    if (!result || !result.success) {
      console.error('Function returned error:', result?.error || 'Unknown error');
      throw new Error(result?.error || 'Failed to load conversations');
    }
    
    return { data: result.conversations || [], error: null };
  } catch (error) {
    console.error('Exception in getConversations:', error);
    return { data: [], error };
  }
};

export const subscribeToMessages = (conversationId, callback) => {
  if (!conversationId) {
    console.error('Cannot subscribe: No conversation ID provided');
    return { unsubscribe: () => {} };
  }

  const channel = supabase
    .channel(`messages:conversation=${conversationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
    }, (payload) => {
      console.log('Received new message:', payload);
      callback(payload);
    })
    .subscribe((status) => {
      console.log(`Subscription status for conversation ${conversationId}:`, status);
    });

  return channel;
};

// Track when a user is viewing a conversation
export const trackConversationPresence = (conversationId, userId) => {
  if (!conversationId || !userId) {
    console.error('Cannot track presence: Missing conversation ID or user ID');
    return { unsubscribe: () => {} };
  }

  const channel = supabase
    .channel(`presence:conversation=${conversationId}`)
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      console.log('Presence state updated:', state);
      // You can use this state to show who's currently viewing the conversation
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('User joined:', newPresences);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('User left:', leftPresences);
    });

  // Subscribe first, then track presence AFTER the subscription is established
  channel.subscribe((status) => {
    console.log(`Presence subscription status for conversation ${conversationId}:`, status);
    
    if (status === 'SUBSCRIBED') {
      // Only track presence after successful subscription
      channel.track({
        user_id: userId,
        online_at: new Date().toISOString(),
      });
    }
  });

  return channel;
};

// Store active typing channels to avoid recreating them
const typingChannels = {};

// Subscribe to typing indicators for a conversation
export const subscribeToTypingIndicators = (conversationId, callback) => {
  if (!conversationId) {
    console.error('Cannot subscribe to typing: No conversation ID provided');
    return { unsubscribe: () => {} };
  }

  // Use existing channel if available
  if (typingChannels[conversationId]) {
    console.log(`Using existing typing channel for conversation ${conversationId}`);
    // Add listener to existing channel
    typingChannels[conversationId].on('broadcast', { event: 'typing' }, (payload) => {
      console.log('Typing indicator received:', payload);
      callback(payload);
    });
    return typingChannels[conversationId];
  }

  // Create a new channel
  const channel = supabase
    .channel(`typing:conversation=${conversationId}`)
    .on('broadcast', { event: 'typing' }, (payload) => {
      console.log('Typing indicator received:', payload);
      callback(payload);
    });
  
  // Subscribe to the channel
  channel.subscribe((status) => {
    console.log(`Typing subscription status for conversation ${conversationId}:`, status);
    if (status === 'SUBSCRIBED') {
      // Store the channel for future use
      typingChannels[conversationId] = channel;
    }
  });

  return channel;
};

// Send typing indicator to conversation
export const sendTypingIndicator = async (conversationId, userId, isTyping) => {
  if (!conversationId || !userId) return;

  try {
    // Check if we already have a subscribed channel for this conversation
    if (!typingChannels[conversationId]) {
      // Create a new channel and subscribe to it
      console.log(`Creating new typing channel for conversation ${conversationId}`);
      const channel = supabase.channel(`typing:conversation=${conversationId}`);
      
      // Subscribe to the channel
      await new Promise((resolve) => {
        channel.subscribe((status) => {
          console.log(`Typing channel subscription status: ${status}`);
          if (status === 'SUBSCRIBED') {
            resolve();
          }
        });
      });
      
      // Store the channel for future use
      typingChannels[conversationId] = channel;
    }
    
    // Use the existing or newly created channel
    await typingChannels[conversationId].send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: userId,
        is_typing: isTyping
      }
    });
  } catch (error) {
    console.error('Error sending typing indicator:', error);
  }
};

// User profile functions
export const updateProfile = async (profileData) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('User not authenticated');
  
  try {
    console.log('Update profile called with:', profileData);
    
    // Validate inputs
    if (profileData.name && profileData.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }
    
    if (profileData.phone && !/^[\d\s+\-()]{10,15}$/.test(profileData.phone)) {
      throw new Error('Please enter a valid phone number');
    }
    
    if (profileData.bio && profileData.bio.length > 500) {
      throw new Error('Bio should be 500 characters or less');
    }
    
    // Prepare user metadata update
    const metadataUpdate = {};
    
    // Basic profile fields
    if (profileData.name !== undefined) metadataUpdate.name = profileData.name;
    if (profileData.phone !== undefined) metadataUpdate.phone = profileData.phone;
    if (profileData.bio !== undefined) metadataUpdate.bio = profileData.bio;
    if (profileData.university !== undefined) metadataUpdate.university = profileData.university;
    if (profileData.avatar_url !== undefined) metadataUpdate.avatar_url = profileData.avatar_url;
    
    // Add notification preferences to metadata
    if (profileData.notification_preferences) {
      metadataUpdate.notification_preferences = profileData.notification_preferences;
    }
    
    console.log('Updating user metadata with:', metadataUpdate);
    
    // Auth-related updates (including metadata)
    const { data: authData, error: authError } = await supabase.auth.updateUser({
      data: metadataUpdate
    });
    
    if (authError) {
      console.error('Error updating auth metadata:', authError);
      throw authError;
    }
    
    console.log('Auth metadata update successful:', authData);
    
    // Prepare profile data for the users table (excluding the notification preferences)
    const userProfileData = { ...profileData };
    delete userProfileData.password; // Don't store password in the profile table
    delete userProfileData.notification_preferences; // Store this in user metadata instead
    
    // Add last_updated timestamp
    userProfileData.updated_at = new Date().toISOString();
    
    // Update the user profile in the users table (only for columns that exist)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: profileData.name,
          phone: profileData.phone,
          bio: profileData.bio,
          university: profileData.university,
          avatar_url: profileData.avatar_url,
          updated_at: userProfileData.updated_at
        })
        .eq('id', user.id);
  
      if (error) {
        console.error('Error updating user profile in database:', error);
        // Continue anyway since we already updated the auth metadata
      } else {
        console.log('Database profile update successful');
      }
    } catch (dbError) {
      console.error('Exception updating profile in database:', dbError);
      // Continue since we've already updated the auth metadata
    }
    
    return { 
      success: true, 
      data: { 
        ...userProfileData, 
        notification_preferences: profileData.notification_preferences,
        user_metadata: authData.user.user_metadata
      } 
    };
  } catch (error) {
    console.error('Profile update error:', error.message);
    return { success: false, error: error.message };
  }
};

// Categories helper functions
export const getCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
};

// Reviews and Ratings functions
export const createReview = async ({ sellerId, listingId, rating, comment }) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      reviewer_id: user.id,
      seller_id: sellerId,
      listing_id: listingId,
      rating,
      comment,
    })
    .select();

  if (error) throw error;
  return { data, error: null };
};

export const getUserReviews = async (userId) => {
  try {
    console.log(`Fetching reviews for seller ${userId}`);
    
    // First get all the reviews without the reviewer join
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
    
    if (!reviews || reviews.length === 0) {
      console.log('No reviews found for this user');
      return { data: [], error: null };
    }
    
    console.log(`Found ${reviews.length} reviews, fetching reviewer data...`);
    
    // Get all unique reviewer IDs
    const reviewerIds = [...new Set(reviews.map(review => review.reviewer_id))];
    
    // Fetch the LATEST reviewer data directly with cache control
    const { data: reviewers, error: reviewersError } = await supabase
      .from('users')
      .select('id, name, avatar_url, updated_at')
      .in('id', reviewerIds);
      
    if (reviewersError) {
      console.error('Error fetching reviewer details:', reviewersError);
      // Fall back to original reviews but log the error
    }
    
    console.log('Fresh reviewer data:', reviewers);
    
    // Map the reviewer data to each review
    const enrichedReviews = reviews.map(review => {
      // Find the reviewer from the fresh data
      const reviewer = reviewers?.find(r => r.id === review.reviewer_id);
      
      if (reviewer) {
        // Add a cache-busting timestamp to avatar URLs
        const updatedReviewer = {
          ...reviewer,
          avatar_url: reviewer.avatar_url ? 
            `${reviewer.avatar_url}${reviewer.avatar_url.includes('?') ? '&' : '?'}_t=${Date.now()}` : 
            null
        };
        
        return {
          ...review,
          reviewer: updatedReviewer
        };
      }
      
      return {
        ...review,
        reviewer: null // If reviewer not found
      };
    });
    
    console.log('Returning enriched reviews with fresh reviewer data');
    return { data: enrichedReviews, error: null };
  } catch (err) {
    console.error('Unexpected error in getUserReviews:', err);
    throw err;
  }
};

export const getUserRating = async (userId) => {
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('seller_id', userId);

  if (error) throw error;
  
  // Calculate average rating
  if (data && data.length > 0) {
    const totalRating = data.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / data.length;
    return { 
      rating: parseFloat(averageRating.toFixed(1)), 
      count: data.length, 
      error: null 
    };
  }
  
  return { rating: 0, count: 0, error: null };
};

// Add the updateReview function here
export const updateReview = async ({ reviewId, rating, comment }) => {
  try {
    if (!reviewId) {
      throw new Error('Review ID is required');
    }

    // Validate rating is between 1-5
    if (!rating || rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    // First check if the user is the author of the review
    const { data: existingReview, error: reviewError } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (reviewError) throw reviewError;
    if (!existingReview) throw new Error('Review not found');
    if (existingReview.reviewer_id !== userData.user.id) {
      throw new Error('You can only edit your own reviews');
    }

    // Now update the review
    const { data, error } = await supabase
      .from('reviews')
      .update({ 
        rating, 
        comment, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', reviewId);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating review:', error);
    throw error;
  }
};

// Add deleteReview function
export const deleteReview = async (reviewId) => {
  try {
    if (!reviewId) {
      throw new Error('Review ID is required');
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    // First check if the user is the author of the review
    const { data: existingReview, error: reviewError } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (reviewError) throw reviewError;
    if (!existingReview) throw new Error('Review not found');
    if (existingReview.reviewer_id !== userData.user.id) {
      throw new Error('You can only delete your own reviews');
    }

    // Now delete the review
    const { data, error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
};

// Recently viewed listings
export const trackViewedListing = async (listingId) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return; // Only track for logged in users
  
  const { error } = await supabase
    .from('viewed_listings')
    .upsert([{
      user_id: user.id,
      listing_id: listingId,
      viewed_at: new Date(),
    }]);
  
  if (error) console.error('Error tracking viewed listing:', error);
};

export const getRecentlyViewedListings = async (limit = 10) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];
  
  const { data, error } = await supabase
    .from('viewed_listings')
    .select(`
      listing_id,
      viewed_at,
      listings(*)
    `)
    .eq('user_id', user.id)
    .order('viewed_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  
  return data.map(item => item.listings);
};

// Offer system functions
export const createOffer = async ({ listingId, offerAmount, message }) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('User not authenticated');
  
  // Get the listing to determine the seller
  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('user_id, price, title')
    .eq('id', listingId)
    .single();
    
  if (listingError) throw listingError;
  
  // Don't allow offers on your own listings
  if (listing.user_id === user.id) {
    throw new Error('You cannot make offers on your own listings');
  }
  
  // Create the offer
  const { data, error } = await supabase
    .from('offers')
    .insert({
      listing_id: listingId,
      buyer_id: user.id,
      seller_id: listing.user_id,
      amount: offerAmount,
      message,
      status: 'pending',
    })
    .select();
    
  if (error) throw error;
  
  // Notifications are now handled by the database trigger
    
  return { data, error: null };
};

export const getMyOffers = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('User not authenticated');
  
  const { data, error } = await supabase
    .from('offers')
    .select(`
      *,
      listing:listing_id(id, title, price, images),
      buyer:buyer_id(id, name),
      seller:seller_id(id, name)
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return { data, error: null };
};

export const respondToOffer = async (offerId, action) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('User not authenticated');
  
  // Verify this user is the seller for this offer
  const { data: offer, error: offerError } = await supabase
    .from('offers')
    .select('*, listing:listing_id(title)')
    .eq('id', offerId)
    .single();
    
  if (offerError) throw offerError;
  
  if (offer.seller_id !== user.id) {
    throw new Error('Only the seller can respond to this offer');
  }
  
  // Update the offer status
  const newStatus = action === 'accept' ? 'accepted' : 'declined';
  
  const { error } = await supabase
    .from('offers')
    .update({ status: newStatus })
    .eq('id', offerId);
    
  if (error) throw error;
  
  // Notifications are now handled by the database trigger
  
  return { success: true, error: null };
};

// Function to get channel info for offer subscriptions
export const getOfferSubscriptionInfo = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }
    
    const { data, error } = await supabase.rpc(
      'subscribe_to_user_offers',
      { user_uuid: user.id }
    );
    
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (err) {
    console.error('Error getting offer subscription info:', err);
    return { success: false, error: err.message };
  }
};

// Store active offer subscription channels
const offerChannels = {};

// Subscribe to offers for the current user
export const subscribeToOfferUpdates = (callback) => {
  const handleSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('Cannot subscribe to offers: User not authenticated');
        return { unsubscribe: () => {} };
      }
      
      // Check if we already have a channel for this user
      if (offerChannels[user.id]) {
        console.log(`Using existing offer channel for user ${user.id}`);
        return offerChannels[user.id];
      }
      
      // Get subscription info from the server
      const { success, data, error } = await getOfferSubscriptionInfo();
      
      if (!success || error) {
        console.error('Error getting offer subscription info:', error);
        return { unsubscribe: () => {} };
      }
      
      console.log('Setting up offer subscription with info:', data);
      
      // Create a channel for both sent and received offers
      const channel = supabase
        .channel(`offers:user=${user.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'offers',
          filter: `buyer_id=eq.${user.id}`,
        }, (payload) => {
          console.log('New sent offer received:', payload);
          callback({ type: 'new_offer', role: 'buyer', data: payload.new });
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'offers',
          filter: `seller_id=eq.${user.id}`,
        }, (payload) => {
          console.log('New received offer received:', payload);
          callback({ type: 'new_offer', role: 'seller', data: payload.new });
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'offers',
          filter: `buyer_id=eq.${user.id}`,
        }, (payload) => {
          console.log('Offer update received (as buyer):', payload);
          callback({ 
            type: 'offer_update', 
            role: 'buyer', 
            data: payload.new, 
            oldData: payload.old 
          });
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'offers',
          filter: `seller_id=eq.${user.id}`,
        }, (payload) => {
          console.log('Offer update received (as seller):', payload);
          callback({
            type: 'offer_update', 
            role: 'seller', 
            data: payload.new, 
            oldData: payload.old 
          });
        });
        
      // Subscribe to the channel
      channel.subscribe((status) => {
        console.log(`Offer subscription status for user ${user.id}:`, status);
        if (status === 'SUBSCRIBED') {
          // Store the channel for future use
          offerChannels[user.id] = channel;
        }
      });
      
      return channel;
    } catch (error) {
      console.error('Error setting up offer subscription:', error);
      return { unsubscribe: () => {} };
    }
  };
  
  return handleSubscription();
};

// Add this function to help debug database issues
export const getTableStructure = async (tableName) => {
  try {
    // Query the database for table information using the system catalog
    const { data, error } = await supabase
      .rpc('get_table_info', { table_name: tableName });
    
    if (error) {
      console.error('Error fetching table structure:', error);
      return { data: null, error: error.message };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Exception fetching table structure:', error);
    return { data: null, error: error.message };
  }
};

// Featured Listings functions
export const getFeaturedListings = async ({ 
  limit = 8, 
  featuredType = 'popular', // 'popular', 'newest', 'topRated'
  excludeIds = []
}) => {
  try {
    console.log(`Fetching featured listings of type: ${featuredType}, limit: ${limit}`);
    
    // Start with a simpler query to avoid foreign table issues
    let query = supabase
      .from('listings')
      .select(`
        *,
        users (id, name, university)
      `)
      .eq('status', 'available');
    
    // For popular listings, only show those with approved promotion status
    if (featuredType === 'popular') {
      query = query.eq('promotion_status', 'approved')
                  .eq('is_featured', true);
    }

    // Exclude specific listing IDs if provided
    if (excludeIds && excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    // Apply sorting based on the featured type
    switch (featuredType) {
      case 'popular':
        // For popular, just use created_at since we don't have reliable view data yet
        query = query.order('created_at', { ascending: false });
        break;
      
      case 'newest':
        // For newest listings, we order by creation date
        query = query.order('created_at', { ascending: false });
        break;
        
      case 'topRated':
        // For now, also fall back to creation date
        query = query.order('created_at', { ascending: false });
        break;
        
      default:
        // Default sort by creation date
        query = query.order('created_at', { ascending: false });
    }

    // Limit the number of results
    query = query.limit(limit);

    console.log('Executing Supabase query...');
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log('No listings found for featured type:', featuredType);
      return { data: [], error: null };
    }
    
    console.log(`Successfully fetched ${data.length} listings`);
    
    // Process the data to make it more usable
    const processedData = data.map(listing => {
      try {
        return {
          ...listing,
          seller: listing.users || { name: 'Unknown Seller' }
        };
      } catch (err) {
        console.error('Error processing listing:', err, listing);
        // Return a safe version of the listing
        return {
          ...listing,
          seller: { name: 'Unknown Seller' }
        };
      }
    });
    
    return { data: processedData, error: null };
  } catch (error) {
    console.error('Error fetching featured listings:', error);
    return { data: [], error: error.message || 'Unknown error fetching listings' };
  }
};

// Track listing views
export const trackListingView = async (listingId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Skip if no user is logged in
    if (!user) return { success: false, error: "User not authenticated" };
    
    // Check if this user has already viewed this listing recently (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const { data: existingView, error: checkError } = await supabase
      .from('viewed_listings')
      .select('id')
      .eq('user_id', user.id)
      .eq('listing_id', listingId)
      .gte('viewed_at', oneDayAgo.toISOString())
      .single();
      
    // If there's already a recent view, don't add another one
    if (!checkError && existingView) {
      return { success: true, error: null };
    }
    
    // Insert a new view record
    const { error } = await supabase
      .from('viewed_listings')
      .insert({
        listing_id: listingId,
        user_id: user.id,
        viewed_at: new Date().toISOString()
      });
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error tracking listing view:', error);
    return { success: false, error: error.message };
  }
};

// Test database connectivity
export const testDatabaseConnection = async () => {
  try {
    console.log('Testing database connection...');
    
    // Stage 1: Basic connection test - try to get a single record from the listings table
    console.log('Stage 1: Basic connection test');
    const { data: listingData, error: listingError } = await supabase
      .from('listings')
      .select('id')
      .limit(1);
      
    if (listingError) {
      console.error('Basic connection test failed:', listingError);
      return { 
        success: false, 
        error: `Connection failed: ${listingError.message}`,
        stage: 'basic_connection'
      };
    }
    
    // Stage 2: Test auth status
    console.log('Stage 2: Testing authentication status');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth test failed:', authError);
      return { 
        success: false, 
        error: `Authentication failed: ${authError.message}`,
        stage: 'authentication'
      };
    }
    
    if (!user) {
      console.log('No authenticated user found');
      return {
        success: true,
        data: {
          message: 'Connected to database but no authenticated user',
          tables_checked: ['listings'],
          auth_status: 'unauthenticated'
        }
      };
    }
    
    // Stage 3: Test conversations table
    console.log('Stage 3: Testing conversations table');
    const { data: conversationData, error: conversationError } = await supabase
      .from('conversations')
      .select('id')
      .limit(1);
    
    if (conversationError) {
      console.error('Conversations table test failed:', conversationError);
      return { 
        success: false, 
        error: `Conversations table error: ${conversationError.message}`,
        stage: 'conversations'
      };
    }
    
    // Stage 4: Test message creation (if user is authenticated)
    console.log('Stage 4: Testing permissions by attempting to create a test message');
    
    // First create a test conversation
    const { data: testConversation, error: testConvError } = await supabase
      .from('conversations')
      .insert({
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (testConvError) {
      console.error('Test conversation creation failed:', testConvError);
      return { 
        success: false, 
        error: `Conversation creation failed: ${testConvError.message}. This may be due to RLS policies.`,
        stage: 'create_conversation'
      };
    }
    
    // Add the user as participant
    const { error: participantError } = await supabase
      .from('conversation_participants')
      .insert({
        conversation_id: testConversation.id,
        user_id: user.id
      });
    
    if (participantError) {
      console.error('Adding participant failed:', participantError);
      return { 
        success: false, 
        error: `Adding conversation participant failed: ${participantError.message}. This may be due to RLS policies.`,
        stage: 'add_participant'
      };
    }
    
    // Try to insert a test message
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: testConversation.id,
        sender_id: user.id,
        content: 'Test message for connection diagnosis',
        created_at: new Date().toISOString()
      });
    
    // Clean up - remove test data regardless of success
    await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', testConversation.id);
    
    await supabase
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', testConversation.id);
    
    await supabase
      .from('conversations')
      .delete()
      .eq('id', testConversation.id);
    
    if (messageError) {
      console.error('Message creation test failed:', messageError);
      return { 
        success: false, 
        error: `Message creation failed: ${messageError.message}. This may be due to RLS policies.`,
        stage: 'create_message'
      };
    }
    
    console.log('All database tests passed successfully');
    return { 
      success: true, 
      data: {
        message: 'Database connection and permissions test passed',
        auth_status: 'authenticated',
        user_id: user.id,
        tables_checked: ['listings', 'conversations', 'conversation_participants', 'messages'],
        permissions: {
          can_read: true,
          can_create_conversation: true,
          can_send_message: true
        }
      }
    };
  } catch (error) {
    console.error('Exception in database connection test:', error);
    return { 
      success: false, 
      error: `Connection test failed with exception: ${error.message}`,
      stage: 'uncaught_exception'
    };
  }
};

// Create a system notification for a user
export const createSystemNotification = async ({ 
  userId, 
  message, 
  type = 'system', 
  relatedId = null, 
  listingId = null 
}) => {
  try {
    if (!userId) throw new Error('User ID is required');
    if (!message) throw new Error('Message is required');
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        message,
        related_id: relatedId,
        listing_id: listingId,
        read: false,
        created_at: new Date().toISOString()
      });
      
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating system notification:', error);
    return { success: false, error: error.message };
  }
};

// Function to check if the notifications table exists
export const checkNotificationsTable = async () => {
  try {
    console.log('Checking if notifications table exists...');
    
    // First, check if we can list tables in the schema
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_schema_info');
    
    if (tablesError) {
      console.error('Error getting schema info:', tablesError);
      
      // Try a simpler approach - check if we can select from the table
      const { data, error } = await supabase
        .from('notifications')
        .select('count(*)', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error accessing notifications table:', error);
        return { 
          exists: false, 
          error: error.message,
          errorCode: error.code,
          hint: 'The notifications table might not exist or you might not have access to it.'
        };
      }
      
      return { exists: true, data };
    }
    
    // If we got the tables list, check if notifications is in it
    console.log('Available tables:', tables);
    const notificationsTable = tables?.find(t => t.name === 'notifications');
    
    return { 
      exists: !!notificationsTable,
      schema: tables,
      notificationsTable
    };
  } catch (error) {
    console.error('Error checking notifications table:', error);
    return { exists: false, error: error.message };
  }
};

// Function to create the notifications table if it doesn't exist
export const createNotificationsTable = async () => {
  try {
    console.log('Attempting to create notifications table...');
    
    // First check if the table exists
    const { exists, error: checkError } = await checkNotificationsTable();
    
    if (exists) {
      console.log('Notifications table already exists.');
      return { success: true, message: 'Table already exists' };
    }
    
    if (checkError) {
      console.warn('Error checking if notifications table exists:', checkError);
    }
    
    // Try to create the table using SQL
    // Note: This will only work if the user has sufficient permissions
    const { error } = await supabase.rpc('create_notifications_table');
    
    if (error) {
      console.error('Error creating notifications table:', error);
      return { 
        success: false, 
        error: error.message,
        hint: 'You might not have permission to create tables. Contact your database administrator.' 
      };
    }
    
    return { success: true, message: 'Notifications table created successfully' };
  } catch (error) {
    console.error('Exception creating notifications table:', error);
    return { success: false, error: error.message };
  }
};

// Function to create a conversation or get an existing one between two users
export const createOrGetConversation = async ({ receiverId, listingId, initialMessage }) => {
  try {
    if (!receiverId) {
      console.error('No receiver ID provided');
      return { conversation: null, error: 'Receiver ID is required' };
    }
    
    console.log('Creating/getting conversation with receiver:', receiverId, 'about listing:', listingId);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('User not authenticated');
      return { conversation: null, error: 'User not authenticated' };
    }
    
    // Use our RLS-bypassing function to create or get a conversation
    console.log('Using RLS-bypassing function to create or get conversation');
    const { data: result, error: funcError } = await supabase.rpc(
      'create_conversation_with_participants',
      {
        user1_uuid: user.id,
        user2_uuid: receiverId,
        listing_uuid: listingId || null
      }
    );
    
    if (funcError) {
      console.error('Error creating/getting conversation:', funcError);
      return { conversation: null, error: `Failed to create conversation: ${funcError.message}` };
    }
    
    if (!result || !result.success) {
      console.error('Function returned error:', result?.error || 'Unknown error');
      return { conversation: null, error: result?.error || 'Unknown error creating conversation' };
    }
    
    console.log('Conversation operation result:', result);
    const conversationId = result.conversation_id;
    
    // Send initial message if provided
    if (initialMessage && initialMessage.trim()) {
      console.log('Sending initial message to conversation');
      const { error: messageError } = await sendInitialMessage({
        conversationId: conversationId,
        content: initialMessage.trim(),
        listingId
      });
      
      if (messageError) {
        console.error('Error sending initial message:', messageError);
        return { conversation: null, error: `Failed to send message: ${messageError}` };
      }
    }
    
    // Get complete conversation details using RLS-bypassing function
    const { data: detailsResult, error: detailsError } = await supabase.rpc(
      'get_conversation_details',
      { conv_id: conversationId }
    );
    
    if (detailsError) {
      console.error('Error getting conversation details:', detailsError);
      return { conversation: null, error: `Failed to retrieve conversation details: ${detailsError.message}` };
    }
    
    if (!detailsResult || !detailsResult.success) {
      console.error('Function returned error:', detailsResult?.error || 'Unknown error');
      return { conversation: null, error: detailsResult?.error || 'Failed to retrieve conversation details' };
    }
    
    console.log('Successfully returned conversation');
    return { conversation: detailsResult.conversation, error: null };
  } catch (error) {
    console.error('Exception in createOrGetConversation:', error);
    return { conversation: null, error: `Error in message system: ${error.message || 'Unknown error'}` };
  }
};

// Send initial message when creating a conversation
export const sendInitialMessage = async ({ conversationId, content, listingId }) => {
  try {
    if (!conversationId) {
      console.error('No conversation ID provided to sendInitialMessage');
      return { data: null, error: 'No conversation ID provided' };
    }
    
    if (!content || !content.trim()) {
      console.error('No message content provided to sendInitialMessage');
      return { data: null, error: 'Message content is required' };
    }
    
    console.log('Sending initial message to conversation:', conversationId);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('User not authenticated in sendInitialMessage');
      return { data: null, error: 'User not authenticated' };
    }
    
    // Instead of verification steps, use a direct RPC function to send the message
    // This will handle all checks and message creation in one step
    const { data: result, error: sendError } = await supabase.rpc(
      'send_message_to_conversation',
      {
        conv_id: conversationId,
        sender_id: user.id,
        message_content: content.trim(),
        related_listing_id: listingId || null
      }
    );
    
    if (sendError) {
      console.error('Error sending message:', sendError);
      return { data: null, error: `Failed to send message: ${sendError.message}` };
    }
    
    if (!result || !result.success) {
      console.error('Function returned error:', result?.error || 'Unknown error');
      return { data: null, error: result?.error || 'Failed to send message' };
    }
    
    console.log('Message sent successfully:', result);
    
    return { data: result.message, error: null };
  } catch (error) {
    console.error('Error in sendInitialMessage:', error);
    return { data: null, error: error.message };
  }
};

// Function to test the messaging system
export const testMessageSystem = async () => {
  try {
    console.log('Testing messaging system...');
    
    // Stage 1: Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth check failed:', authError);
      return { 
        success: false, 
        error: 'Authentication failed. Please log in.', 
        stage: 'authentication' 
      };
    }
    
    if (!user) {
      return { 
        success: false, 
        error: 'Not authenticated. You must be logged in to test messaging.', 
        stage: 'authentication' 
      };
    }
    
    // Stage 2: Test our RLS-bypassing function
    console.log('Testing conversation creation function...');
    const { data: result, error: funcError } = await supabase.rpc(
      'create_conversation_with_participants',
      {
        user1_uuid: user.id,
        user2_uuid: user.id, // This should fail as you can't message yourself
        listing_uuid: null
      }
    );
    
    if (funcError) {
      console.error('Error testing conversation function:', funcError);
      return { 
        success: false, 
        error: `Function test failed: ${funcError.message}`, 
        stage: 'function_test',
        details: { error: funcError }
      };
    }
    
    // Check if the function correctly prevented messaging yourself
    if (result && !result.success && result.error.includes('yourself')) {
      console.log('Successfully validated user cannot message themselves');
    } else {
      console.error('Unexpected result from function test:', result);
      return {
        success: false,
        error: 'Function did not properly validate input',
        stage: 'function_validation',
        details: { result }
      };
    }
    
    // Stage 3: Create a test conversation with a dummy ID
    // Use a UUID that won't exist in your system
    const testReceiverId = '00000000-0000-0000-0000-000000000001';
    
    console.log('Creating test conversation...');
    const { data: convResult, error: convError } = await supabase.rpc(
      'create_conversation_with_participants',
      {
        user1_uuid: user.id,
        user2_uuid: testReceiverId,
        listing_uuid: null
      }
    );
    
    if (convError) {
      console.error('Error creating test conversation:', convError);
      return { 
        success: false, 
        error: `Failed to create test conversation: ${convError.message}`, 
        stage: 'create_conversation',
        details: { error: convError }
      };
    }
    
    if (!convResult || !convResult.success) {
      console.error('Function returned error:', convResult?.error || 'Unknown error');
      return {
        success: false,
        error: convResult?.error || 'Unknown error creating conversation',
        stage: 'create_conversation',
        details: { result: convResult }
      };
    }
    
    const conversationId = convResult.conversation_id;
    console.log('Created test conversation:', conversationId);
    
    // Stage 4: Send a test message
    console.log('Sending test message...');
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: 'This is a test message for debugging purposes',
        created_at: new Date().toISOString()
      });
    
    // Record the result before cleanup
    let testResult;
    
    if (messageError) {
      console.error('Error sending test message:', messageError);
      testResult = { 
        success: false, 
        error: `Failed to send test message: ${messageError.message}`, 
        stage: 'send_message',
        details: { error: messageError }
      };
    } else {
      console.log('Message sent successfully');
      testResult = { 
        success: true, 
        data: {
          message: 'Messaging system is working correctly',
          conversationId: conversationId,
          userId: user.id,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    // Stage 5: Clean up
    console.log('Cleaning up test data...');
    // Delete message(s)
    await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId);
      
    // Delete participants - needs to use RLS bypass in production
    try {
      await supabase
        .from('conversation_participants')
        .delete()
        .eq('conversation_id', conversationId);
    } catch (error) {
      console.error('Error deleting participants (expected in some cases):', error);
    }
      
    // Delete conversation
    await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);
    
    console.log('Cleanup complete');
    
    return testResult;
  } catch (error) {
    console.error('Exception in message system test:', error);
    return { 
      success: false, 
      error: `Message system test failed: ${error.message}`, 
      stage: 'uncaught_exception' 
    };
  }
};

// Function to fix conversation participants RLS issues
export const fixConversationParticipantsRLS = async () => {
  try {
    const { data, error } = await supabase.rpc('fix_conversation_participants');
    
    if (error) {
      console.error('Error fixing conversation participants:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (err) {
    console.error('Exception in fixConversationParticipantsRLS:', err);
    return { success: false, error: err.message };
  }
};

// Function to diagnose and fix notification system issues
export const fixNotificationSystem = async (userId) => {
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { 
        success: false, 
        error: 'User not authenticated',
        steps: [] 
      };
    }
    userId = user.id;
  }
  
  const result = {
    steps: [],
    errors: [],
    success: true
  };
  
  try {
    // 1. Check if notification badges function works
    result.steps.push('Testing notification badges function...');
    const { data: badgeData, error: badgeError } = await supabase.rpc(
      'get_notification_badges',
      { user_uuid: userId }
    );
    
    if (badgeError) {
      result.steps.push('❌ Error calling get_notification_badges function');
      result.errors.push(`Badge function error: ${badgeError.message}`);
      result.success = false;
    } else {
      result.steps.push('✅ get_notification_badges function working');
    }
    
    // 2. Verify notification trigger
    result.steps.push('Checking notification trigger...');
    try {
      const { data: triggerInfo, error: triggerError } = await supabase.rpc(
        'admin_check_trigger_exists',
        { trigger_name: 'on_message_insert' }
      );
      
      if (triggerError) {
        result.steps.push('❓ Could not verify trigger (admin rights required)');
      } else if (!triggerInfo || !triggerInfo.exists) {
        result.steps.push('❌ Warning: Message notification trigger missing');
        result.errors.push('Notification trigger may be missing - contact administrator');
        result.success = false;
      } else {
        result.steps.push('✅ Message notification trigger exists');
      }
    } catch (err) {
      result.steps.push('❓ Error checking trigger - limited permissions');
    }
    
    // 3. Check notifications count directly
    result.steps.push('Checking notifications table content...');
    const { data: notifs, error: notifError } = await supabase
      .from('notifications')
      .select('count')
      .eq('user_id', userId);
      
    if (notifError) {
      result.steps.push('❌ Error accessing notifications table');
      result.errors.push(`Notification table error: ${notifError.message}`);
      result.success = false;
    } else {
      const notifCount = parseInt(notifs?.count || 0);
      result.steps.push(`✅ Found ${notifCount} notifications in table`);
    }
    
    // 4. Try to read user's unread notifications
    result.steps.push('Checking unread notifications...');
    const { data: unreadNotifs, error: unreadError } = await supabase
      .from('notifications')
      .select('id, type')
      .eq('user_id', userId)
      .eq('read', false);
      
    if (unreadError) {
      result.steps.push('❌ Error reading unread notifications');
      result.errors.push(`Unread query error: ${unreadError.message}`);
      result.success = false;
    } else {
      const unreadCount = unreadNotifs?.length || 0;
      result.steps.push(`✅ Found ${unreadCount} unread notifications`);
      
      // Count by type
      if (unreadNotifs && unreadNotifs.length > 0) {
        const messageCount = unreadNotifs.filter(n => n.type === 'message').length;
        const offerCount = unreadNotifs.filter(n => 
          n.type === 'offer' || n.type === 'offer_response'
        ).length;
        const otherCount = unreadNotifs.length - messageCount - offerCount;
        
        result.steps.push(`Types: ${messageCount} messages, ${offerCount} offers, ${otherCount} other`);
      }
    }
    
    return result;
  } catch (err) {
    console.error('Exception in fixNotificationSystem:', err);
    return { 
      success: false, 
      error: err.message,
      steps: ['Error occurred during diagnosis'],
      errors: [err.message]
    };
  }
};

// Update user presence in a conversation
export const updateUserPresence = async (conversationId, isOnline = true) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Cannot update presence: User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }

    if (!conversationId) {
      console.error('Cannot update presence: No conversation ID provided');
      return { success: false, error: 'Conversation ID is required' };
    }
    
    // Call the RLS-bypassing function to update presence
    const { data: result, error } = await supabase.rpc(
      'update_user_presence',
      {
        user_uuid: user.id,
        conv_id: conversationId,
        is_online: isOnline
      }
    );
    
    if (error) {
      console.error('Error updating presence:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Exception in updateUserPresence:', error);
    return { success: false, error: error.message };
  }
};

// Get users currently online in a conversation
export const getOnlineUsers = async (conversationId) => {
  try {
    if (!conversationId) {
      console.error('Cannot get online users: No conversation ID provided');
      return { success: false, error: 'Conversation ID is required' };
    }
    
    // Call the RLS-bypassing function to get online users
    const { data: result, error } = await supabase.rpc(
      'get_online_users_in_conversation',
      { conv_id: conversationId }
    );
    
    if (error) {
      console.error('Error getting online users:', error);
      return { success: false, error: error.message };
    }
    
    if (!result || !result.success) {
      console.error('Function returned error:', result?.error || 'Unknown error');
      return { success: false, error: result?.error || 'Failed to get online users' };
    }
    
    // Transform the array into a map for easier lookup
    const onlineUsersMap = {};
    if (result.online_users && Array.isArray(result.online_users)) {
      result.online_users.forEach(user => {
        onlineUsersMap[user.user_id] = {
          lastSeen: user.last_seen,
          isOnline: true
        };
      });
    }
    
    return { success: true, data: onlineUsersMap };
  } catch (error) {
    console.error('Exception in getOnlineUsers:', error);
    return { success: false, error: error.message };
  }
};

// Function to check and list available storage buckets
export const listStorageBuckets = async () => {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing storage buckets:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Available storage buckets:', data);
    return { success: true, buckets: data || [] };
  } catch (error) {
    console.error('Exception listing storage buckets:', error);
    return { success: false, error: error.message };
  }
};

// Function to test avatar storage bucket permissions
export const testAvatarStorage = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }
    
    console.log('Testing storage bucket permissions...');
    
    // First, check what buckets are available
    const { success: bucketListSuccess, buckets, error: bucketListError } = await listStorageBuckets();
    
    if (!bucketListSuccess) {
      return { 
        success: false, 
        error: 'Failed to list storage buckets: ' + bucketListError,
        stage: 'list_buckets'
      };
    }
    
    if (!buckets || buckets.length === 0) {
      return {
        success: false,
        error: 'No storage buckets exist in your Supabase project. Please create one in the Supabase dashboard.',
        stage: 'no_buckets'
      };
    }
    
    // Check if 'avatars' bucket exists, if not use the first available bucket
    let bucketToUse = 'avatars';
    let bucketExists = buckets.some(bucket => bucket.name === 'avatars');
    
    if (!bucketExists) {
      bucketToUse = buckets[0].name;
      console.log(`'avatars' bucket not found, using '${bucketToUse}' bucket instead`);
    }
    
    // Test 2: Try to list objects in the public folder
    const { data: publicFiles, error: listError } = await supabase.storage
      .from(bucketToUse)
      .list('public');
    
    if (listError) {
      console.error(`Error listing files in public folder of ${bucketToUse}:`, listError);
      
      // If we can't list public, try listing the user's folder
      const { data: userFiles, error: userListError } = await supabase.storage
        .from(bucketToUse)
        .list(user.id);
      
      if (userListError) {
        console.error(`Error listing files in user folder of ${bucketToUse}:`, userListError);
        
        // Try listing the root of the bucket
        const { data: rootFiles, error: rootListError } = await supabase.storage
          .from(bucketToUse)
          .list();
          
        if (rootListError) {
          console.error(`Error listing files at root of ${bucketToUse}:`, rootListError);
          return {
            success: false,
            error: `Cannot access bucket contents: ${rootListError.message}`,
            stage: 'list_root',
            availableBuckets: buckets.map(b => b.name).join(', ')
          };
        }
        
        // We can at least list the root, try to create a file there
        const testRootFileName = `test-${Date.now()}.txt`;
        const { error: rootUploadError } = await supabase.storage
          .from(bucketToUse)
          .upload(testRootFileName, 'Test content', {
            contentType: 'text/plain',
            upsert: true
          });
          
        if (rootUploadError) {
          return {
            success: false,
            error: `Cannot write to bucket root: ${rootUploadError.message}`,
            stage: 'upload_root',
            recommendedAction: 'Create a public or user folder in the bucket with appropriate permissions'
          };
        }
        
        // Clean up test file
        await supabase.storage
          .from(bucketToUse)
          .remove([testRootFileName]);
          
        return {
          success: true,
          message: `Can write to the root of ${bucketToUse} bucket`,
          recommendedPath: '', // Empty string for root path
          bucket: bucketToUse
        };
      }
      
      console.log(`Files in user folder (${user.id}):`, userFiles);
      return {
        success: true,
        message: `Can list files in user folder of ${bucketToUse} bucket`,
        recommendedPath: `${user.id}/`,
        bucket: bucketToUse
      };
    }
    
    console.log(`Files in public folder of ${bucketToUse}:`, publicFiles);
    
    // Test 3: Create a test file
    const testContent = 'Test file to verify storage permissions';
    const testFileName = `public/test-${Date.now()}.txt`;
    
    const { error: uploadError } = await supabase.storage
      .from(bucketToUse)
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
        upsert: true
      });
    
    if (uploadError) {
      console.error(`Error uploading test file to ${bucketToUse}:`, uploadError);
      return {
        success: false,
        error: `Upload test failed: ${uploadError.message}`,
        stage: 'upload_test',
        recommendedPath: uploadError.message.includes('permission') ? 
          `${user.id}/` : 'public/',
        bucket: bucketToUse
      };
    }
    
    // Clean up test file
    await supabase.storage
      .from(bucketToUse)
      .remove([testFileName]);
    
    return {
      success: true,
      message: `Storage bucket ${bucketToUse} is properly configured`,
      recommendedPath: 'public/',
      bucket: bucketToUse
    };
  } catch (error) {
    console.error('Exception testing avatar storage:', error);
    return {
      success: false,
      error: error.message,
      stage: 'exception'
    };
  }
};

// Diagnostic function to check Supabase connectivity and configuration
export const diagnoseSupabaseConnection = async () => {
  try {
    console.log('=== SUPABASE CONNECTION DIAGNOSTICS ===');
    console.log('Supabase URL:', supabase.supabaseUrl);
    
    // Check if we can get the user (authentication check)
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Auth error:', userError);
      return {
        success: false,
        error: 'Authentication error: ' + userError.message,
        stage: 'auth'
      };
    }
    
    console.log('Authenticated user:', userData.user ? userData.user.email : 'Not authenticated');
    
    // Try to list buckets with more detailed error handling
    try {
      console.log('Attempting to list storage buckets...');
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Bucket listing error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        return {
          success: false,
          error: 'Storage bucket listing error: ' + error.message,
          code: error.code,
          hint: error.hint || "Check if Storage service is enabled for your project",
          stage: 'list_buckets'
        };
      }
      
      console.log('Storage buckets:', data);
      
      if (!data || data.length === 0) {
        return {
          success: true,
          message: 'Connection successful but no buckets found',
          buckets: []
        };
      }
      
      // Try to list files in the first bucket
      const firstBucket = data[0].name;
      console.log(`Testing access to bucket: ${firstBucket}`);
      
      const { data: fileList, error: fileError } = await supabase.storage
        .from(firstBucket)
        .list();
        
      if (fileError) {
        console.error('File listing error:', fileError);
        return {
          success: true,
          message: 'Connected to Supabase and found buckets, but cannot list files',
          buckets: data.map(b => b.name),
          fileError: fileError.message
        };
      }
      
      console.log(`Files in ${firstBucket}:`, fileList);
      
      return {
        success: true,
        message: 'Full Supabase connection successful',
        buckets: data.map(b => b.name),
        fileCount: fileList.length
      };
    } catch (storageError) {
      console.error('Storage operation exception:', storageError);
      return {
        success: false,
        error: 'Storage exception: ' + storageError.message,
        stage: 'storage_exception'
      };
    }
  } catch (error) {
    console.error('Diagnostic error:', error);
    return {
      success: false,
      error: 'Diagnostic error: ' + error.message,
      stage: 'general'
    };
  }
};

// Get seller statistics for a user
export const getSellerStatistics = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        status,
        price,
        created_at
      `)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    // Calculate statistics
    const total = data.length;
    const available = data.filter(item => item.status === 'available').length;
    const sold = data.filter(item => item.status === 'sold').length;
    const pending = data.filter(item => item.status === 'pending').length;
    
    // Calculate total value
    const totalValue = data.reduce((sum, item) => sum + parseFloat(item.price), 0);
    const soldValue = data
      .filter(item => item.status === 'sold')
      .reduce((sum, item) => sum + parseFloat(item.price), 0);
    
    // Get most recent listing date
    let mostRecent = null;
    if (data.length > 0) {
      mostRecent = new Date(Math.max(...data.map(item => new Date(item.created_at))));
    }
    
    return {
      totalListings: total,
      availableListings: available,
      soldListings: sold,
      pendingListings: pending,
      totalValue,
      soldValue,
      mostRecentListing: mostRecent
    };
  } catch (error) {
    console.error('Error getting seller statistics:', error);
    return {
      totalListings: 0,
      availableListings: 0,
      soldListings: 0,
      pendingListings: 0,
      totalValue: 0,
      soldValue: 0,
      mostRecentListing: null
    };
  }
};

// Admin helper functions
export const adminDeleteListing = async (listingId) => {
  try {
    // First, get the listing to record details in the audit log
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .single();

    if (fetchError) throw fetchError;
    
    // Try to use the database function first
    const { data, error: rpcError } = await supabase
      .rpc('admin_delete_listing', { p_listing_id: listingId });
    
    // If the function doesn't exist or fails, fall back to manual deletion
    if (rpcError) {
      console.log('RPC function failed, using direct deletion fallback:', rpcError);
      
      // Direct deletion with explicit column references
      const { error: deleteError } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);
        
      if (deleteError) throw deleteError;
    }
    
    return { success: true, listing };
  } catch (error) {
    console.error('Error in adminDeleteListing:', error);
    return { success: false, error };
  }
};

export const adminBulkDeleteListings = async (listingIds) => {
  try {
    // Get the listings for the audit log
    const { data: listings, error: fetchError } = await supabase
      .from('listings')
      .select('id, title, user_id')
      .in('id', listingIds);
      
    if (fetchError) throw fetchError;
    
    // Try to use the database function first
    const { data, error: rpcError } = await supabase
      .rpc('admin_bulk_delete_listings', { p_listing_ids: listingIds });
    
    // If the function doesn't exist or fails, fall back to individual deletions
    if (rpcError) {
      console.log('RPC bulk function failed, using individual deletion fallback:', rpcError);
      
      // Delete each listing individually
      let successCount = 0;
      for (const listing of listings) {
        // Use the single item deletion function we already have
        const { success } = await adminDeleteListing(listing.id);
        if (success) successCount++;
      }
      
      return { 
        success: true, 
        count: successCount,
        listings 
      };
    }
    
    return { 
      success: true, 
      count: data || listings.length, // Use the count returned by the function if available
      listings 
    };
  } catch (error) {
    console.error('Error in adminBulkDeleteListings:', error);
    return { success: false, error };
  }
};

// User level function to delete their own listings
export const userDeleteListing = async (listingId) => {
  try {
    console.log('Starting basic deletion process for listing:', listingId);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
      return { success: false, error: { message: 'Not authenticated' } };
    }
    
    console.log('Current user ID:', user.id);
    
    // First verify the listing exists and belongs to the user
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('id, user_id, title')
      .eq('id', listingId)
      .single();
      
    if (fetchError) {
      console.error('Error fetching listing:', fetchError);
      return { success: false, error: fetchError };
    }
    
    if (!listing) {
      console.error('Listing not found:', listingId);
      return { success: false, error: { message: 'Listing not found' } };
    }
    
    if (listing.user_id !== user.id) {
      console.error('User does not own this listing. Listing user_id:', listing.user_id);
      return { 
        success: false, 
        error: { message: 'You do not have permission to delete this listing' } 
      };
    }
    
    // Get all related offers first so we can delete them by ID
    const { data: offers, error: offersError } = await supabase
      .from('offers')
      .select('id')
      .eq('listing_id', listingId);
    
    if (offersError) {
      console.error('Error getting offers:', offersError);
      // Continue anyway
    } else if (offers && offers.length > 0) {
      console.log(`Found ${offers.length} offers to delete`);
      
      // Delete each offer by ID to avoid ambiguity
      for (const offer of offers) {
        console.log(`Deleting offer by ID: ${offer.id}`);
        
        const { error: deleteOfferError } = await supabase
          .from('offers')
          .delete()
          .eq('id', offer.id);  // Changed from match to eq with specific column
          
        if (deleteOfferError) {
          console.error(`Error deleting offer ${offer.id}:`, deleteOfferError);
          // Continue with others
        }
      }
    }
    
    // Delete saved listings
    console.log('Deleting saved listings for listing ID:', listingId);
    const { error: savedError } = await supabase
      .from('saved_listings')
      .delete()
      .eq('listing_id', listingId);  // Changed from match to eq with specific column
      
    if (savedError) {
      console.error('Error deleting saved listings:', savedError);
      // Continue anyway
    }
    
    // Finally delete the listing itself - using raw RPC to avoid ambiguity
    console.log('Deleting the main listing with ID:', listingId);
    try {
      // Try to use RPC function if it exists
      const { error: rpcError } = await supabase.rpc('delete_listing_by_id', { 
        p_listing_id: listingId,
        p_user_id: user.id 
      });
      
      if (rpcError) {
        console.error('RPC delete failed, trying direct delete:', rpcError);
        throw rpcError; // Move to fallback
      }
      
      console.log('Successfully deleted listing via RPC');
      return { success: true };
    } catch (rpcError) {
      // Fallback to direct delete with more specific query
      const { error: directDeleteError } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId)
        .eq('user_id', user.id);  // Add user ID constraint to avoid ambiguity
        
      if (directDeleteError) {
        console.error('Error deleting listing:', directDeleteError);
        return { success: false, error: directDeleteError };
      }
      
      console.log('Successfully deleted listing via direct query');
      return { success: true };
    }
  } catch (error) {
    console.error('Error in userDeleteListing:', error);
    return { success: false, error };
  }
};

export const getUserGrowthData = async (period = 'monthly', limit = 12) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, created_at')
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!users || users.length === 0) {
      return { data: [], error: null };
    }

    const currentDate = new Date();
    let growthData = [];
    
    if (period === 'daily') {
      // Last 30 days
      const days = Math.min(30, limit);
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        // Count new users for this day
        const count = users.filter(user => 
          new Date(user.created_at) >= date && 
          new Date(user.created_at) < nextDate
        ).length;
        
        // Count total users up to this day
        const totalCount = users.filter(user => 
          new Date(user.created_at) < nextDate
        ).length;
        
        growthData.push({
          date: format(date, 'MMM dd'),
          newUsers: count,
          totalUsers: totalCount
        });
      }
    } else if (period === 'weekly') {
      // Last x weeks
      const weeks = Math.min(52, limit);
      for (let i = weeks - 1; i >= 0; i--) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - (i * 7));
        endDate.setHours(23, 59, 59, 999);
        
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        
        // Count new users for this week
        const count = users.filter(user => 
          new Date(user.created_at) >= startDate && 
          new Date(user.created_at) <= endDate
        ).length;
        
        // Count total users up to the end of this week
        const totalCount = users.filter(user => 
          new Date(user.created_at) <= endDate
        ).length;
        
        growthData.push({
          date: `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd')}`,
          newUsers: count,
          totalUsers: totalCount
        });
      }
    } else { // monthly
      // Last x months
      const months = Math.min(36, limit); 
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        
        const nextMonth = new Date(date);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        // Count new users for this month
        const count = users.filter(user => 
          new Date(user.created_at) >= date && 
          new Date(user.created_at) < nextMonth
        ).length;
        
        // Count total users up to the end of this month
        const totalCount = users.filter(user => 
          new Date(user.created_at) < nextMonth
        ).length;
        
        growthData.push({
          date: format(date, 'MMM yyyy'),
          newUsers: count,
          totalUsers: totalCount
        });
      }
    }
    
    return { data: growthData, error: null };
  } catch (error) {
    console.error('Error fetching user growth data:', error);
    return { data: [], error: error.message };
  }
};

// Request a promotion for a listing
export const requestListingPromotion = async (listingId, promotionOptions) => {
  try {
    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    console.log('[Promotion Debug] Starting promotion request for listing:', listingId);
    console.log('[Promotion Debug] Promotion options:', promotionOptions);
    
    // First, verify that the user owns this listing
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, user_id, promotion_status, is_featured, is_priority')
      .eq('id', listingId)
      .single();
      
    if (listingError) {
      console.error('[Promotion Debug] Error fetching listing:', listingError);
      return { success: false, error: listingError.message };
    }
    
    if (listing.user_id !== user.id) {
      console.error('[Promotion Debug] User does not own this listing');
      return { success: false, error: 'You can only promote your own listings' };
    }
    
    console.log('[Promotion Debug] Current listing state before update:', listing);
    
    // Create a special function to directly update the database with service_role permissions
    // This is for debug purposes to diagnose the issue
    const { data: debugInfo, error: debugError } = await supabase.rpc('admin_debug_promotion', {
      listing_id: listingId,
      is_featured: promotionOptions.featured || false,
      is_priority: promotionOptions.priority || false
    });
    
    if (debugError) {
      console.error('[Promotion Debug] The admin debug function failed:', debugError);
      console.log('[Promotion Debug] Falling back to standard update method');
      
      // Fall back to standard update
      const { data: updateData, error: updateError } = await supabase
        .from('listings')
        .update({
          is_featured: promotionOptions.featured || false,
          is_priority: promotionOptions.priority || false,
          promotion_status: 'pending',
          updated_at: new Date()
        })
        .eq('id', listingId)
        .select('id, promotion_status, is_featured, is_priority');
      
      if (updateError) {
        console.error('[Promotion Debug] Error updating listing:', updateError);
        return { success: false, error: updateError.message };
      }
      
      console.log('[Promotion Debug] Standard update response:', updateData);
    } else {
      console.log('[Promotion Debug] Admin debug function response:', debugInfo);
    }
    
    // Verify by directly querying SQL
    const { data: sqlVerification, error: sqlError } = await supabase.rpc('get_listing_for_admin', {
      listing_id: listingId
    });
    
    if (sqlError) {
      console.error('[Promotion Debug] SQL verification error:', sqlError);
    } else {
      console.log('[Promotion Debug] SQL verification result:', sqlVerification);
    }
    
    // Final verification through standard API
    const { data: updatedListing, error: verifyError } = await supabase
      .from('listings')
      .select('id, promotion_status, is_featured, is_priority')
      .eq('id', listingId)
      .single();
      
    if (verifyError) {
      console.error('[Promotion Debug] Error verifying update:', verifyError);
      return { success: false, error: verifyError.message };
    }
    
    console.log('[Promotion Debug] Final verification result:', updatedListing);
    
    return { 
      success: true, 
      data: updatedListing || { promotion_status: 'pending', message: 'Update appears successful but verification return no data' }
    };
  } catch (error) {
    console.error('[Promotion Debug] Unexpected error:', error);
    return { success: false, error: error.message };
  }
};