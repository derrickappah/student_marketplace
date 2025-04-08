import { Box, Rating, Typography } from '@mui/material';

const ProductPage = () => {
  const [productRating, setProductRating] = useState({ rating: 0, count: 0 });

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        if (!listingId) return;

        // Fetch listing details and ratings simultaneously
        const [listingData, ratingData] = await Promise.all([
          getListingById(listingId),
          getProductRating(listingId)
        ]);

        setListing(listingData);
        setProductRating(ratingData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching product details:', error);
        setError('Failed to load product details');
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [listingId]);

  const handleReviewSuccess = async () => {
    // Refresh the ratings after a new review is submitted
    try {
      const newRating = await getProductRating(listingId);
      setProductRating(newRating);
    } catch (error) {
      console.error('Error refreshing ratings:', error);
    }
  };

  return (
    <Box>
      {/* Display product rating */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Rating value={productRating.rating} precision={0.5} readOnly />
        <Typography variant="body2" sx={{ ml: 1 }}>
          ({productRating.count} {productRating.count === 1 ? 'review' : 'reviews'})
        </Typography>
      </Box>

      <ReviewForm
        listingId={listingId}
        sellerId={listing?.seller_id}
        reviewType="product"
        onSuccess={handleReviewSuccess}
      />
    </Box>
  );
};

export default ProductPage;