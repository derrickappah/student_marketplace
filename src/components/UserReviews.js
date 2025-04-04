import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Rating,
  Divider,
  Paper,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Tabs,
  Tab,
  Chip,
  Stack,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import StarIcon from '@mui/icons-material/Star';
import { useAuth } from '../contexts/AuthContext';
import { getUserReviews, getUserRating, createReview, updateReview, deleteReview, supabase } from '../services/supabase';
import { formatDistanceToNow } from 'date-fns';

const UserReviews = ({ userId, userName }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState({ averageRating: 0, reviewCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Review form states
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: '',
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Edit review states
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [editReviewData, setEditReviewData] = useState({ rating: 0, comment: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  
  // Delete confirmation dialog
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Filtering and sorting
  const [currentTab, setCurrentTab] = useState(0);
  const [sortOrder, setSortOrder] = useState('newest');
  const [ratingFilter, setRatingFilter] = useState('all');

  // Rating stats
  const [ratingStats, setRatingStats] = useState({
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0
  });

  useEffect(() => {
    const loadReviewData = async () => {
      console.log('>>> loadReviewData called for userId:', userId);
      setLoading(true);
      setError('');
      try {
        const [reviewsData, ratingData] = await Promise.all([
          getUserReviews(userId),
          getUserRating(userId),
        ]);
        
        console.log('>>> Reviews loaded successfully:', reviewsData);
        
        // Simply use the data as returned by the API
        const reviewsArray = Array.isArray(reviewsData.data) ? reviewsData.data : [];
        setReviews(reviewsArray);
        setRating({
          averageRating: ratingData.rating || 0,
          reviewCount: ratingData.count || 0
        });
        
        // Calculate rating statistics
        const stats = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviewsArray.forEach(review => {
          if (review.rating >= 1 && review.rating <= 5) {
            stats[Math.floor(review.rating)]++;
          }
        });
        setRatingStats(stats);
        
      } catch (err) {
        console.error('Error loading reviews:', err);
        setError('Error loading reviews. Please try again later.');
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadReviewData();
    }
  }, [userId]);

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setNewReview((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditReviewChange = (e) => {
    const { name, value } = e.target;
    setEditReviewData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitReview = async () => {
    if (!newReview.rating || newReview.rating === 0) {
      setSubmitError('Please select a rating');
      return;
    }

    setSubmitLoading(true);
    setSubmitError('');

    try {
      const { data: createdReview } = await createReview({
        sellerId: userId,
        listingId: null,
        rating: newReview.rating,
        comment: newReview.comment
      });
      
      const [reviewsData, ratingData] = await Promise.all([
        getUserReviews(userId),
        getUserRating(userId),
      ]);
      
      setReviews(Array.isArray(reviewsData.data) ? reviewsData.data : []);
      setRating({
        averageRating: ratingData.rating || 0,
        reviewCount: ratingData.count || 0
      });
      setOpenReviewDialog(false);
      setNewReview({ rating: 0, comment: '' });
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit review');
      console.error('Error:', err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleOpenEditDialog = (review) => {
    setEditingReview(review);
    setEditReviewData({ rating: review.rating, comment: review.comment });
    setEditError('');
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditingReview(null);
    setEditReviewData({ rating: 0, comment: '' });
  };

  const handleSubmitEditReview = async () => {
    if (!editingReview) return;

    if (!editReviewData.rating || editReviewData.rating === 0) {
        setEditError('Please select a rating');
        return;
    }

    setEditLoading(true);
    setEditError('');

    try {
      await updateReview({
        reviewId: editingReview.id,
        rating: editReviewData.rating,
        comment: editReviewData.comment,
      });

      setReviews(prevReviews => 
        prevReviews.map(r => 
          r.id === editingReview.id 
            ? { ...r, rating: editReviewData.rating, comment: editReviewData.comment, updated_at: new Date().toISOString() } 
            : r
        )
      );
      
      handleRefreshReviews();
      handleCloseEditDialog();
    } catch (err) {
      setEditError(err.message || 'Failed to update review');
      console.error('Error updating review:', err);
    } finally {
      setEditLoading(false);
    }
  };

  const handleOpenDeleteDialog = (review) => {
    setReviewToDelete(review);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setReviewToDelete(null);
    setOpenDeleteDialog(false);
  };

  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;
    
    setDeleteLoading(true);
    
    try {
      await deleteReview(reviewToDelete.id);
      
      // Remove the review from the state
      setReviews(prevReviews => prevReviews.filter(r => r.id !== reviewToDelete.id));
      
      // Refresh review data
      handleRefreshReviews();
      handleCloseDeleteDialog();
    } catch (err) {
      console.error('Error deleting review:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleSortChange = (event) => {
    setSortOrder(event.target.value);
  };

  const handleRatingFilterChange = (event) => {
    setRatingFilter(event.target.value);
  };

  const hasUserReviewed = Array.isArray(reviews) && reviews.some(review => review.reviewer_id === user?.id);
  
  // Filter and sort reviews
  const getFilteredAndSortedReviews = () => {
    if (!Array.isArray(reviews)) return [];
    
    let filteredReviews = [...reviews];
    
    // Filter by tab
    if (currentTab === 1) { // Positive reviews (4-5 stars)
      filteredReviews = filteredReviews.filter(review => review.rating >= 4);
    } else if (currentTab === 2) { // Critical reviews (1-3 stars)
      filteredReviews = filteredReviews.filter(review => review.rating < 4);
    }
    
    // Filter by rating
    if (ratingFilter !== 'all') {
      const ratingValue = parseInt(ratingFilter);
      filteredReviews = filteredReviews.filter(review => review.rating === ratingValue);
    }
    
    // Sort reviews
    return filteredReviews.sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortOrder === 'oldest') {
        return new Date(a.created_at) - new Date(b.created_at);
      } else if (sortOrder === 'highest') {
        return b.rating - a.rating;
      } else if (sortOrder === 'lowest') {
        return a.rating - b.rating;
      }
      return 0;
    });
  };
  
  // Add a function to force refresh review data
  const handleRefreshReviews = () => {
    if (loading) return;
    
    // Clear the current data and trigger a reload
    setLoading(true);
    setError('');
    
    Promise.all([
          getUserReviews(userId),
          getUserRating(userId),
    ]).then(([reviewsData, ratingData]) => {
        setReviews(Array.isArray(reviewsData.data) ? reviewsData.data : []);
        setRating({
          averageRating: ratingData.rating || 0,
          reviewCount: ratingData.count || 0
        });
      
      // Update rating stats
      const reviewsArray = Array.isArray(reviewsData.data) ? reviewsData.data : [];
      const stats = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviewsArray.forEach(review => {
        if (review.rating >= 1 && review.rating <= 5) {
          stats[Math.floor(review.rating)]++;
        }
      });
      setRatingStats(stats);
      
    }).catch(err => {
        console.error('Error refreshing reviews:', err);
      setError('Failed to refresh reviews. Please try again.');
    }).finally(() => {
        setLoading(false);
    });
  };

  // Get filtered and sorted reviews
  const filteredReviews = getFilteredAndSortedReviews();

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom>
        Ratings & Reviews
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          <Button 
            variant="text" 
            size="small" 
            onClick={handleRefreshReviews}
            sx={{ ml: 2 }}
          >
            Retry
          </Button>
        </Alert>
      ) : (
        <>
          {/* Summary Section */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Left side - Overall rating */}
            <Grid item xs={12} md={4}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                p: 2,
                borderRadius: 1,
                bgcolor: 'background.paper'
              }}>
                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {rating.averageRating.toFixed(1)}
          </Typography>
          <Rating 
            value={rating.averageRating} 
            precision={0.5} 
            readOnly 
                  size="large"
                  sx={{ mb: 1 }}
          />
                <Typography variant="body2" color="text.secondary">
                  Based on {rating.reviewCount} {rating.reviewCount === 1 ? 'review' : 'reviews'}
          </Typography>
              </Box>
            </Grid>
            
            {/* Right side - Rating breakdown */}
            <Grid item xs={12} md={8}>
              <Box sx={{ p: 1 }}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const percentage = rating.reviewCount > 0 
                    ? Math.round((ratingStats[star] / rating.reviewCount) * 100) 
                    : 0;
                  
                  return (
                    <Box key={star} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: 40 }}>
                        <Typography variant="body2">{star}</Typography>
                        <StarIcon sx={{ fontSize: 16, ml: 0.5 }} />
        </Box>
        
                      <Box sx={{ 
                        flexGrow: 1, 
                        mx: 1, 
                        height: 8, 
                        bgcolor: 'grey.200',
                        borderRadius: 4
                      }}>
                        <Box sx={{ 
                          width: `${percentage}%`, 
                          height: '100%', 
                          bgcolor: theme.palette.primary.main,
                          borderRadius: 4
                        }} />
      </Box>

                      <Typography variant="body2" sx={{ minWidth: 40 }}>
                        {percentage}%
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Grid>
          </Grid>
          
          <Divider sx={{ mb: 3 }} />
          
          {/* Write a review button */}
          {user && user.id !== userId && !hasUserReviewed && (
            <Box sx={{ mb: 3 }}>
        <Button 
                variant="contained" 
                color="primary"
          onClick={() => setOpenReviewDialog(true)}
        >
          Write a Review
        </Button>
            </Box>
          )}
          
          {/* Tabs and filters */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={7}>
                <Tabs 
                  value={currentTab} 
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab label={`All Reviews (${rating.reviewCount})`} />
                  <Tab label="Positive" />
                  <Tab label="Critical" />
                </Tabs>
              </Grid>
              
              <Grid item xs={12} sm={5}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControl size="small" fullWidth>
                    <InputLabel id="sort-select-label">Sort by</InputLabel>
                    <Select
                      labelId="sort-select-label"
                      value={sortOrder}
                      label="Sort by"
                      onChange={handleSortChange}
                    >
                      <MenuItem value="newest">Newest first</MenuItem>
                      <MenuItem value="oldest">Oldest first</MenuItem>
                      <MenuItem value="highest">Highest rating</MenuItem>
                      <MenuItem value="lowest">Lowest rating</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl size="small" fullWidth>
                    <InputLabel id="rating-filter-label">Rating</InputLabel>
                    <Select
                      labelId="rating-filter-label"
                      value={ratingFilter}
                      label="Rating"
                      onChange={handleRatingFilterChange}
                    >
                      <MenuItem value="all">All ratings</MenuItem>
                      <MenuItem value="5">5 stars</MenuItem>
                      <MenuItem value="4">4 stars</MenuItem>
                      <MenuItem value="3">3 stars</MenuItem>
                      <MenuItem value="2">2 stars</MenuItem>
                      <MenuItem value="1">1 star</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Grid>
            </Grid>
          </Box>
          
          {/* Review list */}
          {filteredReviews.length === 0 ? (
            <Typography variant="body1" sx={{ py: 3, textAlign: 'center' }}>
              {reviews.length === 0 
                ? 'No reviews yet. Be the first to review!' 
                : 'No reviews match your filters.'}
        </Typography>
      ) : (
        <Box>
              {filteredReviews.map((review) => (
                <Paper
                  key={review.id}
                  elevation={0}
                  sx={{ 
                    p: 2,
                    mb: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        src={review.reviewer?.avatar_url}
                        alt={review.reviewer?.name || 'User'}
                        sx={{ width: 40, height: 40, mr: 1.5 }}
                      />
                <Box>
                        <Typography variant="subtitle1">
                    {review.reviewer?.name || 'Anonymous'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(review.created_at), {
                            addSuffix: true,
                          })}
                  </Typography>
                </Box>
                    </Box>
                    
                    {/* Edit/Delete buttons for own reviews */}
                    {user && user.id === review.reviewer_id && (
                      <Box>
                  <IconButton 
                    size="small" 
                    onClick={() => handleOpenEditDialog(review)} 
                    aria-label="edit review"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenDeleteDialog(review)}
                          aria-label="delete review"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                )}
              </Box>
                  
                  <Rating value={review.rating} size="small" readOnly sx={{ mb: 1 }} />
                  
                  {review.listing && (
                    <Chip
                      label={`Review for: ${review.listing.title}`}
                      size="small"
                      variant="outlined"
                      sx={{ mb: 1 }}
                    />
                  )}
                  
                  <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                {review.comment}
              </Typography>
            </Paper>
          ))}
        </Box>
          )}
        </>
      )}

      {/* Review dialog */}
      <Dialog 
        open={openReviewDialog} 
        onClose={() => setOpenReviewDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Write a Review for {userName}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography component="legend" sx={{ mb: 1 }}>
              Rating
            </Typography>
            <Rating
              name="rating"
              value={newReview.rating}
              onChange={(_, value) => setNewReview({ ...newReview, rating: value })}
              size="large"
              sx={{ mb: 2 }}
            />
            
          <TextField
            fullWidth
            multiline
            rows={4}
              label="Your review"
              name="comment"
            value={newReview.comment}
            onChange={handleReviewChange}
              placeholder="Share your experience with this seller..."
              sx={{ mb: 2 }}
            />
            
            {submitError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {submitError}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReviewDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitReview} 
            variant="contained"
            disabled={submitLoading}
          >
            {submitLoading ? <CircularProgress size={24} /> : 'Submit Review'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit review dialog */}
      <Dialog 
        open={openEditDialog} 
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Your Review</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography component="legend" sx={{ mb: 1 }}>
              Rating
            </Typography>
            <Rating
              name="rating"
              value={editReviewData.rating}
              onChange={(_, value) => setEditReviewData({ ...editReviewData, rating: value })}
              size="large"
              sx={{ mb: 2 }}
            />
            
          <TextField
            fullWidth
            multiline
            rows={4}
              label="Your review"
              name="comment"
            value={editReviewData.comment}
            onChange={handleEditReviewChange}
              sx={{ mb: 2 }}
            />
            
            {editError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {editError}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmitEditReview}
            variant="contained"
            disabled={editLoading}
          >
            {editLoading ? <CircularProgress size={24} /> : 'Update Review'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Review</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this review? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button
            onClick={handleDeleteReview}
            color="error"
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default UserReviews; 