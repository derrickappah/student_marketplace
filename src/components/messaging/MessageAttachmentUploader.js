import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Typography,
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { v4 as uuidv4 } from 'uuid';
import { supabase, getSignedUrl } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import SafeImage from './SafeImage';

/**
 * MessageAttachmentUploader component for uploading file attachments in messages
 * 
 * @param {Object} props
 * @param {Function} props.onUploadComplete - Callback when upload is complete with file data
 * @param {Function} props.onError - Callback for handling errors
 */
const MessageAttachmentUploader = ({ onUploadComplete, onError }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setSelectedFile(null);
    setProgress(0);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Limit file size to 10MB
      if (file.size > 10 * 1024 * 1024) {
        onError?.('File size exceeds 10MB limit');
      return;
      }
      setSelectedFile(file);
    }
  };

  const handleFileDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const file = event.dataTransfer.files[0];
    if (file) {
      // Limit file size to 10MB
      if (file.size > 10 * 1024 * 1024) {
        onError?.('File size exceeds 10MB limit');
      return;
      }
      setSelectedFile(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    
    setUploading(true);
    setProgress(0);
    
    try {
      // Generate unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `uploads/${user.id}/${fileName}`;
      const bucket = 'message-attachments';
      
      // Upload file to Supabase Storage
      const { error, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            setProgress(Math.round((progress.loaded / progress.total) * 100));
          }
        });
      
      if (error) throw error;
      
      // Get a signed URL for better CORS handling
      let publicUrl;
      try {
        publicUrl = await getSignedUrl(bucket, filePath, 3600); // 1 hour expiry
        
        if (!publicUrl) {
          // Fallback to public URL if signed URL fails
          publicUrl = supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
        }
      } catch (urlError) {
        console.error('Error getting signed URL:', urlError);
        // Fallback to public URL
        publicUrl = supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
      }
      
      const fileData = {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        url: publicUrl,
        path: filePath,
        bucket: bucket
      };
      
      onUploadComplete?.(fileData);
      handleClose();
    } catch (error) {
      console.error('Error uploading file:', error);
      onError?.(error.message || 'Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return null;
    
    if (selectedFile.type.startsWith('image/')) {
      return (
        <Box sx={{ position: 'relative', width: '100%', height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <SafeImage
            src={URL.createObjectURL(selectedFile)}
            alt="Preview"
            sx={{ 
              width: '100%', 
              height: 200, 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center' 
            }}
          />
        </Box>
      );
    }
    
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
        <InsertDriveFileIcon color="primary" sx={{ fontSize: 60 }} />
        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: '100%' }}>
          {selectedFile.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {Math.round(selectedFile.size / 1024)} KB
        </Typography>
      </Box>
    );
  };

  // Component for triggering file upload
  const TriggerButton = (
    <IconButton onClick={handleOpen} color="primary" size="medium">
      <AttachFileIcon />
    </IconButton>
  );

  return (
    <>
      {TriggerButton}
      
      <Dialog open={open} onClose={!uploading ? handleClose : undefined} maxWidth="sm" fullWidth>
        <DialogTitle>
          Attach File
          {!uploading && (
      <IconButton 
              aria-label="close"
              onClick={handleClose}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
      </IconButton>
          )}
        </DialogTitle>
        
        <DialogContent>
          {!selectedFile ? (
            <Box
              sx={{
                border: '2px dashed #ccc',
                borderRadius: 1,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': { borderColor: 'primary.main' }
              }}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                accept="image/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              />
              <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body1" gutterBottom>
                Drag & drop a file here or click to browse
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Maximum file size: 10MB
              </Typography>
        </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              {getFileIcon()}

      {uploading && (
                <Box sx={{ width: '100%', mt: 2 }}>
                  <LinearProgress variant="determinate" value={progress} />
                  <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 1 }}>
                    {progress}% Uploaded
          </Typography>
                </Box>
              )}
        </Box>
      )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleClose} 
            disabled={uploading}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            variant="contained"
            startIcon={uploading && <CircularProgress size={16} color="inherit" />}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MessageAttachmentUploader; 