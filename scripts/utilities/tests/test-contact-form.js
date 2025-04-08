const { submitContactForm } = require('../src/services/supabase');

const testContactForm = async () => {
  console.log('Testing contact form submission...');

  try {
    const formData = {
      name: 'Test User',
      email: 'test@example.com',
      topic: 'general',
      message: 'This is a test message from the test script'
    };

    console.log('Submitting form data:', formData);
    
    console.log('Calling submitContactForm function...');
    const result = await submitContactForm(formData);
    
    console.log('Raw submission result:', JSON.stringify(result, null, 2));
    
    if (result && result.success) {
      console.log('SUCCESS: Contact form submission worked!');
    } else {
      console.error('FAILED: Contact form submission failed', result ? result.error : 'No result returned');
    }
    
    return result;
  } catch (error) {
    console.error('Error during test:', error);
    return { success: false, error: error.message };
  } finally {
    console.log('Test execution completed');
  }
};

// Ensure we properly handle promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Run the test with additional error handling
console.log('Starting contact form test...');

const timeoutId = setTimeout(() => {
  console.error('TEST TIMEOUT: The test did not complete within 10 seconds.');
  console.log('This might indicate a hanging promise or network issue.');
  process.exit(2);
}, 10000);

testContactForm()
  .then((result) => {
    console.log('Test completed with result:', result ? JSON.stringify(result) : 'No result');
    clearTimeout(timeoutId);
    process.exit(result && result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test failed with uncaught error:', error);
    clearTimeout(timeoutId);
    process.exit(1);
  }); 