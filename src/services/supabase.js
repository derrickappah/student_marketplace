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
        users (id, name, university),
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
export const ensureUserProfile = async (user_id = null, userData = null) => {
  try {
    // If specific user_id is not provided, get current user
    let userId = user_id;
    let userInfo = userData;
    
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('User not authenticated in ensureUserProfile');
        return { success: false, error: 'User not authenticated' };
      }
      
      userId = user.id;
      userInfo = user;
    }
    
    console.log('Checking user profile for ID:', userId);
    
    // Check if the user exists in the users table
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
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
    console.log('Creating user profile with ID:', userId);
    
    let name = 'New User';
    let email = `user-${userId.substring(0, 8)}@example.com`;
    let university = 'Default University';
    
    // If we have user info, extract details
    if (userInfo) {
      name = userInfo.user_metadata?.name || 
             userInfo.email?.split('@')[0] || 
             `User ${userId.substring(0, 6)}`;
             
      email = userInfo.email || email;
      university = userInfo.user_metadata?.university || university;
    }
    
    const userProfileData = {
      id: userId,
      email: email,
      name: name,
      university: university,
      created_at: new Date().toISOString()
    };
    
    console.log('User data for profile creation:', userProfileData);
    
    const { error: insertError } = await supabase
      .from('users')
      .insert([userProfileData]);
      
    if (insertError) {
      console.error('Error creating user profile:', insertError);
      return { success: false, error: `Error creating profile: ${insertError.message}` };
    }
    
    console.log('Successfully created user profile for:', userId);
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
export const sendMessage = async ({ conversation_id, content, images = null, replyToMessageId = null }) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const hasAttachments = images && images.length > 0;
    
    // Use the RLS-bypassing function to send the message
    const { data: result, error: sendError } = await supabase.rpc(
      'send_message_to_conversation',
      {
        conv_id: conversation_id,
        sender_id: user.id,
        message_content: content.trim(),
        message_images: images,
        related_listing_id: null,
        has_attachments: hasAttachments,
        reply_to_message_id: replyToMessageId
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
    
    // Fetch messages with sender information included
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        sender:sender_id(id, name, avatar_url, email, university),
        content,
        created_at,
        has_attachments,
        message_images,
        reply_to_message_id
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error getting messages:', error);
      throw new Error(`Failed to load messages: ${error.message}`);
    }
    
    // Get attachments separately if needed
    if (data && data.some(message => message.has_attachments)) {
      const messageIds = data
        .filter(message => message.has_attachments)
        .map(message => message.id);
        
      if (messageIds.length > 0) {
        const { data: attachments, error: attachmentsError } = await supabase
          .from('message_attachments')
          .select('*')
          .in('message_id', messageIds);
          
        if (!attachmentsError && attachments) {
          // Add attachments to messages
          data.forEach(message => {
            message.attachments = attachments.filter(att => att.message_id === message.id);
          });
        }
      }
    }
    
    // Ensure all messages have sender information
    // Create a map of user IDs that need to be fetched separately
    const missingUserIds = new Set();
    data.forEach(message => {
      if (!message.sender && message.sender_id) {
        missingUserIds.add(message.sender_id);
      }
    });
    
    // If there are missing users, fetch them
    if (missingUserIds.size > 0) {
      const missingUserIdsArray = Array.from(missingUserIds);
      console.log('Fetching missing user profiles:', missingUserIdsArray);
      
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, avatar_url, email, university')
        .in('id', missingUserIdsArray);
      
      if (!usersError && users) {
        // Create a map for quick lookup
        const userMap = {};
        users.forEach(user => {
          userMap[user.id] = user;
        });
        
        // Add missing user data to messages
        data.forEach(message => {
          if (!message.sender && message.sender_id && userMap[message.sender_id]) {
            message.sender = userMap[message.sender_id];
          } else if (!message.sender && message.sender_id) {
            // If still no user found, create a placeholder
            message.sender = {
              id: message.sender_id,
              name: 'Unknown User',
              avatar_url: null,
              email: null,
              university: null
            };
            
            // Try to create the profile in the background
            setTimeout(() => {
              // Use exported function
              exports.createBasicUserProfile(message.sender_id)
                .then(() => console.log('Created user profile for', message.sender_id))
                .catch(err => console.error('Failed to create user profile:', err));
            }, 100);
          }
        });
      }
    }
    
    return { data: data || [], error: null };
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
    
    // Use the RLS-bypassing function to mark messages as read
    const { data: result, error: funcError } = await supabase.rpc(
      'mark_conversation_messages_read',
      { 
        conv_id: conversationId,
        user_id: user.id
      }
    );
    
    if (funcError) {
      console.error('Error marking messages as read:', funcError);
      throw new Error(`Failed to mark messages as read: ${funcError.message}`);
    }
    
    if (!result || !result.success) {
      console.error('Function returned error:', result?.error || 'Unknown error');
      throw new Error(result?.error || 'Failed to mark messages as read');
    }
    
    console.log(`Marked ${result.affected_count} messages as read`);
    return { success: true, data: result, error: null };
  } catch (error) {
    console.error('Error marking thread as read:', error);
    return { success: false, data: null, error };
  }
};

export const getConversations = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Find the participant records for the current user
    const { data: participantRecords } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);
    
    if (!participantRecords || participantRecords.length === 0) {
      return { data: [], error: null };
    }
    
    // Get all conversation IDs the user is part of
    const conversationIds = participantRecords.map(p => p.conversation_id);
    
    // Fetch conversations without trying to embed listings directly
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .in('id', conversationIds)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching conversations:', error);
      throw new Error(`Failed to load conversations: ${error.message}`);
    }
    
    // Fetch additional data separately
    const conversationData = await Promise.all(conversations.map(async conversation => {
      // Get participants
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('user_id, user:users(id, name, avatar_url, email, university)')
        .eq('conversation_id', conversation.id);
      
      // Get listing if available
      let listing = null;
      if (conversation.listing_id) {
        const { data: listingData } = await supabase
          .from('listings')
          .select('id, title, price, images, status, description, seller_id')
          .eq('id', conversation.listing_id)
          .maybeSingle();
        
        listing = listingData;
      }
      
      // Get latest message
      const { data: messages } = await supabase
        .from('messages')
        .select('id, content, created_at, sender_id, has_attachments')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      const latestMessage = messages && messages.length > 0 ? messages[0] : null;
      
      // Find other participants (excluding current user)
      const otherParticipants = (participants || [])
        .filter(participant => participant.user_id !== user.id)
        .map(p => {
          if (!p.user) {
            return {
              id: p.user_id,
              name: "Unknown User",
              avatar_url: null,
              email: null,
              university: null,
              _placeholder: true
            };
          }
          return p.user;
        });
      
      return {
        ...conversation,
        participants,
        listing,
        latestMessage,
        otherParticipants,
        unseen_messages: 0
      };
    }));
    
    // After processing all conversations, try to fetch missing user profiles
    setTimeout(() => {
      conversationData.forEach(conversation => {
        conversation.otherParticipants.forEach(async participant => {
          if (participant._placeholder) {
            try {
              // Use exported function
              await exports.createBasicUserProfile(participant.id);
            } catch (err) {
              console.error('Error creating basic profile:', err);
            }
          }
        });
      });
    }, 100);
    
    return { data: conversationData, error: null };
  } catch (error) {
    console.error('Error in getConversations:', error);
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
  // Validate required parameters
  if (!conversationId || !userId) {
    console.error('Cannot track presence: Missing conversation ID or user ID', { conversationId, userId });
    return { unsubscribe: () => {} };
  }
  
  try {
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
  } catch (error) {
    console.error('Error tracking conversation presence:', error);
    return { unsubscribe: () => {} };
  }
};

// Store active typing channels to avoid recreating them
const typingChannels = {};

// Subscribe to typing indicators for a conversation
export const subscribeToTypingIndicators = (conversationId, callback) => {
  if (!conversationId) {
    console.error('Cannot subscribe: No conversation ID provided');
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
export const sendTypingIndicator = async (conversationId, isTyping) => {
  try {
    if (!conversationId) throw new Error('Conversation ID is required');
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');
    
    // Use the new function to update typing status
    const { data: result, error: funcError } = await supabase.rpc(
      'update_conversation_presence',
      {
        conv_id: conversationId,
        user_uuid: user.id,
        is_online: true, // Always online when typing
        is_typing: isTyping
      }
    );
    
    if (funcError) {
      console.error('Error updating typing status:', funcError);
      throw new Error(`Failed to update typing status: ${funcError.message}`);
    }
    
    if (!result || !result.success) {
      console.error('Function returned error:', result?.error || 'Unknown error');
      throw new Error(result?.error || 'Failed to update typing status');
    }
    
    // Broadcast typing indicator to the conversation channel
    const channel = supabase.channel(`presence:${conversationId}`);
    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: user.id,
        is_typing: isTyping,
        timestamp: new Date().toISOString()
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error in sendTypingIndicator:', error);
    return { success: false, error };
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
export const createReview = async (reviewData) => {
  try {
    // Handle both parameter formats
    const {
      sellerId, // May not be needed directly for product reviews if fetched from listing
      listingId,
      rating,
      comment,
      reviewType = 'seller', // Default to 'seller' if not provided
      reviewer_id
    } = reviewData;

    // Validate required fields
    if (!rating) {
      throw new Error('Rating is required');
    }
    // Allow empty comments, but ensure it's a string
    const finalComment = comment || '';

    // Get the current user if reviewer_id is not provided
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = reviewer_id || user?.id;

    if (!currentUserId) {
      throw new Error('You must be logged in or provide a reviewer_id to create a review');
    }

    let finalSellerId = sellerId;

    // If it's a product review, we must have listingId and fetch seller_id from the listing
    if (reviewType === 'product') {
      if (!listingId) {
        throw new Error('Listing ID is required for product reviews');
      }
      // Fetch the seller_id from the listing
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('user_id') // user_id is the seller_id in the listings table
        .eq('id', listingId)
        .single();

      if (listingError || !listing) {
        console.error('Error fetching listing for review:', listingError);
        throw new Error(`Failed to get listing information (ID: ${listingId}): ${listingError?.message || 'Listing not found'}`);
      }
      finalSellerId = listing.user_id; // The seller is the owner of the listing
    } else if (!finalSellerId) {
      // For seller reviews, sellerId is required directly
      throw new Error('Seller ID is required for seller reviews');
    }

    const reviewToCreate = {
      reviewer_id: currentUserId,
      rating,
      comment: finalComment, // Use the validated comment
      review_type: reviewType,
      seller_id: finalSellerId, // Use the determined seller ID
      listing_id: reviewType === 'product' ? listingId : null, // Correctly assign listing_id for product reviews
      created_at: new Date().toISOString(),
      // updated_at will be handled by the trigger or default value
    };

    console.log('Attempting to insert review:', reviewToCreate);

    const { data, error } = await supabase
      .from('reviews')
      .insert([reviewToCreate])
      .select()
      .single();

    if (error) {
      console.error('Error creating review in database:', error);
      // Check for specific Supabase errors if needed
      if (error.code === '23503') { // foreign key violation
          throw new Error(`Invalid reference: Ensure seller ID (${finalSellerId}) and listing ID (${listingId}) exist.`);
      }
      if (error.code === '23514') { // check constraint violation (e.g., rating)
          throw new Error(`Invalid data: ${error.message}`);
      }
      throw error; // Re-throw other errors
    }

    console.log('Review created successfully:', data);
    return { data }; // Return the created review data
  } catch (error) {
    // Log the detailed error and re-throw a user-friendly message
    console.error('Error caught in createReview function:', error);
    // Avoid exposing detailed SQL errors to the frontend if possible
    throw new Error(`Failed to create review: ${error.message}`);
  }
};

export const getUserReviews = async (userId) => {
  try {
    console.log(`Fetching reviews for seller ${userId}`);
    
    // First get all the reviews without the reviewer join
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('seller_id', userId)
      .eq('review_type', 'seller') // Only get seller reviews
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
    .eq('seller_id', userId)
    .eq('review_type', 'seller'); // Only consider seller reviews for user rating

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
    
    const currentTime = new Date().toISOString();
    
    // Check if this user has already viewed this listing
    const { data: existingView, error: checkError } = await supabase
      .from('viewed_listings')
      .select('id')
      .eq('user_id', user.id)
      .eq('listing_id', listingId)
      .maybeSingle();
      
    // If there's already a view from this user for this listing, update it
    if (!checkError && existingView) {
      const { error: updateError } = await supabase
        .from('viewed_listings')
        .update({ viewed_at: currentTime })
        .eq('id', existingView.id);
        
      if (updateError) throw updateError;
      return { success: true, error: null };
    }
    
    // Insert a new view record if no existing view
    const { error } = await supabase
      .from('viewed_listings')
      .insert({
        listing_id: listingId,
        user_id: user.id,
        viewed_at: currentTime
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
    
    // Ensure the seller has a profile - this helps with the "Unknown User" issue
    await createBasicUserProfile(receiverId);
    
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
    if (!conversationId) throw new Error('Conversation ID is required');
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');
    
    // Use the new function to update presence
    const { data: result, error: funcError } = await supabase.rpc(
      'update_conversation_presence',
      {
        conv_id: conversationId,
        user_uuid: user.id,
        is_online: isOnline,
        is_typing: false // Default to not typing
      }
    );
    
    if (funcError) {
      console.error('Error updating presence:', funcError);
      throw new Error(`Failed to update presence: ${funcError.message}`);
    }
    
    if (!result || !result.success) {
      console.error('Function returned error:', result?.error || 'Unknown error');
      throw new Error(result?.error || 'Failed to update presence');
    }
    
    // Broadcast presence update to the conversation channel
    const channel = supabase.channel(`presence:${conversationId}`);
    await channel.send({
      type: 'broadcast',
      event: 'presence',
      payload: {
        user_id: user.id,
        is_online: isOnline,
        is_typing: false,
        timestamp: new Date().toISOString()
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error in updateUserPresence:', error);
    return { success: false, error };
  }
};

export const getOnlineUsers = async (conversationId) => {
  try {
    if (!conversationId) throw new Error('Conversation ID is required');
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');
    
    // Get online users from the presence table
    const { data, error } = await supabase
      .from('conversation_presence')
      .select(`
        user_id,
        is_online,
        is_typing,
        last_active,
        user:users(id, name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .eq('is_online', true)
      .gte('last_active', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Only users active in the last 5 minutes
    
    if (error) {
      console.error('Error fetching online users:', error);
      throw error;
    }
    
    // Process the data
    const onlineUsers = data.map(record => ({
      id: record.user_id,
      name: record.user?.name,
      avatar_url: record.user?.avatar_url,
      is_typing: record.is_typing,
      last_active: record.last_active
    }));
    
    return { data: onlineUsers };
  } catch (error) {
    console.error('Error in getOnlineUsers:', error);
    return { data: [], error };
  }
};

// Function to check and list available storage buckets
export const listStorageBuckets = async () => {
  try {
    // List all available storage buckets
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing storage buckets:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error in listStorageBuckets:', error);
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

// Add a function to upload message attachments
export const uploadMessageAttachment = async (messageId, file) => {
  try {
    if (!messageId || !file) {
      throw new Error('Message ID and file are required');
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // First upload the file to storage
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `message_attachments/${messageId}/${fileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Error uploading attachment:', uploadError);
      throw new Error(`Failed to upload attachment: ${uploadError.message}`);
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('attachments')
      .getPublicUrl(filePath);
    
    // Insert the attachment record
    const { data: attachmentData, error: attachmentError } = await supabase
      .from('message_attachments')
      .insert({
        message_id: messageId,
        file_url: publicUrl,
        file_type: file.type,
        file_name: file.name,
        file_size: file.size
      });
    
    if (attachmentError) {
      console.error('Error saving attachment record:', attachmentError);
      throw new Error(`Failed to save attachment record: ${attachmentError.message}`);
    }
    
    return { success: true, data: { url: publicUrl, type: file.type, name: file.name, size: file.size } };
  } catch (error) {
    console.error('Error in uploadMessageAttachment:', error);
    return { success: false, error };
  }
};

// Download a message attachment
export const downloadMessageAttachment = async (attachment) => {
  try {
    // Debug logging to see what's being received
    console.log("Download attachment called with:", attachment);
    
    if (!attachment) {
      console.error("Attachment is undefined or null");
      throw new Error('Invalid attachment data: attachment is undefined');
    }
    
    // Try to get or construct a valid file URL
    let fileUrl = attachment.file_url;
    
    if (!fileUrl) {
      console.error("Attachment is missing file_url property:", attachment);
      
      // Check available buckets to find the right one
      const { success: bucketsSuccess, buckets } = await listStorageBuckets();
      let availableBuckets = [];
      
      if (bucketsSuccess && buckets && buckets.length > 0) {
        availableBuckets = buckets.map(b => b.name);
        console.log("Available storage buckets:", availableBuckets);
      } else {
        console.warn("Could not get list of buckets, will try default names");
        // Try common bucket names as fallback
        availableBuckets = ['attachments', 'media', 'uploads', 'files', 'images', 'listings', 'avatars'];
      }
      
      // If we have the necessary information, try to construct the URL using all available buckets
      if (attachment.message_id && attachment.file_name) {
        console.log("Attempting to construct URL from message_id and file_name");
        
        // Try various path patterns in different buckets
        for (const bucket of availableBuckets) {
          try {
            // Try different folder structures
            const pathVariations = [
              `message_attachments/${attachment.message_id}/${attachment.file_name}`,
              `messages/${attachment.message_id}/${attachment.file_name}`,
              `${attachment.message_id}/${attachment.file_name}`,
              attachment.file_name
            ];
            
            for (const path of pathVariations) {
              try {
                console.log(`Trying bucket '${bucket}' with path '${path}'`);
                const { data: urlData } = supabase.storage
                  .from(bucket)
                  .getPublicUrl(path);
                  
                if (urlData?.publicUrl) {
                  fileUrl = urlData.publicUrl;
                  console.log("Successfully constructed URL:", fileUrl);
                  break;
                }
              } catch (e) {
                // Continue to next path
              }
            }
            
            if (fileUrl) break; // Found a working URL, exit the bucket loop
          } catch (e) {
            // Continue to next bucket
          }
        }
      }
    }
    
    // If we still don't have a file URL, try other properties
    if (!fileUrl) {
      fileUrl = attachment.url || 
               attachment.publicUrl ||
               attachment.storage_url ||
               attachment.src || 
               attachment.link || 
               attachment.path;
               
      if (fileUrl) {
        console.log("Found URL in alternative property:", fileUrl);
      }
    }
    
    // If we still don't have a URL, throw an error
    if (!fileUrl) {
      throw new Error('Invalid attachment data: missing file_url and unable to construct URL');
    }
    
    // Extract the file name from the attachment
    const fileName = attachment.file_name || attachment.filename || 'download';
    
    // Create a link element to trigger the download
    const link = document.createElement('a');
    link.href = fileUrl;
    link.setAttribute('download', fileName);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    
    // For image types, fetch the file first to ensure it downloads correctly
    if (attachment.file_type && attachment.file_type.startsWith('image/')) {
      try {
        // Fetch the image
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        
        // Get the blob
        const blob = await response.blob();
        
        // Create a blob URL and set it as the link's href
        const blobUrl = URL.createObjectURL(blob);
        link.href = blobUrl;
        
        // Click the link to trigger the download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        
        return { success: true, message: 'Download started' };
      } catch (fetchError) {
        console.error('Error fetching image for download:', fetchError);
        // Fall back to direct link click if fetch fails
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return { success: true, message: 'Download attempted via direct link' };
      }
    } else {
      // For non-image files, use direct link
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return { success: true, message: 'Download started' };
    }
  } catch (error) {
    console.error('Error downloading attachment:', error);
    return { success: false, error: error.message || 'Unknown error downloading attachment' };
  }
};

// Download all attachments from a conversation as a ZIP file
export const downloadConversationAttachments = async (conversationId, otherParticipantName = 'Conversation') => {
  try {
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }
    
    // Dynamic import JSZip to avoid having it in the main bundle
    const JSZip = (await import('jszip')).default;
    
    // Create a new ZIP file
    const zip = new JSZip();
    let filesAdded = 0;
    
    // First get all messages in the conversation
    const { data: messages, error: messagesError } = await getMessages(conversationId);
    
    if (messagesError) {
      throw new Error(`Failed to fetch messages: ${messagesError.message}`);
    }
    
    if (!messages || messages.length === 0) {
      throw new Error('No messages found in this conversation');
    }
    
    console.log(`Found ${messages.length} messages in conversation`);
    
    // Create a folder for each date messages were sent
    const messagesByDate = messages.reduce((acc, message) => {
      // Check for different forms of attachments
      const hasAttachments = 
        (message.attachments && message.attachments.length > 0) ||
        (message.message_images && message.message_images.length > 0) ||
        message.has_attachments;
      
      if (!hasAttachments) {
        return acc;
      }
      
      // Get attachment list from various possible sources
      let attachmentsList = [];
      
      if (message.attachments && message.attachments.length > 0) {
        attachmentsList = message.attachments;
      } else if (message.message_images && message.message_images.length > 0) {
        // Convert image URLs to attachment-like objects
        attachmentsList = message.message_images.map(imgUrl => ({
          file_url: imgUrl,
          file_name: `image_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`,
          file_type: 'image/jpeg'
        }));
      } else if (message.has_attachments) {
        // Message indicates it has attachments but none are in the expected format
        console.warn("Message has has_attachments flag but no attachment data:", message);
      }
      
      if (attachmentsList.length === 0) {
        return acc;
      }
      
      const messageDate = new Date(message.created_at);
      const dateKey = messageDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      
      // Store message with its processed attachments
      acc[dateKey].push({
        ...message,
        processedAttachments: attachmentsList
      });
      
      return acc;
    }, {});
    
    // Log found attachments
    const totalDates = Object.keys(messagesByDate).length;
    console.log(`Found messages with attachments on ${totalDates} different dates`);
    
    if (totalDates === 0) {
      throw new Error('No attachments were found in this conversation');
    }
    
    // Download each attachment
    const downloadPromises = [];
    
    for (const [dateKey, dateMessages] of Object.entries(messagesByDate)) {
      const dateFolder = zip.folder(dateKey);
      
      for (const message of dateMessages) {
        if (!message.processedAttachments || message.processedAttachments.length === 0) continue;
        
        for (const attachment of message.processedAttachments) {
          downloadPromises.push(
            (async () => {
              try {
                // Try to get or construct a valid file URL
                let fileUrl = attachment.file_url;
                
                if (!fileUrl) {
                  // Try different property names that might contain the URL
                  fileUrl = attachment.url || 
                           attachment.publicUrl ||
                           attachment.storage_url ||
                           attachment.src || 
                           attachment.link || 
                           attachment.path;
                  
                  // If we still don't have a URL and we have the necessary information, try to construct it
                  if (!fileUrl && attachment.message_id && attachment.file_name) {
                    // Check available buckets to find the right one
                    const { success: bucketsSuccess, buckets } = await listStorageBuckets();
                    let availableBuckets = [];
                    
                    if (bucketsSuccess && buckets && buckets.length > 0) {
                      availableBuckets = buckets.map(b => b.name);
                      console.log("ZIP download - Available storage buckets:", availableBuckets);
                    } else {
                      console.warn("ZIP download - Could not get list of buckets, will try default names");
                      // Try common bucket names as fallback
                      availableBuckets = ['attachments', 'media', 'uploads', 'files', 'images', 'listings', 'avatars'];
                    }
                    
                    // Try various path patterns in different buckets
                    for (const bucket of availableBuckets) {
                      try {
                        const pathVariations = [
                          `message_attachments/${attachment.message_id}/${attachment.file_name}`,
                          `messages/${attachment.message_id}/${attachment.file_name}`,
                          `${attachment.message_id}/${attachment.file_name}`,
                          attachment.file_name
                        ];
                        
                        for (const path of pathVariations) {
                          try {
                            console.log(`ZIP download - Trying bucket '${bucket}' with path '${path}'`);
                            const { data: urlData } = supabase.storage
                              .from(bucket)
                              .getPublicUrl(path);
                              
                            if (urlData?.publicUrl) {
                              fileUrl = urlData.publicUrl;
                              console.log("ZIP download - Successfully constructed URL:", fileUrl);
                              break;
                            }
                          } catch (e) {
                            // Continue to next path
                          }
                        }
                        
                        if (fileUrl) break; // Found a working URL, exit the bucket loop
                      } catch (e) {
                        // Continue to next bucket
                      }
                    }
                  }
                  
                  if (!fileUrl) {
                    console.warn('Attachment missing file_url:', attachment);
                    return;
                  }
                }
                
                // Create a safe filename
                const timestamp = new Date(message.created_at)
                  .toISOString()
                  .replace(/:/g, '-')
                  .replace(/\..+/, '');
                
                // Get display name from attachment or extract from URL
                let fileName = attachment.file_name || attachment.filename;
                if (!fileName) {
                  // Try to extract from URL
                  const urlParts = fileUrl.split('/');
                  fileName = urlParts[urlParts.length - 1] || 'file';
                  
                  // Remove URL parameters if any
                  fileName = fileName.split('?')[0];
                }
                
                const safeFileName = `${timestamp}_${fileName}`;
                
                // Fetch the file
                const response = await fetch(fileUrl);
                
                if (!response.ok) {
                  console.error(`Failed to fetch ${fileName}:`, response.statusText);
                  return;
                }
                
                // Get the blob
                const blob = await response.blob();
                
                // Add to zip in date folder
                dateFolder.file(safeFileName, blob);
                filesAdded++;
              } catch (err) {
                console.error(`Error downloading attachment:`, err);
              }
            })()
          );
        }
      }
    }
    
    // Wait for all downloads to complete
    await Promise.allSettled(downloadPromises);
    
    if (filesAdded === 0) {
      throw new Error('No attachments were found or could be downloaded');
    }
    
    console.log(`Successfully downloaded ${filesAdded} attachments, creating ZIP file...`);
    
    // Generate the ZIP file
    const content = await zip.generateAsync({ type: 'blob' });
    
    // Create a safe filename for the ZIP
    const safeParticipantName = otherParticipantName.replace(/[^a-z0-9]/gi, '_').slice(0, 30);
    
    // Create a download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `${safeParticipantName}_attachments.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
    
    return { 
      success: true, 
      filesAdded,
      message: `Downloaded ${filesAdded} attachments as a ZIP file` 
    };
  } catch (error) {
    console.error('Error downloading conversation attachments:', error);
    return { success: false, error: error.message };
  }
};

// Check if messaging configuration is set up properly
export const checkMessagingConfig = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Call the database function to check configuration
    const { data, error } = await supabase.rpc('check_messaging_config');
    
    if (error) {
      console.error('Error checking messaging configuration:', error);
      return { 
        success: false, 
        error: error.message,
        isConfigured: false,
        details: null 
      };
    }
    
    return { 
      success: true, 
      error: null,
      isConfigured: data.status === 'Ready',
      details: data 
    };
  } catch (error) {
    console.error('Error in checkMessagingConfig:', error);
    return { 
      success: false, 
      error: error.message,
      isConfigured: false,
      details: null 
    };
  }
};

// Admin function to delete a listing
export const adminDeleteListing = async (listingId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
      return { success: false, error: { message: 'Not authenticated' } };
    }
    
    // First verify the listing exists
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('id, title, user_id')
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
    
    // Delete related offers
    const { error: offersError } = await supabase
      .from('offers')
      .delete()
      .eq('listing_id', listingId);
    
    if (offersError) {
      console.error('Error deleting offers:', offersError);
      // Continue anyway
    }
    
    // Delete saved listings
    const { error: savedError } = await supabase
      .from('saved_listings')
      .delete()
      .eq('listing_id', listingId);
      
    if (savedError) {
      console.error('Error deleting saved listings:', savedError);
      // Continue anyway
    }
    
    // Delete the listing itself
    const { error: deleteError } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId);
      
    if (deleteError) {
      console.error('Error deleting listing:', deleteError);
      return { success: false, error: deleteError };
    }
    
    return { 
      success: true,
      listing
    };
  } catch (error) {
    console.error('Error in adminDeleteListing:', error);
    return { success: false, error };
  }
};

// Get seller statistics
export const getSellerStatistics = async (sellerId) => {
  try {
    const userId = sellerId || (await supabase.auth.getUser()).data.user?.id;
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Get listings count
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('id, status, created_at, price')
      .eq('seller_id', userId);
    
    if (listingsError) throw listingsError;
    
    // Get reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('id, rating')
      .eq('seller_id', userId);
    
    if (reviewsError) throw reviewsError;
    
    // Get sales data from completed offers
    const { data: sales, error: salesError } = await supabase
      .from('offers')
      .select('id, amount, status, created_at')
      .eq('seller_id', userId)
      .eq('status', 'accepted');
    
    if (salesError) throw salesError;
    
    // Calculate statistics
    const totalListings = listings?.length || 0;
    const activeListings = listings?.filter(l => l.status === 'active').length || 0;
    const soldListings = listings?.filter(l => l.status === 'sold').length || 0;
    
    const totalSales = sales?.length || 0;
    const salesVolume = sales?.reduce((sum, sale) => sum + (parseFloat(sale.amount) || 0), 0) || 0;
    
    const averageRating = reviews?.length 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;
    
    // Get 30-day metrics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();
    
    const recentListings = listings?.filter(l => l.created_at >= thirtyDaysAgoStr).length || 0;
    const recentSales = sales?.filter(s => s.created_at >= thirtyDaysAgoStr).length || 0;
    const recentSalesVolume = sales
      ?.filter(s => s.created_at >= thirtyDaysAgoStr)
      .reduce((sum, sale) => sum + (parseFloat(sale.amount) || 0), 0) || 0;
    
    return {
      data: {
        totalListings,
        activeListings,
        soldListings,
        totalSales,
        salesVolume,
        averageRating,
        reviewCount: reviews?.length || 0,
        recentListings,
        recentSales,
        recentSalesVolume,
        completionRate: totalListings > 0 ? (soldListings / totalListings) * 100 : 0
      },
      error: null
    };
  } catch (error) {
    console.error('Error in getSellerStatistics:', error);
    return { data: null, error };
  }
};

// Create test conversations for development and testing
export const createTestConversations = async (count = 5) => {
  try {
    console.log(`Creating ${count} test conversations...`);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Get some random users to have conversations with
    const { data: randomUsers, error: usersError } = await supabase
      .from('users')
      .select('id, name, avatar_url')
      .neq('id', user.id)
      .limit(count);
    
    if (usersError) {
      throw new Error(`Failed to get random users: ${usersError.message}`);
    }
    
    if (!randomUsers || randomUsers.length === 0) {
      throw new Error('No users found to create test conversations with');
    }
    
    // Get some random listings to associate with conversations
    const { data: randomListings, error: listingsError } = await supabase
      .from('listings')
      .select('id, title, price, images')
      .limit(count);
    
    if (listingsError) {
      throw new Error(`Failed to get random listings: ${listingsError.message}`);
    }
    
    // Create test messages content
    const messageTemplates = [
      "Hi there, is this still available?",
      "I'm interested in this item. Is the price negotiable?",
      "Could you tell me more about the condition?",
      "Do you offer delivery or is it pickup only?",
      "I'd like to buy this. When can we meet?",
      "Does it come with the original packaging?",
      "How long have you owned this?",
      "Would you accept $PRICE_LOWER for it?",
      "Are there any defects or issues I should know about?",
      "Do you have more pictures you could share?"
    ];
    
    const responseTemplates = [
      "Yes, it's still available!",
      "The price is somewhat negotiable. What did you have in mind?",
      "It's in excellent condition, barely used.",
      "I prefer local pickup, but we can discuss delivery options.",
      "Great! I'm available evenings and weekends for meetup.",
      "Yes, I have the original box and all accessories.",
      "I've had it for about a year, but it's in great shape.",
      "I could go down to $PRICE_LOWER, but that's my best offer.",
      "No issues at all, works perfectly.",
      "Sure, I can send more pictures. What specifically would you like to see?"
    ];
    
    // Create conversations and messages
    const results = [];
    
    for (let i = 0; i < Math.min(count, randomUsers.length); i++) {
      const otherUser = randomUsers[i];
      const listing = randomListings && randomListings.length > i ? randomListings[i] : null;
      
      // Create a conversation
      const { data: conversation, error: convError } = await supabase.rpc(
        'create_conversation_with_participants',
        {
          user1_uuid: user.id,
          user2_uuid: otherUser.id,
          listing_uuid: listing?.id || null
        }
      );
      
      if (convError) {
        console.error(`Error creating conversation ${i+1}:`, convError);
        continue;
      }
      
      if (!conversation || !conversation.success) {
        console.error(`Failed to create conversation ${i+1}:`, conversation?.error || 'Unknown error');
        continue;
      }
      
      const conversationId = conversation.conversation_id;
      
      // Send some test messages
      const messageCount = 3 + Math.floor(Math.random() * 8); // 3-10 messages
      const initialTimestamp = new Date(Date.now() - (24 * 60 * 60 * 1000)); // Start from 24h ago
      
      for (let j = 0; j < messageCount; j++) {
        // Alternate between current user and other user
        const sender = j % 2 === 0 ? user.id : otherUser.id;
        
        // Choose a random message template
        const templates = sender === user.id ? messageTemplates : responseTemplates;
        let content = templates[Math.floor(Math.random() * templates.length)];
        
        // Replace price placeholder if it exists
        if (content.includes('PRICE_LOWER') && listing) {
          const lowerPrice = Math.floor(parseFloat(listing.price) * 0.8);
          content = content.replace('PRICE_LOWER', lowerPrice);
        }
        
        // Calculate timestamp with some random interval between messages
        const messageTime = new Date(initialTimestamp.getTime() + (j * (30 + Math.random() * 60) * 60 * 1000));
        
        // Insert the message directly to bypass restrictions and get proper timestamps
        const { error: msgError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: sender,
            content: content,
            created_at: messageTime.toISOString(),
            read: sender !== user.id // Messages from others are marked as read
          });
        
        if (msgError) {
          console.error(`Error creating message ${j+1} in conversation ${i+1}:`, msgError);
        }
      }
      
      // Update conversation's updated_at to match the last message
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
      
      results.push({
        conversationId,
        otherUser: otherUser.name,
        listing: listing?.title || 'No listing',
        messageCount
      });
    }
    
    console.log(`Successfully created ${results.length} test conversations`);
    return { success: true, data: results };
  } catch (error) {
    console.error('Error creating test conversations:', error);
    return { success: false, error: error.message };
  }
};

// Function to help users diagnose bucket issues
export const checkStorageBuckets = async () => {
  try {
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }
    
    // Try to list buckets
    const { success, data, error } = await listStorageBuckets();
    
    if (!success) {
      return { 
        success: false, 
        error: error?.message || 'Failed to list buckets',
        details: 'You may not have permission to list storage buckets.'
      };
    }
    
    if (!data || data.length === 0) {
      return { 
        success: true, 
        buckets: [],
        message: 'No storage buckets found. This may indicate a configuration issue.'
      };
    }
    
    // For each bucket, try to list the root contents
    const bucketsWithContent = await Promise.all(
      data.map(async (bucket) => {
        try {
          const { data: files, error: listError } = await supabase.storage
            .from(bucket.name)
            .list('', { limit: 5 });
            
          return {
            name: bucket.name,
            id: bucket.id,
            accessible: !listError,
            fileCount: files?.length || 0,
            error: listError?.message
          };
        } catch (e) {
          return {
            name: bucket.name,
            id: bucket.id,
            accessible: false,
            error: e.message
          };
        }
      })
    );
    
    return { 
      success: true, 
      buckets: bucketsWithContent,
      message: `Found ${bucketsWithContent.length} storage buckets.`
    };
  } catch (error) {
    console.error('Error checking storage buckets:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error checking buckets',
      details: error.toString()
    };
  }
};

// Function to list files in a storage bucket 
export const listStorageFiles = async (bucketName, prefix = '') => {
  try {
    if (!bucketName) {
      throw new Error('Bucket name is required');
    }
    
    console.log(`Listing files in bucket: ${bucketName}, prefix: ${prefix || 'root'}`);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(prefix, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (error) {
      console.error(`Error listing files in bucket ${bucketName}:`, error);
      return { 
        success: false, 
        error: error.message || `Failed to list files in bucket ${bucketName}` 
      };
    }
    
    // For each folder, get a file count
    let filesWithInfo = [];
    
    for (const item of data) {
      if (item.id) {
        // It's a file
        filesWithInfo.push({
          ...item,
          path: prefix ? `${prefix}/${item.name}` : item.name,
          type: 'file'
        });
      } else {
        // It's a folder, get a count of files inside
        try {
          const folderPath = prefix ? `${prefix}/${item.name}` : item.name;
          const { data: folderContents } = await supabase.storage
            .from(bucketName)
            .list(folderPath, { limit: 5 });
          
          filesWithInfo.push({
            ...item,
            path: folderPath,
            type: 'folder',
            itemCount: folderContents?.length || 0,
            hasFiles: (folderContents?.length || 0) > 0
          });
        } catch (e) {
          filesWithInfo.push({
            ...item,
            path: prefix ? `${prefix}/${item.name}` : item.name,
            type: 'folder',
            error: e.message
          });
        }
      }
    }
    
    return { 
      success: true, 
      data: filesWithInfo,
      bucketName,
      prefix
    };
  } catch (error) {
    console.error('Error in listStorageFiles:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error listing storage files'
    };
  }
};

// Add a function to list all attachments from the database
export const listMessageAttachments = async (limit = 20) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Query the message_attachments table
    const { data, error } = await supabase
      .from('message_attachments')
      .select('*, message:message_id(id, content, sender_id, receiver_id)')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw new Error(`Failed to fetch message attachments: ${error.message}`);
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error in listMessageAttachments:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error listing message attachments'
    };
  }
};

// Function to check if a table exists and get its structure
export const checkTableStructure = async (tableName) => {
  try {
    // First check if the table exists by trying to get a single row
    const { error: tableCheckError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
      
    // If we get an error about the table not existing
    if (tableCheckError && 
       (tableCheckError.message.includes('does not exist') || 
        tableCheckError.code === '42P01')) {
      return { 
        success: false, 
        exists: false, 
        error: `Table '${tableName}' does not exist` 
      };
    }
    
    // Now get the table structure
    const { data, error } = await supabase.rpc('get_table_info', { 
      table_name: tableName 
    });
    
    if (error) {
      // Try alternative approach if RPC fails
      console.log(`RPC get_table_info failed: ${error.message}. Trying direct query.`);
      
      // Get column info through a direct query
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', tableName);
      
      if (columnsError) {
        return { 
          success: false, 
          exists: true, // Table exists but we couldn't get its structure
          error: columnsError.message 
        };
      }
      
      return { 
        success: true, 
        exists: true,
        columns: columns || [],
        source: 'direct_query'
      };
    }
    
    return { 
      success: true, 
      exists: true,
      columns: data || [],
      source: 'rpc'
    };
  } catch (error) {
    console.error(`Error checking table structure for ${tableName}:`, error);
    return { 
      success: false, 
      error: error.message || `Unknown error checking table structure` 
    };
  }
};

export const upgradeReviewsTable = async () => {
  try {
    console.log('Checking reviews table schema...');
    
    // First check if review_type column exists by selecting from reviews
    // and filtering by review_type
    const { data, error } = await supabase
      .from('reviews')
      .select('review_type')
      .eq('review_type', 'product')
      .limit(1);
    
    if (!error) {
      console.log('review_type column already exists');
      return { success: true, message: 'review_type column already exists' };
    }
    
    console.log('review_type column does not exist, adding it...');
    
    // Try adding the column with direct SQL
    const { error: sqlError } = await supabase.rpc(
      'run_sql', 
      { 
        query: `
          ALTER TABLE reviews 
          ADD COLUMN review_type TEXT DEFAULT 'seller' 
          CHECK (review_type IN ('seller', 'product'));
          
          -- Update existing reviews
          UPDATE reviews SET review_type = 'seller' WHERE review_type IS NULL;
        `
      }
    );
    
    if (sqlError) {
      console.error('Error executing SQL:', sqlError);
      
      // Fall back to another approach - update via REST API
      console.log('Falling back to client-side workaround...');
      return { 
        success: false, 
        clientSideWorkaround: true,
        message: 'Cannot add column: ' + sqlError.message
      };
    }
    
    console.log('Successfully added review_type column');
    return { success: true, message: 'Added review_type column to reviews table' };
  } catch (error) {
    console.error('Error upgrading reviews table:', error);
    return { 
      success: false, 
      error: error.message,
      message: `Could not upgrade reviews table: ${error.message}. Using client-side workaround.`
    };
  }
};

// Function to create a basic user profile if it doesn't exist
export const createBasicUserProfile = async (userId) => {
  try {
    if (!userId) {
      console.error('No user ID provided');
      return { success: false, error: 'User ID is required' };
    }
    
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    // If user exists, no need to create
    if (existingUser) {
      return { success: true, message: 'User already exists' };
    }
    
    // Create basic user profile
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        name: `User ${userId.substring(0, 8)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating basic user profile:', error);
      return { success: false, error: error.message };
    }
    
    // Add offline status
    await supabase
      .from('user_status')
      .insert({
        user_id: userId,
        status: 'offline',
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .single();
    
    return { success: true, data };
  } catch (error) {
    console.error('Exception in createBasicUserProfile:', error);
    return { success: false, error: error.message };
  }
};