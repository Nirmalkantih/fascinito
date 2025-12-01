import { useState } from 'react'
import {
  Container,
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  alpha,
  useTheme
} from '@mui/material'
import { Delete as DeleteIcon, Security as SecurityIcon, Notifications as NotificationsIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'

export default function Settings() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const theme = useTheme()

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    orderUpdates: true,
    promotionalEmails: false,
    smsNotifications: false
  })

  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false)
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
    toast.success('Notification preferences updated')
  }

  const handleChangePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      toast.error('Please fill in all password fields')
      return
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwords.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        })
      })

      if (response.ok) {
        toast.success('Password changed successfully')
        setChangePasswordDialogOpen(false)
        setPasswords({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        toast.error('Failed to change password')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('An error occurred while changing password')
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type DELETE to confirm account deletion')
      return
    }

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        toast.success('Account deleted successfully')
        logout()
        navigate('/login')
      } else {
        toast.error('Failed to delete account')
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('An error occurred while deleting account')
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Settings
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage your account preferences and security
        </Typography>
      </Box>

      {/* Notification Preferences */}
      <Card sx={{ mb: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
        <CardHeader
          avatar={<NotificationsIcon sx={{ color: theme.palette.primary.main }} />}
          title="Notification Preferences"
          titleTypographyProps={{ variant: 'h6', sx: { fontWeight: 600 } }}
        />
        <Divider />
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={notifications.emailNotifications}
                  onChange={() => handleNotificationChange('emailNotifications')}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Email Notifications
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Receive emails about your account activity
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', my: 1 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={notifications.orderUpdates}
                  onChange={() => handleNotificationChange('orderUpdates')}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Order Updates
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Get notified about your orders and shipments
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', my: 1 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={notifications.promotionalEmails}
                  onChange={() => handleNotificationChange('promotionalEmails')}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Promotional Emails
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Receive special offers and promotions
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', my: 1 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={notifications.smsNotifications}
                  onChange={() => handleNotificationChange('smsNotifications')}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    SMS Notifications
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Receive text message alerts
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', my: 1 }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card sx={{ mb: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
        <CardHeader
          avatar={<SecurityIcon sx={{ color: theme.palette.primary.main }} />}
          title="Security"
          titleTypographyProps={{ variant: 'h6', sx: { fontWeight: 600 } }}
        />
        <Divider />
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                Password
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 2 }}>
                Change your account password regularly to keep your account secure
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setChangePasswordDialogOpen(true)}
              >
                Change Password
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card sx={{ border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`, backgroundColor: alpha(theme.palette.error.main, 0.02) }}>
        <CardHeader
          title="Danger Zone"
          titleTypographyProps={{ variant: 'h6', sx: { fontWeight: 600, color: theme.palette.error.main } }}
        />
        <Divider />
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            These actions cannot be undone. Please proceed with caution.
          </Alert>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              Delete Account
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 2 }}>
              Permanently delete your account and all associated data
            </Typography>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteAccountDialogOpen(true)}
            >
              Delete Account
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordDialogOpen} onClose={() => setChangePasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              type="password"
              label="Current Password"
              fullWidth
              value={passwords.currentPassword}
              onChange={(e) => setPasswords(prev => ({ ...prev, currentPassword: e.target.value }))}
            />
            <TextField
              type="password"
              label="New Password"
              fullWidth
              value={passwords.newPassword}
              onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
            />
            <TextField
              type="password"
              label="Confirm New Password"
              fullWidth
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePasswordDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleChangePassword} variant="contained" color="primary">
            Change Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteAccountDialogOpen} onClose={() => setDeleteAccountDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: theme.palette.error.main, fontWeight: 600 }}>Delete Account</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action will permanently delete your account and all associated data. This cannot be undone.
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, color: 'textSecondary' }}>
            Type <strong>DELETE</strong> to confirm:
          </DialogContentText>
          <TextField
            fullWidth
            placeholder="Type DELETE to confirm"
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAccountDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteAccount}
            variant="contained"
            color="error"
            disabled={deleteConfirmation !== 'DELETE'}
          >
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
