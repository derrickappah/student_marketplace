import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from "../services/supabase";

const SavedListingsButton = ({ listingId }) => {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkIfSaved = async () => {
      if (!user || !listingId) { // Ensure listingId is also present
        setLoading(false);
        return;
      }

      // console.log(`Checking saved status for user: ${user.id}, listing: ${listingId}`);
      try {
        // Test: Fetch all columns for the specific saved listing entry
        const { data, error, status } = await supabase
          .from('saved_listings')
          .select('*') // Select all columns
          .eq('user_id', user.id)
          .eq('listing_id', listingId)
          .maybeSingle(); // Use maybeSingle to handle 0 or 1 result gracefully

        // console.log('>>> checkIfSaved response:', { data, error, status });

        if (error && status !== 406) { // Explicitly check for non-406 errors
            // Ignore PGRST116 'Not Found' which is expected if not saved
            if (error.code !== 'PGRST116') { 
                 console.error('Supabase error checking saved status:', error);
                 // Potentially throw or handle other errors
            }
        }
        
        // If status is 406, log it specifically
        if (status === 406) {
            console.error('Received 406 Not Acceptable when checking saved status', { userId: user.id, listingId });
        }

        // Set saved status based on whether data was found (and no critical error occurred)
        setIsSaved(!!data && status !== 406);

      } catch (err) {
        console.error('Error in checkIfSaved catch block:', err);
        setIsSaved(false); // Assume not saved if there's an error
      } finally {
        setLoading(false);
      }
    };

    checkIfSaved();
  }, [user, listingId]);

  const handleToggleSave = async (e) => {
    e.stopPropagation();
    
    if (!user) return;
    
    setLoading(true);
    
    try {
      if (isSaved) {
        // Remove from saved
        const { error } = await supabase
          .from('saved_listings')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', listingId);
          
        if (error) throw error;
        setIsSaved(false);
      } else {
        // Add to saved
        const { error } = await supabase
          .from('saved_listings')
          .insert([
            { user_id: user.id, listing_id: listingId }
          ]);
          
        if (error) throw error;
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Error toggling saved status:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Tooltip title={isSaved ? "Remove from saved" : "Save listing"}>
      <span>
        <IconButton
          onClick={handleToggleSave}
          color="primary"
          size="small"
          disabled={loading}
          aria-label={isSaved ? "unsave listing" : "save listing"}
        >
          {loading ? (
            <CircularProgress size={20} />
          ) : isSaved ? (
            <FavoriteIcon fontSize="small" />
          ) : (
            <FavoriteBorderIcon fontSize="small" />
          )}
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default SavedListingsButton; 