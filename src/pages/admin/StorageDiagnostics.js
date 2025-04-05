import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  IconButton,
  Card,
  CardContent,
  TextField,
  Grid,
  ButtonGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  FileCopy as FileCopyIcon,
  Storage as StorageIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { 
  checkStorageBuckets, 
  downloadMessageAttachment, 
  supabase, 
  listStorageFiles,
  listMessageAttachments,
  checkTableStructure
} from '../../services/supabase';

const StorageDiagnostics = () => {
  const [loading, setLoading] = useState(false);
  const [bucketData, setBucketData] = useState(null);
  const [error, setError] = useState(null);
  const [testId, setTestId] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const [newBucketName, setNewBucketName] = useState('');
  const [creatingBucket, setCreatingBucket] = useState(false);
  const [bucketFiles, setBucketFiles] = useState({});
  const [selectedBucket, setSelectedBucket] = useState('');
  const [currentPath, setCurrentPath] = useState('');
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [databaseAttachments, setDatabaseAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [tableInfo, setTableInfo] = useState(null);
  const [checkingTable, setCheckingTable] = useState(false);
  const [creatingTestEntry, setCreatingTestEntry] = useState(false);
  const [testEntryResult, setTestEntryResult] = useState(null);
  const [specificPath, setSpecificPath] = useState('message_attachments/4e179c82-8c04-472f-ac62-a4e510ddb97b/DSC08433.webp');
  const [specificBucket, setSpecificBucket] = useState('attachments');
  const [pathCheckResult, setPathCheckResult] = useState(null);
  const [checkingPath, setCheckingPath] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);

  const handleCheckBuckets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await checkStorageBuckets();
      setBucketData(result);
      
      if (!result.success) {
        setError(result.error || 'Unknown error checking buckets');
      }
    } catch (err) {
      console.error('Error checking buckets:', err);
      setError(err.message || 'An unexpected error occurred');
      setBucketData(null);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateBucket = async () => {
    if (!newBucketName.trim()) {
      setError('Please enter a valid bucket name');
      return;
    }
    
    setCreatingBucket(true);
    setError(null);
    
    try {
      const { data, error: bucketError } = await supabase.storage.createBucket(newBucketName, {
        public: true, // Make the bucket public for attachment access
      });
      
      if (bucketError) {
        // Check for row-level security error
        if (bucketError.message.includes('row-level security policy')) {
          throw new Error(`You don't have permission to create buckets through the client API. Please create the "${newBucketName}" bucket through the Supabase dashboard instead.`);
        }
        throw new Error(`Failed to create bucket: ${bucketError.message}`);
      }
      
      // Refresh the bucket list
      await handleCheckBuckets();
      setNewBucketName('');
    } catch (err) {
      console.error('Error creating bucket:', err);
      setError(err.message || 'Failed to create bucket');
    } finally {
      setCreatingBucket(false);
    }
  };
  
  const handleListFiles = async (bucketName, path = '') => {
    if (!bucketName) return;
    
    setLoadingFiles(true);
    setSelectedBucket(bucketName);
    setCurrentPath(path);
    setError(null);
    
    try {
      const result = await listStorageFiles(bucketName, path);
      
      if (!result.success) {
        throw new Error(result.error || `Failed to list files in bucket ${bucketName}`);
      }
      
      setBucketFiles(prev => ({
        ...prev,
        [bucketName]: {
          ...(prev[bucketName] || {}),
          [path || 'root']: result.data
        }
      }));
    } catch (err) {
      console.error('Error listing files:', err);
      setError(err.message || 'An unexpected error occurred listing files');
    } finally {
      setLoadingFiles(false);
    }
  };
  
  const handleBreadcrumbClick = (path) => {
    // Construct the path up to the clicked breadcrumb
    const parts = currentPath.split('/');
    const index = path ? parts.indexOf(path) : -1;
    
    if (index === -1) {
      // Click on root
      handleListFiles(selectedBucket, '');
    } else {
      // Click on a folder in the path
      const newPath = parts.slice(0, index + 1).join('/');
      handleListFiles(selectedBucket, newPath);
    }
  };
  
  const handleFetchAttachments = async () => {
    setLoadingAttachments(true);
    setError(null);
    
    try {
      const result = await listMessageAttachments(50);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch attachments from database');
      }
      
      setDatabaseAttachments(result.data || []);
    } catch (err) {
      console.error('Error fetching attachments:', err);
      setError(err.message || 'An unexpected error occurred fetching attachments');
    } finally {
      setLoadingAttachments(false);
    }
  };
  
  const handleTestDownload = async () => {
    if (!testId.trim()) {
      setError('Please enter a valid message or attachment ID to test');
      return;
    }
    
    setTestLoading(true);
    setTestResult(null);
    setError(null);
    
    try {
      // Create a test attachment object with the provided ID
      const testAttachment = {
        message_id: testId,
        file_name: 'test.jpg' // Assuming a test file name
      };
      
      // Try to construct a download URL with our improved logic
      const result = await downloadMessageAttachment(testAttachment);
      setTestResult(result);
      
      if (!result.success) {
        setError(result.error || 'Unable to construct a valid download URL');
      }
    } catch (err) {
      console.error('Error testing download:', err);
      setError(err.message || 'An unexpected error occurred during test');
      setTestResult(null);
    } finally {
      setTestLoading(false);
    }
  };
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => alert('Copied to clipboard!'))
      .catch(err => console.error('Failed to copy:', err));
  };

  // Common bucket names that should be created if missing
  const commonBucketNames = [
    'message_attachments',
    'attachments',
    'media',
    'uploads',
    'files',
    'images'
  ];

  const createCommonBucket = async (bucketName) => {
    setCreatingBucket(true);
    setError(null);
    
    try {
      const { data, error: bucketError } = await supabase.storage.createBucket(bucketName, {
        public: true,
      });
      
      if (bucketError) {
        // Check for row-level security error
        if (bucketError.message.includes('row-level security policy')) {
          throw new Error(`You don't have permission to create buckets through the client API. Please create the "${bucketName}" bucket through the Supabase dashboard instead.`);
        }
        throw new Error(`Failed to create bucket ${bucketName}: ${bucketError.message}`);
      }
      
      // Refresh the bucket list
      await handleCheckBuckets();
      
      return { success: true };
    } catch (err) {
      console.error(`Error creating bucket ${bucketName}:`, err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setCreatingBucket(false);
    }
  };
  
  const handleCheckTable = async () => {
    setCheckingTable(true);
    setError(null);
    
    try {
      const result = await checkTableStructure('message_attachments');
      setTableInfo(result);
      
      if (!result.success) {
        setError(result.error || 'Failed to check message_attachments table structure');
      }
    } catch (err) {
      console.error('Error checking table structure:', err);
      setError(err.message || 'An unexpected error occurred checking table structure');
      setTableInfo(null);
    } finally {
      setCheckingTable(false);
    }
  };
  
  // Function to create a test attachment entry in the database
  const createTestAttachmentEntry = async () => {
    if (!testId.trim()) {
      setError('Please enter a valid message ID in the test field below');
      return;
    }
    
    setCreatingTestEntry(true);
    setTestEntryResult(null);
    setError(null);
    
    try {
      // First check if the message exists
      const { data: messageCheck, error: messageError } = await supabase
        .from('messages')
        .select('id')
        .eq('id', testId)
        .single();
      
      if (messageError) {
        throw new Error(`Message with ID ${testId} does not exist. Please use a valid message ID.`);
      }
      
      // Create a test attachment record
      const testAttachment = {
        message_id: testId,
        file_url: `https://${window.location.hostname}/test-attachment.jpg`,
        file_name: 'test-attachment.jpg',
        file_type: 'image/jpeg',
        file_size: 12345,
        created_at: new Date().toISOString()
      };
      
      // Insert the record
      const { data, error } = await supabase
        .from('message_attachments')
        .insert([testAttachment])
        .select();
      
      if (error) {
        throw new Error(`Failed to create test attachment: ${error.message}`);
      }
      
      setTestEntryResult({
        success: true,
        data,
        message: 'Test attachment record created successfully!'
      });
      
      // Refresh attachment list
      await handleFetchAttachments();
      
    } catch (err) {
      console.error('Error creating test attachment entry:', err);
      setError(err.message || 'An unexpected error occurred creating test attachment');
      setTestEntryResult({
        success: false,
        error: err.message
      });
    } finally {
      setCreatingTestEntry(false);
    }
  };
  
  // Render breadcrumbs for the current path
  const renderBreadcrumbs = () => {
    if (!selectedBucket) return null;
    
    const parts = currentPath ? currentPath.split('/') : [];
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        <Chip 
          label={selectedBucket}
          color="primary"
          sx={{ mr: 1, mb: 1 }}
          onClick={() => handleListFiles(selectedBucket, '')}
        />
        
        {parts.length > 0 && (
          <Typography variant="body2" sx={{ mr: 1, mb: 1 }}>
            /
          </Typography>
        )}
        
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <Chip
              label={part}
              variant="outlined"
              size="small"
              sx={{ mr: 1, mb: 1 }}
              onClick={() => handleBreadcrumbClick(part)}
            />
            {index < parts.length - 1 && (
              <Typography variant="body2" sx={{ mr: 1, mb: 1 }}>
                /
              </Typography>
            )}
          </React.Fragment>
        ))}
      </Box>
    );
  };
  
  // Render a file explorer for the selected bucket
  const renderFileExplorer = () => {
    if (!selectedBucket) return null;
    
    const files = bucketFiles[selectedBucket]?.[currentPath || 'root'] || [];
    
    return (
      <Box sx={{ mt: 2 }}>
        {renderBreadcrumbs()}
        
        {loadingFiles ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : files.length === 0 ? (
          <Alert severity="info">
            No files found in this location
          </Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {files.map((file, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {file.type === 'folder' ? (
                          <FolderIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                        ) : (
                          <FileIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        )}
                        {file.type === 'folder' ? (
                          <Button
                            sx={{ textAlign: 'left', justifyContent: 'flex-start' }}
                            onClick={() => handleListFiles(selectedBucket, file.path)}
                          >
                            {file.name}
                          </Button>
                        ) : (
                          file.name
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {file.type === 'folder' ? (
                        <Chip 
                          size="small" 
                          label={`Folder (${file.itemCount || 0} items)`} 
                          color="primary"
                          variant="outlined"
                        />
                      ) : (
                        <Chip 
                          size="small" 
                          label={file.metadata?.mimetype || 'File'} 
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {file.type === 'file' && file.metadata?.size ? (
                        formatBytes(file.metadata.size)
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => copyToClipboard(file.path)}
                        title="Copy path"
                      >
                        <FileCopyIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    );
  };
  
  // Render database attachments
  const renderDatabaseAttachments = () => {
    if (loadingAttachments) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (!databaseAttachments || databaseAttachments.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No attachments found in the database
        </Alert>
      );
    }
    
    return (
      <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>File Name</TableCell>
              <TableCell>Message ID</TableCell>
              <TableCell>Storage URL</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {databaseAttachments.map((attachment) => (
              <TableRow key={attachment.id}>
                <TableCell>{attachment.id}</TableCell>
                <TableCell>{attachment.file_name}</TableCell>
                <TableCell>{attachment.message_id}</TableCell>
                <TableCell sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {attachment.file_url ? (
                    <Typography variant="body2" noWrap>
                      {attachment.file_url}
                    </Typography>
                  ) : (
                    <Chip size="small" label="Missing URL" color="error" />
                  )}
                </TableCell>
                <TableCell>
                  <ButtonGroup size="small">
                    <Button
                      onClick={() => {
                        setTestId(attachment.message_id);
                        setTimeout(() => {
                          const testElement = document.getElementById('test-attachment-section');
                          if (testElement) testElement.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }}
                      title="Test this attachment"
                    >
                      Test
                    </Button>
                    <Button
                      onClick={() => copyToClipboard(JSON.stringify(attachment))}
                      title="Copy attachment data"
                    >
                      Copy
                    </Button>
                  </ButtonGroup>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  // Helper function to format bytes into readable format
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Function to check a specific file path
  const checkSpecificPath = async (bucketName, filePath) => {
    setLoadingFiles(true);
    setError(null);
    
    try {
      console.log(`Checking specific path: ${bucketName}/${filePath}`);
      
      // Try to get the file metadata first
      const { data: fileData, error: fileError } = await supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      // Now try to directly fetch the file to check if it's accessible
      if (fileData?.publicUrl) {
        try {
          const response = await fetch(fileData.publicUrl, { method: 'HEAD' });
          
          return {
            success: response.ok,
            status: response.status,
            statusText: response.statusText,
            url: fileData.publicUrl,
            exists: response.ok,
            message: response.ok 
              ? `File exists and is accessible: ${fileData.publicUrl}` 
              : `File cannot be accessed (status: ${response.status} ${response.statusText})`
          };
        } catch (fetchError) {
          return {
            success: false,
            error: fetchError.message,
            url: fileData.publicUrl,
            exists: false,
            message: `Error checking file: ${fetchError.message}`
          };
        }
      } else {
        // If we can't even get a URL, the file likely doesn't exist
        return {
          success: false,
          error: fileError?.message || 'Failed to get public URL',
          exists: false,
          message: `File doesn't exist at path: ${bucketName}/${filePath}`
        };
      }
    } catch (err) {
      console.error('Error checking specific path:', err);
      return {
        success: false,
        error: err.message,
        exists: false,
        message: `Error checking path: ${err.message}`
      };
    } finally {
      setLoadingFiles(false);
    }
  };
  
  // Function to create a folder manually if needed
  const createFolder = async (bucketName, folderPath) => {
    try {
      // Create an empty file that marks a folder
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(`${folderPath}/.folder`, new Blob([''], { type: 'text/plain' }), {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        throw new Error(`Failed to create folder: ${error.message}`);
      }
      
      return { success: true, message: `Created folder: ${bucketName}/${folderPath}` };
    } catch (err) {
      console.error('Error creating folder:', err);
      return { 
        success: false, 
        error: err.message, 
        message: `Failed to create folder: ${err.message}` 
      };
    }
  };

  // Handler to check a specific path
  const handleCheckSpecificPath = async () => {
    setCheckingPath(true);
    setError(null);
    
    try {
      const result = await checkSpecificPath(specificBucket, specificPath);
      setPathCheckResult(result);
      
      if (!result.success) {
        console.warn(result.message);
      }
    } catch (err) {
      console.error('Error in handleCheckSpecificPath:', err);
      setError(err.message || 'An unexpected error occurred checking path');
      setPathCheckResult(null);
    } finally {
      setCheckingPath(false);
    }
  };
  
  // Handler to create a necessary folder
  const handleCreateFolder = async () => {
    setCreatingFolder(true);
    setError(null);
    
    try {
      // Extract the folder path from the specific path (remove filename)
      const folderPath = specificPath.split('/').slice(0, -1).join('/');
      
      const result = await createFolder(specificBucket, folderPath);
      
      if (result.success) {
        setError(null);
        // Refresh the file explorer for this bucket
        if (selectedBucket === specificBucket) {
          await handleListFiles(specificBucket, '');
        }
        
        // Check the path again to see if it's now accessible
        await handleCheckSpecificPath();
      } else {
        setError(result.message || 'Failed to create folder');
      }
    } catch (err) {
      console.error('Error in handleCreateFolder:', err);
      setError(err.message || 'An unexpected error occurred creating folder');
    } finally {
      setCreatingFolder(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Storage Diagnostics
          </Typography>
          <Button 
            variant="contained" 
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
            onClick={handleCheckBuckets}
            disabled={loading}
          >
            {loading ? 'Checking...' : 'Check Buckets'}
          </Button>
        </Box>
        
        <Typography variant="body1" paragraph>
          This tool helps diagnose Supabase storage bucket issues related to message attachments.
          Use it to verify available buckets and test attachment URL construction.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* Create Missing Buckets */}
        <Box sx={{ mt: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Create Storage Bucket
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            If you're getting "Bucket not found" errors, create the required buckets here.
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Having row-level security errors? Create buckets directly in Supabase:
            </Typography>
            <ol style={{ marginTop: 0, paddingLeft: '1.5rem' }}>
              <li>Go to your <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer">Supabase project dashboard</a></li>
              <li>Navigate to "Storage" in the left sidebar</li>
              <li>Click "New Bucket" button</li>
              <li>Enter one of these bucket names: <strong>message_attachments</strong>, <strong>attachments</strong>, or <strong>media</strong></li>
              <li>Make sure to check "Public bucket" for attachment access</li>
              <li>Click "Create bucket"</li>
              <li>Come back here and click "Check Buckets" to verify</li>
            </ol>
          </Alert>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Quick Create Common Buckets:
            </Typography>
            <ButtonGroup variant="outlined" sx={{ mb: 2 }}>
              {commonBucketNames.map(name => (
                <Button 
                  key={name}
                  onClick={() => createCommonBucket(name)}
                  disabled={creatingBucket || loading}
                  startIcon={<AddIcon />}
                >
                  {name}
                </Button>
              ))}
            </ButtonGroup>
          </Box>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8}>
              <TextField
                label="New Bucket Name"
                variant="outlined"
                fullWidth
                value={newBucketName}
                onChange={(e) => setNewBucketName(e.target.value)}
                placeholder="Enter bucket name (e.g., message_attachments)"
                disabled={creatingBucket}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="contained"
                color="success"
                onClick={handleCreateBucket}
                disabled={creatingBucket || !newBucketName.trim()}
                startIcon={creatingBucket ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                fullWidth
              >
                {creatingBucket ? 'Creating...' : 'Create Bucket'}
              </Button>
            </Grid>
          </Grid>
        </Box>
        
        {/* File Explorer Section */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">Storage Explorer</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" paragraph>
              Browse files in your storage buckets to diagnose missing attachment issues.
            </Typography>
            
            {bucketData && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Select a bucket to explore:
                </Typography>
                <ButtonGroup variant="outlined" sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  {bucketData.buckets && bucketData.buckets.map((bucket, index) => (
                    <Button 
                      key={bucket.id || index}
                      onClick={() => handleListFiles(bucket.name, '')}
                      startIcon={<StorageIcon />}
                      color={selectedBucket === bucket.name ? 'primary' : 'inherit'}
                      variant={selectedBucket === bucket.name ? 'contained' : 'outlined'}
                    >
                      {bucket.name}
                    </Button>
                  ))}
                </ButtonGroup>
                
                {renderFileExplorer()}
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
        
        {/* Attachment Database Records */}
        <Accordion defaultExpanded sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">Attachment Database Records</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" paragraph>
              View attachment records from the database to see if they match the actual files in storage.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant="outlined"
                onClick={handleFetchAttachments}
                startIcon={loadingAttachments ? <CircularProgress size={20} /> : <SearchIcon />}
                disabled={loadingAttachments}
              >
                {loadingAttachments ? 'Loading...' : 'Fetch Attachment Records'}
              </Button>
              
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleCheckTable}
                startIcon={checkingTable ? <CircularProgress size={20} /> : <StorageIcon />}
                disabled={checkingTable}
              >
                {checkingTable ? 'Checking...' : 'Check Table Structure'}
              </Button>
            </Box>
            
            {/* Display table structure information */}
            {tableInfo && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    message_attachments Table Info
                  </Typography>
                  
                  {!tableInfo.exists ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      The message_attachments table does not exist in the database! This is why no attachments are found.
                      <Box sx={{ mt: 2 }}>
                        <Button 
                          variant="contained" 
                          color="primary"
                          onClick={() => {
                            // Copy script to clipboard
                            const script = `
CREATE TABLE message_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_message_attachments_message_id ON message_attachments(message_id);
                            `;
                            copyToClipboard(script);
                          }}
                        >
                          Copy Create Table Script
                        </Button>
                      </Box>
                    </Alert>
                  ) : (
                    <>
                      <Alert severity="success" sx={{ mb: 2 }}>
                        The message_attachments table exists in the database!
                      </Alert>
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Table Columns:
                      </Typography>
                      
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Column Name</TableCell>
                              <TableCell>Data Type</TableCell>
                              <TableCell>Nullable</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {tableInfo.columns && tableInfo.columns.map((column, index) => (
                              <TableRow key={index}>
                                <TableCell>{column.column_name}</TableCell>
                                <TableCell>{column.data_type}</TableCell>
                                <TableCell>{column.is_nullable === 'YES' ? 'Yes' : 'No'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Create Test Attachment Record:
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          Enter a message ID below and create a test attachment record to verify database functionality.
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <TextField
                            label="Message ID for Test Record"
                            variant="outlined"
                            size="small"
                            value={testId}
                            onChange={(e) => setTestId(e.target.value)}
                            sx={{ flexGrow: 1 }}
                          />
                          <Button
                            variant="contained"
                            color="secondary"
                            onClick={createTestAttachmentEntry}
                            disabled={creatingTestEntry || !testId.trim()}
                            startIcon={creatingTestEntry ? <CircularProgress size={20} color="inherit" /> : null}
                          >
                            {creatingTestEntry ? 'Creating...' : 'Create Test Record'}
                          </Button>
                        </Box>
                        
                        {testEntryResult && (
                          <Alert 
                            severity={testEntryResult.success ? 'success' : 'error'}
                            sx={{ mb: 2 }}
                          >
                            {testEntryResult.success 
                              ? testEntryResult.message 
                              : `Error: ${testEntryResult.error}`}
                          </Alert>
                        )}
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
            
            {renderDatabaseAttachments()}
          </AccordionDetails>
        </Accordion>
        
        {/* Bucket Results */}
        {bucketData && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              Storage Buckets
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {bucketData.message}
            </Typography>
            
            {bucketData.buckets && bucketData.buckets.length > 0 ? (
              <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                {bucketData.buckets.map((bucket, index) => (
                  <React.Fragment key={bucket.id || index}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <StorageIcon sx={{ mr: 1 }} color="primary" />
                            <Typography variant="subtitle1">
                              {bucket.name}
                            </Typography>
                            <Chip
                              size="small"
                              label={bucket.accessible ? 'Accessible' : 'Not Accessible'}
                              color={bucket.accessible ? 'success' : 'error'}
                              sx={{ ml: 2 }}
                            />
                            {bucket.fileCount !== undefined && (
                              <Chip
                                size="small"
                                label={`${bucket.fileCount} files`}
                                variant="outlined"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                        }
                        secondary={bucket.error ? `Error: ${bucket.error}` : 'No errors reported'}
                      />
                      <Box>
                        <IconButton 
                          onClick={() => copyToClipboard(bucket.name)} 
                          size="small" 
                          title="Copy bucket name"
                          aria-label="Copy bucket name"
                        >
                          <FileCopyIcon fontSize="small" />
                        </IconButton>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleListFiles(bucket.name, '')}
                          sx={{ ml: 1 }}
                        >
                          Explore
                        </Button>
                      </Box>
                    </ListItem>
                    {index < bucketData.buckets.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Alert severity="warning">
                No storage buckets found. This may indicate a configuration issue with your Supabase storage.
                Create the required buckets above to fix attachment download issues.
              </Alert>
            )}
          </Box>
        )}
        
        {/* Test Attachment URL Construction */}
        <Box sx={{ mt: 4 }} id="test-attachment-section">
          <Typography variant="h5" gutterBottom>
            Test Attachment URL Construction
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Enter a message ID to test the URL construction logic for attachments.
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                label="Message ID"
                variant="outlined"
                fullWidth
                value={testId}
                onChange={(e) => setTestId(e.target.value)}
                placeholder="Enter message ID"
                disabled={testLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                variant="contained"
                onClick={handleTestDownload}
                disabled={testLoading || !testId.trim()}
                startIcon={testLoading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {testLoading ? 'Testing...' : 'Test URL Construction'}
              </Button>
            </Grid>
          </Grid>
          
          {testResult && (
            <Card sx={{ mt: 2, bgcolor: testResult.success ? 'success.light' : 'error.light' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  {testResult.success ? (
                    <CheckCircleIcon sx={{ mr: 1 }} color="success" />
                  ) : (
                    <ErrorIcon sx={{ mr: 1 }} color="error" />
                  )}
                  <Box>
                    <Typography variant="h6">
                      {testResult.success ? 'URL Construction Succeeded' : 'URL Construction Failed'}
                    </Typography>
                    <Typography variant="body2">
                      {testResult.message || testResult.error || 'No additional information'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default StorageDiagnostics; 