import { useState } from 'react'
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

interface RefundDialogProps {
  open: boolean
  orderId: number
  paidAmount: number
  onClose: () => void
  onSuccess: () => void
}

export default function RefundDialog({
  open,
  orderId,
  paidAmount,
  onClose,
  onSuccess
}: RefundDialogProps) {
  const [refundType, setRefundType] = useState<'FULL' | 'PARTIAL'>('FULL')
  const [refundAmount, setRefundAmount] = useState<string>(paidAmount.toFixed(2))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    setRefundType('FULL')
    setRefundAmount(paidAmount.toFixed(2))
    setError(null)
    onClose()
  }

  const handleRefundTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const type = e.target.value as 'FULL' | 'PARTIAL'
    setRefundType(type)
    if (type === 'FULL') {
      setRefundAmount(paidAmount.toFixed(2))
    }
  }

  const validateRefundAmount = (): boolean => {
    if (refundType === 'FULL') return true

    const amount = parseFloat(refundAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Refund amount must be greater than 0')
      return false
    }

    if (amount > paidAmount) {
      setError(`Refund amount cannot exceed paid amount (${paidAmount.toFixed(2)})`)
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateRefundAmount()) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      const amount = refundType === 'FULL' ? paidAmount : parseFloat(refundAmount)

      await api.post(`/orders/${orderId}/refund`, {
        refundType: refundType,
        refundAmount: amount
      })

      toast.success('Refund initiated successfully')
      handleClose()
      onSuccess()
    } catch (error: any) {
      console.error('Error initiating refund:', error)
      const errorMessage = error.response?.data?.message || 'Failed to initiate refund'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight="bold">
          Process Refund
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Paid Amount: ${paidAmount.toFixed(2)}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box>
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>
              Refund Type
            </FormLabel>
            <RadioGroup
              value={refundType}
              onChange={handleRefundTypeChange}
            >
              <FormControlLabel
                value="FULL"
                control={<Radio />}
                label={`Full Refund - $${paidAmount.toFixed(2)}`}
              />
              <FormControlLabel
                value="PARTIAL"
                control={<Radio />}
                label="Partial Refund"
              />
            </RadioGroup>
          </FormControl>

          {/* Show amount field if partial refund is selected */}
          {refundType === 'PARTIAL' && (
            <TextField
              fullWidth
              type="number"
              label="Refund Amount"
              placeholder="Enter refund amount"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              inputProps={{
                step: '0.01',
                min: '0',
                max: paidAmount.toFixed(2)
              }}
              sx={{ mt: 3 }}
              variant="outlined"
              helperText={`Max: $${paidAmount.toFixed(2)}`}
            />
          )}

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Processing Time:</strong> Refunds typically take 2-3 business days to appear in the customer's account. The system will monitor the refund status automatically.
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
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : `Process ${refundType === 'FULL' ? 'Full' : 'Partial'} Refund`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
