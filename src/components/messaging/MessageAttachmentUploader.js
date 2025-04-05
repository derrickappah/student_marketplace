import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  Tooltip,
  LinearProgress,
  Chip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  Description as DocumentIcon,
  PictureAsPdf as PdfIcon,
  MusicNote as AudioIcon,
  Videocam as VideoIcon,
  Code as CodeIcon
} from '@mui/icons-material';

const MessageAttachmentUploader = ({ 
  onAttachmentSelected,
  maxSize = 5 * 1024 * 1024, // 5MB default
  maxFiles = 5,
  allowedTypes = "image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,audio/*,video/*"
}) => {
  const fileInputRef = useRef(null);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    setError(null);
    const selectedFiles = Array.from(e.target.files);
    
    // Validate file count
    if (attachments.length + selectedFiles.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} files at once`);
      e.target.value = null;
      return;
    }
    
    // Validate file size
    const oversizedFiles = selectedFiles.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      setError(`Some files exceed the ${formatFileSize(maxSize)} limit`);
      e.target.value = null;
      return;
    }
    
    if (selectedFiles.length > 0) {
      const newAttachments = [...attachments];
      
      selectedFiles.forEach(file => {
        // Create preview URL for images
        if (file.type.startsWith('image/')) {
          file.previewUrl = URL.createObjectURL(file);
        }
        newAttachments.push(file);
      });
      
      setAttachments(newAttachments);
      
      // Pass to parent component
      if (onAttachmentSelected) {
        onAttachmentSelected(newAttachments);
      }
    }
    
    // Clear the input value so the same file can be selected again
    e.target.value = null;
  };
  
  const handleRemoveFile = (index) => {
    // Release object URL if it exists
    if (attachments[index].previewUrl) {
      URL.revokeObjectURL(attachments[index].previewUrl);
    }
    
    const newAttachments = attachments.filter((_, i) => i !== index);
    setAttachments(newAttachments);
    
    // Pass to parent component
    if (onAttachmentSelected) {
      onAttachmentSelected(newAttachments);
    }
  };

  const getFileTypeIcon = (fileType) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon fontSize="small" />;
    } else if (fileType.startsWith('video/')) {
      return <VideoIcon fontSize="small" />;
    } else if (fileType.startsWith('audio/')) {
      return <AudioIcon fontSize="small" />;
    } else if (fileType === 'application/pdf') {
      return <PdfIcon fontSize="small" />;
    } else if (fileType.includes('document') || fileType.includes('msword')) {
      return <DocumentIcon fontSize="small" />;
    } else if (fileType.includes('text/') || fileType.includes('json') || fileType.includes('xml')) {
      return <CodeIcon fontSize="small" />;
    }
    return <FileIcon fontSize="small" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  const handlePreview = (file) => {
    if (file.previewUrl) {
      setPreviewImage(file.previewUrl);
      setPreviewOpen(true);
    }
  };
  
  const handleClosePreview = () => {
    setPreviewOpen(false);
  };

  return (
    <Box>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        multiple
        accept={allowedTypes}
      />

      <IconButton 
        color="primary" 
        onClick={handleClick}
        disabled={uploading || attachments.length >= maxFiles}
        size="small"
      >
        <AttachFileIcon />
      </IconButton>

      {error && (
        <Typography
          variant="caption"
          color="error"
          sx={{ display: 'block', mt: 1 }}
        >
          {error}
        </Typography>
      )}

      {attachments.length > 0 && (
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {attachments.map((file, index) => (
            <Chip
              key={index}
              label={file.name.length > 15 ? file.name.substring(0, 12) + '...' : file.name}
              onDelete={() => handleRemoveFile(index)}
              onClick={() => file.type.startsWith('image/') && handlePreview(file)}
              icon={getFileTypeIcon(file.type)}
              size="small"
              sx={{
                maxWidth: 150,
                '.MuiChip-label': {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                },
                cursor: file.type.startsWith('image/') ? 'pointer' : 'default'
              }}
            />
          ))}
        </Box>
      )}

      {uploading && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Uploading {attachments.length} {attachments.length === 1 ? 'file' : 'files'}...
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={uploadProgress} 
            sx={{ height: 4, borderRadius: 2, mt: 0.5 }}
          />
        </Box>
      )}
      
      {/* Image Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={handleClosePreview}
        maxWidth="md"
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Preview
          <IconButton edge="end" onClick={handleClosePreview}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box
            component="img"
            src={previewImage}
            alt="Preview"
            sx={{
              maxWidth: '100%',
              maxHeight: '70vh',
              objectFit: 'contain'
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default MessageAttachmentUploader; 