import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  Divider,
  Avatar,
  CircularProgress,
  Tab,
  Tabs,
} from '@mui/material';
import { Person, Save, Lock, ArrowBack } from '@mui/icons-material';
import useAuth from '../../hooks/useAuth';
import useNotification from '../../hooks/useNotification';
import {
  validateRequired,
  validatePhone,
  validateIFSC,
  validateUPI,
  validateAccountNumber,
  validatePassword,
  validateConfirmPassword,
} from '../../utils/validators';
import { getInitials } from '../../utils/formatters';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateProfile, changePassword, logout } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);

  // Profile form data
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bankDetails: {
      accountHolderName: user?.bankDetails?.accountHolderName || '',
      accountNumber: user?.bankDetails?.accountNumber || '',
      ifscCode: user?.bankDetails?.ifscCode || '',
      bankName: user?.bankDetails?.bankName || '',
      upiId: user?.bankDetails?.upiId || '',
    },
    emergencyContact: {
      name: user?.emergencyContact?.name || '',
      phone: user?.emergencyContact?.phone || '',
      relationship: user?.emergencyContact?.relationship || '',
    },
  });

  // Password form data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

  // Handle profile change
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    const keys = name.split('.');

    if (keys.length === 1) {
      setProfileData((prev) => ({ ...prev, [name]: value }));
    } else {
      setProfileData((prev) => ({
        ...prev,
        [keys[0]]: {
          ...prev[keys[0]],
          [keys[1]]: value,
        },
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Handle password change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Validate profile form
  const validateProfileForm = () => {
    const newErrors = {};

    const nameError = validateRequired(profileData.name, 'Name');
    if (nameError) newErrors.name = nameError;

    const phoneError = validatePhone(profileData.phone);
    if (phoneError) newErrors.phone = phoneError;

    // Bank details validation (optional)
    if (profileData.bankDetails.accountNumber) {
      const accountError = validateAccountNumber(profileData.bankDetails.accountNumber);
      if (accountError) newErrors['bankDetails.accountNumber'] = accountError;
    }

    if (profileData.bankDetails.ifscCode) {
      const ifscError = validateIFSC(profileData.bankDetails.ifscCode);
      if (ifscError) newErrors['bankDetails.ifscCode'] = ifscError;
    }

    if (profileData.bankDetails.upiId) {
      const upiError = validateUPI(profileData.bankDetails.upiId);
      if (upiError) newErrors['bankDetails.upiId'] = upiError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate password form
  const validatePasswordForm = () => {
    const newErrors = {};

    const currentPasswordError = validateRequired(passwordData.currentPassword, 'Current password');
    if (currentPasswordError) newErrors.currentPassword = currentPasswordError;

    const newPasswordError = validatePassword(passwordData.newPassword);
    if (newPasswordError) newErrors.newPassword = newPasswordError;

    const confirmPasswordError = validateConfirmPassword(
      passwordData.newPassword,
      passwordData.confirmPassword
    );
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle profile submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!validateProfileForm()) {
      return;
    }

    setLoading(true);

    try {
      await updateProfile(profileData);
      showSuccess('Profile updated successfully!');
    } catch (error) {
      showError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Handle password submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    setLoading(true);

    try {
      await changePassword(passwordData);
      showSuccess('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      showError(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/dashboard')}
        sx={{ mb: 2 }}
      >
        Back to Dashboard
      </Button>

      <Paper elevation={3}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'primary.main',
                fontSize: 32,
                mr: 2,
              }}
            >
              {getInitials(user?.name)}
            </Avatar>
            <Box>
              <Typography variant="h5">{user?.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </Box>

          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
            <Tab icon={<Person />} label="Profile" />
            <Tab icon={<Lock />} label="Change Password" />
          </Tabs>

          {tabValue === 0 && (
            <form onSubmit={handleProfileSubmit}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    error={!!errors.name}
                    helperText={errors.name}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    error={!!errors.phone}
                    helperText={errors.phone}
                    inputProps={{ maxLength: 10 }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Bank Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Account Holder Name"
                    name="bankDetails.accountHolderName"
                    value={profileData.bankDetails.accountHolderName}
                    onChange={handleProfileChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Account Number"
                    name="bankDetails.accountNumber"
                    value={profileData.bankDetails.accountNumber}
                    onChange={handleProfileChange}
                    error={!!errors['bankDetails.accountNumber']}
                    helperText={errors['bankDetails.accountNumber']}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="IFSC Code"
                    name="bankDetails.ifscCode"
                    value={profileData.bankDetails.ifscCode}
                    onChange={handleProfileChange}
                    error={!!errors['bankDetails.ifscCode']}
                    helperText={errors['bankDetails.ifscCode']}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Bank Name"
                    name="bankDetails.bankName"
                    value={profileData.bankDetails.bankName}
                    onChange={handleProfileChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="UPI ID"
                    name="bankDetails.upiId"
                    value={profileData.bankDetails.upiId}
                    onChange={handleProfileChange}
                    error={!!errors['bankDetails.upiId']}
                    helperText={errors['bankDetails.upiId']}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Emergency Contact
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Name"
                    name="emergencyContact.name"
                    value={profileData.emergencyContact.name}
                    onChange={handleProfileChange}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Phone"
                    name="emergencyContact.phone"
                    value={profileData.emergencyContact.phone}
                    onChange={handleProfileChange}
                    inputProps={{ maxLength: 10 }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Relationship"
                    name="emergencyContact.relationship"
                    value={profileData.emergencyContact.relationship}
                    onChange={handleProfileChange}
                  />
                </Grid>
              </Grid>

              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={loading}
                sx={{ mt: 3 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>
            </form>
          )}

          {tabValue === 1 && (
            <form onSubmit={handlePasswordSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    error={!!errors.currentPassword}
                    helperText={errors.currentPassword}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="New Password"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    error={!!errors.newPassword}
                    helperText={errors.newPassword}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword}
                  />
                </Grid>
              </Grid>

              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={loading}
                sx={{ mt: 3 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Change Password'}
              </Button>
            </form>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default Profile;