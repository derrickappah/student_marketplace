import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  Typography,
  Skeleton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { getCategories } from '../services/supabase';

const CategoryFilter = ({ selectedCategory, onCategoryChange }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', py: 2 }}>
        {[...Array(6)].map((_, index) => (
          <Skeleton
            key={index}
            variant="rounded"
            width={100}
            height={32}
            sx={{ flexShrink: 0 }}
          />
        ))}
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        variant="subtitle2"
        color="text.secondary"
        sx={{ mb: 1, display: { xs: 'none', sm: 'block' } }}
      >
        Categories
      </Typography>
      
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          py: isMobile ? 2 : 1,
          px: isMobile ? 2 : 0,
          mx: isMobile ? -2 : 0,
          '&::-webkit-scrollbar': {
            height: '6px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'background.paper',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'grey.300',
            borderRadius: '3px',
          },
        }}
      >
        <Chip
          label="All Categories"
          onClick={() => onCategoryChange('')}
          color={!selectedCategory ? 'primary' : 'default'}
          variant={!selectedCategory ? 'filled' : 'outlined'}
          sx={{ flexShrink: 0 }}
        />
        
        {categories.map((category) => (
          <Chip
            key={category.id}
            label={category.name}
            onClick={() => onCategoryChange(category.id)}
            color={selectedCategory === category.id ? 'primary' : 'default'}
            variant={selectedCategory === category.id ? 'filled' : 'outlined'}
            sx={{ flexShrink: 0 }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default CategoryFilter; 