import { useState, useEffect } from 'react'
import {
  Container,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Grid,
  Alert,
  alpha,
  useTheme,
  Divider
} from '@mui/material'
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material'
import { toast } from 'react-toastify'
import { Loader } from '../../components/Loader'

interface UserProfile {
  id: number
  email: string
  firstName: string
  lastName: string
  phone?: string
  createdAt?: string
}

export default function Profile() {
  const theme = useTheme()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  })

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}')
      setUser(userData as UserProfile)
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phone || ''
      })
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      if (!token || !user) {
        toast.error('Please login to update profile')
        return
      }

      // Update localStorage with new data
      const updatedUser = {
        ...user,
        firstName: formData.firstName,
        lastName: formData.lastName
      }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      setEditing(false)
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to update profile')
    }
  }

  const handleCancel = () => {
    setEditing(false)
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || ''
      })
    }
  }

  if (loading) {
    return <Loader fullScreen text="Loading profile..." />
  }

  if (!user) {
    return (
      <Container sx={{ py: 8 }}>
        <Alert severity="error">Failed to load profile. Please try again.</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          My Profile
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage your personal information
        </Typography>
      </Box>

      <Card sx={{ border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
        <CardContent>
          {/* Email Section (Read-only) */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'textSecondary' }}>
              Email Address
            </Typography>
            <TextField
              fullWidth
              type="email"
              value={user.email}
              disabled
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  cursor: 'not-allowed'
                },
                '& .MuiOutlinedInput-root.Mui-disabled': {
                  bgcolor: alpha(theme.palette.primary.main, 0.05)
                }
              }}
            />
            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'textSecondary' }}>
              Your email address cannot be changed
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Editable Information */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'textSecondary' }}>
                First Name
              </Typography>
              <TextField
                fullWidth
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={!editing}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'textSecondary' }}>
                Last Name
              </Typography>
              <TextField
                fullWidth
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={!editing}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'textSecondary' }}>
                Phone Number
              </Typography>
              <TextField
                fullWidth
                name="phone"
                value={formData.phone}
                disabled
                variant="outlined"
                placeholder="Enter phone number"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    cursor: 'not-allowed'
                  },
                  '& .MuiOutlinedInput-root.Mui-disabled': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05)
                  }
                }}
              />
              <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'textSecondary' }}>
                Your phone number cannot be changed
              </Typography>
            </Grid>
          </Grid>

          {/* Account Info */}
          <Box sx={{ mt: 4, p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 1 }}>
            <Typography variant="body2" sx={{ color: 'textSecondary' }}>
              <strong>Account created:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            {editing ? (
              <>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveProfile}
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                color="primary"
                startIcon={<EditIcon />}
                onClick={() => setEditing(true)}
              >
                Edit Profile
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Container>
  )
}
