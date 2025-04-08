import React from 'react';
import {
  Paper,
  Typography,
  Box,
} from '@mui/material';

const ListingDescription = ({ description }) => {
  return (
    <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Description
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
          {description || 'No description provided.'}
        </Typography>
      </Box>
    </Paper>
  );
};

export default ListingDescription;