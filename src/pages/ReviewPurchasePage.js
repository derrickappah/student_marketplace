import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Paper,
  Box,
  Divider,
  Alert,
  CircularProgress,
  Button,
  Link
} from '@mui/material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, getOfferById, getListingById } from '../services/supabase';
import PurchaseReviewForm from '../components/PurchaseReviewForm';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const ReviewPurchasePage = () => {
  const { offerId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transaction, setTransaction] = useState(null);
  const [seller, setSeller] = useState(null);
  const [listing, setListing] = useState(null);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    const loadTransaction = async () => {
      try {
        if (!user) {
          navigate('/login');
          return;
        }

        if (!offerId) {
          setError('No transaction ID provided');
          setLoading(false);
          return;
        }

        // Get the offer details
        const { data: offerData, error: offerError } = await supabase
          .from('offers')
          .select(`
            *,
            seller:seller_id(id, name, avatar_url, university)
          `)
          .eq('id', offerId)
          .eq('buyer_id', user.id)
          .eq('status', 'accepted')
          .single();

        if (offerError) {
          throw new Error(offerError.message || 'Failed to load transaction');
        }

        if (!offerData) {
          setError('Transaction not found or you do not have permission to view it');
          setLoading(false);
          return;
        }

        setTransaction(offerData);
        setSeller(offerData.seller);

        // Get the listing details
        const { data: listingData, error: listingError } = await supabase
          .from('listings')
          .select('*')
          .eq('id', offerData.listing_id)
          .single();

        if (listingError) {
          throw new Error(listingError.message || 'Failed to load listing details');
        }

        setListing(listingData);

        // Check if the user has already submitted a review for this seller related to this listing
        const { data: existingReview, error: reviewError } = await supabase
          .from('reviews')
          .select('*')
          .eq('reviewer_id', user.id)
          .eq('seller_id', offerData.seller_id)
          .eq('listing_id', offerData.listing_id)
          .maybeSingle();

        if (!reviewError && existingReview) {
          setReviewSubmitted(true);
        }
      } catch (err) {
        console.error('Error loading transaction details:', err);
        setError(err.message || 'Failed to load transaction details');
      } finally {
        setLoading(false);
      }
    };

    loadTransaction();
  }, [offerId, user, navigate]);

  const handleReviewSuccess = () => {
    setReviewSubmitted(true);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          component={RouterLink}
          to="/offers"
          variant="outlined"
          sx={{ mt: 2 }}
        >
          Return to My Offers
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CheckCircleOutlineIcon color="success" sx={{ mr: 1, fontSize: 28 }} />
          <Typography variant="h5">
            Transaction Complete
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Typography variant="body1" paragraph>
          You've successfully purchased <strong>{listing?.title}</strong> from {seller?.name}.
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Transaction ID: {transaction?.id}<br />
          Date: {new Date(transaction?.updated_at).toLocaleDateString()}<br />
          Amount: ₵{transaction?.amount}
        </Typography>
        
        {reviewSubmitted ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            You've already submitted a review for this transaction. Thank you for your feedback!
          </Alert>
        ) : (
          <Typography variant="body2" paragraph>
            Please take a moment to review your experience with this seller.
          </Typography>
        )}
        
        <Box sx={{ mt: 2 }}>
          <Button
            component={RouterLink}
            to={`/listings/${listing?.id}`}
            variant="outlined"
            sx={{ mr: 2 }}
          >
            View Listing
          </Button>
          <Button
            component={RouterLink}
            to="/offers"
            variant="outlined"
          >
            My Offers
          </Button>
        </Box>
      </Paper>
      
      {!reviewSubmitted && (
        <PurchaseReviewForm
          sellerId={seller?.id}
          sellerName={seller?.name}
          listingId={listing?.id}
          listingTitle={listing?.title}
          transactionDate={transaction?.updated_at}
          onSuccess={handleReviewSuccess}
        />
      )}
    </Container>
  );
};

export default ReviewPurchasePage; 