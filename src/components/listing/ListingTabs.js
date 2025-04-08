import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from '@mui/material';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`listing-tabpanel-${index}`}
      aria-labelledby={`listing-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const a11yProps = (index) => {
  return {
    id: `listing-tab-${index}`,
    'aria-controls': `listing-tabpanel-${index}`,
  };
};

const ListingTabs = ({ listing }) => {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  if (!listing) return null;

  return (
    <Paper sx={{ mb: 4, borderRadius: 2 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={value} 
          onChange={handleChange} 
          aria-label="listing information tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Product Details" {...a11yProps(0)} />
          <Tab label="Specifications" {...a11yProps(1)} />
          <Tab label="Shipping Information" {...a11yProps(2)} />
          <Tab label="Warranty" {...a11yProps(3)} />
        </Tabs>
      </Box>
      
      {/* Product Details Tab */}
      <TabPanel value={value} index={0}>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
          {listing.description || 'No product details available.'}
        </Typography>
      </TabPanel>
      
      {/* Specifications Tab */}
      <TabPanel value={value} index={1}>
        {listing.specifications ? (
          <TableContainer>
            <Table>
              <TableBody>
                {Object.entries(listing.specifications).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell component="th" scope="row" sx={{ width: '30%', fontWeight: 'bold' }}>
                      {key}
                    </TableCell>
                    <TableCell>{value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body1">
            No specifications available for this product.
          </Typography>
        )}
      </TabPanel>
      
      {/* Shipping Information Tab */}
      <TabPanel value={value} index={2}>
        <Typography variant="body1">
          <strong>Delivery:</strong> {listing.delivery_info || 'Standard delivery within 3-7 business days.'}
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          <strong>Shipping Fee:</strong> {listing.free_delivery ? 'Free shipping to selected locations' : 'Shipping fee depends on your location.'}
        </Typography>
        {listing.location && (
          <Typography variant="body1" sx={{ mt: 2 }}>
            <strong>Available in:</strong> {listing.location}
          </Typography>
        )}
      </TabPanel>
      
      {/* Warranty Tab */}
      <TabPanel value={value} index={3}>
        <Typography variant="body1">
          {listing.warranty_info || 'Standard manufacturer warranty applies. Please contact the seller for more details.'}
        </Typography>
      </TabPanel>
    </Paper>
  );
};

export default ListingTabs;