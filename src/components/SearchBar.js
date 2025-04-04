import React, { useState, useEffect } from 'react';
import {
  Paper,
  InputBase,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCategories } from '../services/supabase';

const SearchBar = ({ variant = 'normal' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const [searchQuery, setSearchQuery] = useState(queryParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(queryParams.get('category') || '');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    }
    
    if (selectedCategory) {
      params.set('category', selectedCategory);
    }

    navigate(`/search?${params.toString()}`);
  };

  const isHero = variant === 'hero';
  const paperStyles = isHero
    ? {
        p: '2px 4px',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        maxWidth: 600,
        mx: 'auto',
        backgroundColor: 'background.paper',
        boxShadow: theme.shadows[4],
      }
    : {
        p: '2px 4px',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        backgroundColor: 'background.paper',
      };

  return (
    <Paper
      component="form"
      onSubmit={handleSearch}
      sx={paperStyles}
    >
      <FormControl
        sx={{
          minWidth: isMobile ? 100 : 120,
          '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
        }}
        size={isHero ? 'medium' : 'small'}
      >
        <Select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          displayEmpty
          variant="outlined"
        >
          <MenuItem value="">All</MenuItem>
          {categories.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              {category.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <InputBase
        sx={{ ml: 1, flex: 1 }}
        placeholder={isHero ? "What are you looking for?" : "Search listings..."}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        size={isHero ? 'medium' : 'small'}
      />

      <IconButton type="submit" sx={{ p: '10px' }} aria-label="search">
        <SearchIcon />
      </IconButton>
    </Paper>
  );
};

export default SearchBar; 