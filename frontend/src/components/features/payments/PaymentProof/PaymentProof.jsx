import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import DescriptionIcon from '@mui/icons-material/Description';
import './PaymentProof.css';

const PaymentProof = ({ proofUrl, paymentId }) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handlePreview = () => {
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = proofUrl;
    link.download = `payment-proof-${paymentId}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  if (!proofUrl) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="body2" color="text.secondary">
          No payment proof uploaded
        </Typography>
      </Box>
    );
  }

  const isImage = proofUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPDF = proofUrl.match(/\.pdf$/i);

  return (
    <Box className="payment-proof">
      <Paper variant="outlined" sx={{ p: 2 }}>
        {isImage && !imageError ? (
          <Box position="relative">
            <img
              src={proofUrl}
              alt="Payment Proof"
              className="payment-proof-image"
              onError={handleImageError}
            />
            <Box className="payment-proof-overlay">
              <IconButton
                className="preview-button"
                onClick={handlePreview}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' }
                }}
              >
                <ZoomInIcon />
              </IconButton>
            </Box>
          </Box>
        ) : isPDF ? (
          <Box textAlign="center" py={4}>
            <DescriptionIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="body1" gutterBottom>PDF Document</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Click download to view the PDF
            </Typography>
          </Box>
        ) : (
          <Box textAlign="center" py={4}>
            <Typography variant="body2" color="text.secondary">
              Unable to preview file
            </Typography>
          </Box>
        )}

        <Box display="flex" gap={1} mt={2}>
          {isImage && !imageError && (
            <Button variant="outlined" startIcon={<ZoomInIcon />} onClick={handlePreview} fullWidth>
              Preview
            </Button>
          )}
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleDownload} fullWidth>
            Download
          </Button>
        </Box>
      </Paper>

      <Dialog open={previewOpen} onClose={handleClosePreview} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Payment Proof</Typography>
            <IconButton onClick={handleClosePreview}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box className="payment-proof-preview">
            <img
              src={proofUrl}
              alt="Payment Proof Preview"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '70vh',
                objectFit: 'contain'
              }}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PaymentProof;