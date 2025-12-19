import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Box,
  CircularProgress,
  Alert,
  Typography
} from '@mui/material'
import { toast } from 'react-toastify'
import api from '../services/api'

interface CancellationReason {
  id: number
  reasonKey: string
  reasonText: string
  displayOrder: number
}

interface CancelOrderDialogProps {
  open: boolean
  orderId: number
  onClose: () => void
  onSuccess: () => void
}

export default function CancelOrderDialog({
  open,
  orderId,
  onClose,
  onSuccess
}: CancelOrderDialogProps) {
  const [reasons, setReasons] = useState<CancellationReason[]>([])
  const [selectedReasonId, setSelectedReasonId] = useState<number | null>(null)
  const [customMessage, setCustomMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingReasons, setFetchingReasons] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchCancellationReasons()
    }
  }, [open])

  const fetchCancellationReasons = async () => {
    try {
      setFetchingReasons(true)
      const response = await api.get('/cancellation-reasons')
      setReasons(response.data)
      if (response.data.length > 0) {
        setSelectedReasonId(response.data[0].id)
      }
      setError(null)
    } catch (error) {
      console.error('Error fetching cancellation reasons:', error)
      setError('Failed to load cancellation reasons')
      toast.error('Failed to load cancellation reasons')
    } finally {
      setFetchingReasons(false)
    }
  }

  const handleCancel = () => {
    setSelectedReasonId(null)
    setCustomMessage('')
    setError(null)
    onClose()
  }

  const handleSubmit = async () => {
    if (!selectedReasonId) {
      setError('Please select a cancellation reason')
      return
    }

    // If "Other" is selected, custom message is required
    const selectedReason = reasons.find(r => r.id === selectedReasonId)
    if (selectedReason?.reasonKey === 'OTHER' && !customMessage.trim()) {
      setError('Please provide a reason for cancellation')
      return
    }

    try {
      setLoading(true)
      setError(null)

      await api.post(`/orders/${orderId}/cancel`, {
        cancellationReasonId: selectedReasonId,
        customMessage: customMessage.trim() || null
      })

      toast.success('Order cancelled successfully')
      handleCancel()
      onSuccess()
    } catch (error: any) {
      console.error('Error cancelling order:', error)
      const errorMessage = error.response?.data?.message || 'Failed to cancel order'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const selectedReasonText = reasons.find(r => r.id === selectedReasonId)?.reasonText

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight="bold">
          Cancel Order
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please tell us why you want to cancel this order
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {fetchingReasons ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>
                Reason for Cancellation
              </FormLabel>
              <RadioGroup
                value={selectedReasonId}
                onChange={(e) => {
                  setSelectedReasonId(Number(e.target.value))
                  setCustomMessage('')
                }}
              >
                {reasons.map((reason) => (
                  <FormControlLabel
                    key={reason.id}
                    value={reason.id}
                    control={<Radio />}
                    label={reason.reasonText}
                  />
                ))}
              </RadioGroup>
            </FormControl>

            {/* Show custom message field if "Other" is selected */}
            {selectedReasonText?.includes('Other') && (
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Additional details (optional)"
                placeholder="Please explain your reason for cancellation..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                sx={{ mt: 3 }}
                variant="outlined"
              />
            )}

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Important:</strong> If your order has been paid, you will receive a refund to your original payment method within 2-3 business days.
              </Typography>
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleCancel} disabled={loading}>
          Keep Order
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="error"
          disabled={loading || !selectedReasonId || fetchingReasons}
        >
          {loading ? <CircularProgress size={24} /> : 'Cancel Order'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
