import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  TextField, 
  CircularProgress, 
  Typography,
  Autocomplete,
  Avatar
} from '@mui/material';
import { supabase } from '../../supabaseClient';
import { debounce } from 'lodash';
import { useAuth } from '../../contexts/AuthContext';

/**
 * UserSelector component for searching and selecting users
 * 
 * @param {Object} props
 * @param {Function} props.onUserSelect - Callback when a user is selected
 * @param {Array} props.excludedUserIds - Array of user IDs to exclude from results
 * @param {String} props.placeholder - Placeholder text for the input
 * @param {Boolean} props.multiple - Allow multiple selection
 */
const UserSelector = ({
  onUserSelect,
  excludedUserIds = [],
  placeholder = 'Search users...',
  multiple = false
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Search for users
  const searchUsers = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Search by name, email, or university
      const { data, error: searchError } = await supabase
        .from('users')
        .select('id, name, email, avatar_url, university')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,university.ilike.%${query}%`)
        .limit(10);
      
      if (searchError) throw searchError;
      
      // Filter out excluded users
      const filteredResults = data.filter(
        user => !excludedUserIds.includes(user.id)
      );
      
      setSearchResults(filteredResults);
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Failed to search users');
    } finally {
      setLoading(false);
    }
  }, [excludedUserIds]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query) => {
      searchUsers(query);
    }, 300),
    [searchUsers]
  );

  // Handle search input change
  useEffect(() => {
    debouncedSearch(searchTerm);
    
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, debouncedSearch]);

  // Handle user selection
  const handleUserSelect = (event, value) => {
    if (!value) return;
    
    if (multiple) {
      setSelectedUsers(value);
      
      // Call onUserSelect with the newly added user
      if (Array.isArray(value) && value.length > selectedUsers.length) {
        const newUser = value[value.length - 1];
        onUserSelect(newUser);
      }
    } else {
      onUserSelect(value);
      setSearchTerm('');
      setSearchResults([]);
    }
  };
  
  return (
    <Box>
      <Autocomplete
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        getOptionLabel={(option) => option.name || option.email || ''}
        options={searchResults}
        loading={loading}
        onInputChange={(e, value) => setSearchTerm(value)}
        onChange={handleUserSelect}
        multiple={multiple}
        filterOptions={(x) => x} // Disable built-in filtering
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={placeholder}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <React.Fragment>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.id}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Avatar
                src={option.avatar_url}
                alt={option.name || option.email}
                sx={{ width: 32, height: 32, mr: 1.5 }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body1" noWrap>
                  {option.name || option.email}
                </Typography>
                {option.name && (
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {option.email}
                  </Typography>
                )}
                {option.university && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {option.university}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        )}
        noOptionsText={
          searchTerm.length < 2 
            ? "Type at least 2 characters to search" 
            : "No users found"
        }
      />
      
      {error && (
        <Typography color="error" variant="caption" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default UserSelector; 