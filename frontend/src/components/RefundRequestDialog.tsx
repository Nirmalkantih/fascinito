import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  CircularProgress,
  Alert,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material'
import { toast } from 'react-toastify'
import api from '../services/api'

interface RefundRequestDialogProps {
  open: boolean
  orderId: number
  onClose: () => void
  onSuccess: () => void
}

const REFUND_REASONS = [
  { value: 'DAMAGED', label: 'Product is damaged' },
  { value: 'DEFECTIVE', label: 'Product is defective' },
  { value: 'NOT_AS_DESCRIBED', label: 'Product not as described' },
  { value: 'NOT_NEEDED', label: 'No longer needed' },
  { value: 'BETTER_PRICE', label: 'Found better price' },
  { value: 'QUALITY_ISSUE', label: 'Quality issue' },
  { value: 'OTHER', label: 'Other reason' }
]

export default function RefundRequestDialog({
  open,
  orderId,
  onClose,
  onSuccess
}: RefundRequestDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>('DAMAGED')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    setSelectedReason('DAMAGED')
    setComment('')
    setError(null)
    onClose()
  }

  const handleSubmit = async () => {
    if (!selectedReason.trim()) {
      setError('Please select a refund reason')
      return
    }

    // If "Other" is selected, comment is required
    if (selectedReason === 'OTHER' && !comment.trim()) {
      setError('Please provide details for your refund request')
      return
    }

    try {
      setLoading(true)
      setError(null)

      await api.post(`/orders/${orderId}/request-refund`, {
        reason: selectedReason,
        comment: comment.trim() || null
      })

      toast.success('Refund request sent successfully')
      handleClose()
      onSuccess()
    } catch (error: any) {
      console.error('Error requesting refund:', error)
      const errorMessage = error.response?.data?.message || 'Failed to submit refund request'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const selectedReasonText = REFUND_REASONS.find(r => r.value === selectedReason)?.label

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight="bold">
          Request Refund
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please tell us why you want to request a refund
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box>
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>
              Refund Reason
            </FormLabel>
            <RadioGroup
              value={selectedReason}
              onChange={(e) => {
                setSelectedReason(e.target.value)
                setComment('')
              }}
            >
              {REFUND_REASONS.map((reason) => (
                <FormControlLabel
                  key={reason.value}
                  value={reason.value}
                  control={<Radio />}
                  label={reason.label}
                />
              ))}
            </RadioGroup>
          </FormControl>

          {/* Show comment field if "Other" is selected */}
          {selectedReasonText?.includes('Other') && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Additional details (required)"
              placeholder="Please explain your reason for requesting a refund..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              sx={{ mt: 3 }}
              variant="outlined"
            />
          )}

          {/* Show comment field optionally for other reasons */}
          {!selectedReasonText?.includes('Other') && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Additional details (optional)"
              placeholder="Any additional information to help us process your request..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              sx={{ mt: 3 }}
              variant="outlined"
            />
          )}

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Important:</strong> Once your refund request is submitted, our team will review it. If approved, the refund will be processed within 2-3 business days to your original payment method.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || !selectedReason}
        >
          {loading ? <CircularProgress size={24} /> : 'Submit Refund Request'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
