import { useState } from 'react'
import {
  Select,
  MenuItem,
  FormControl,
  Chip,
  Box,
  alpha,
  useTheme,
  CircularProgress
} from '@mui/material'
import { toast } from 'react-toastify'
import api from '../services/api'

interface OrderStatusDropdownProps {
  orderId: number
  currentStatus: string
  onStatusUpdate?: (newStatus: string) => void
  size?: 'small' | 'medium'
}

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending', color: 'warning' },
  { value: 'CONFIRMED', label: 'Confirmed', color: 'info' },
  { value: 'PROCESSING', label: 'Processing', color: 'info' },
  { value: 'SHIPPED', label: 'Shipped', color: 'primary' },
  { value: 'DELIVERED', label: 'Delivered', color: 'success' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'error' },
  { value: 'REFUNDED', label: 'Refunded', color: 'error' }
] as const

type StatusColor = 'success' | 'info' | 'warning' | 'error' | 'primary'

export default function OrderStatusDropdown({
  orderId,
  currentStatus,
  onStatusUpdate,
  size = 'small'
}: OrderStatusDropdownProps) {
  const theme = useTheme()
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return

    setLoading(true)
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus })
      setStatus(newStatus)
      toast.success(`Order status updated to ${newStatus}`)
      
      if (onStatusUpdate) {
        onStatusUpdate(newStatus)
      }
    } catch (error: any) {
      console.error('Error updating order status:', error)
      toast.error(error.response?.data?.message || 'Failed to update order status')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (statusValue: string): StatusColor => {
    const statusOption = STATUS_OPTIONS.find(opt => opt.value === statusValue)
    return (statusOption?.color as StatusColor) || 'default'
  }

  const currentStatusLabel = STATUS_OPTIONS.find(opt => opt.value === status)?.label || status

  return (
    <FormControl size={size} sx={{ minWidth: 150 }}>
      <Select
        value={status}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={loading}
        renderValue={(value) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {loading && <CircularProgress size={16} />}
            <Chip
              label={currentStatusLabel}
              color={getStatusColor(value)}
              size="small"
              sx={{
                fontWeight: 'medium',
                fontSize: size === 'small' ? '0.75rem' : '0.875rem',
                height: size === 'small' ? 24 : 28
              }}
            />
          </Box>
        )}
        sx={{
          '& .MuiSelect-select': {
            py: size === 'small' ? 0.75 : 1,
            display: 'flex',
            alignItems: 'center'
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(theme.palette.divider, 0.5)
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main
          }
        }}
      >
        {STATUS_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            disabled={option.value === status}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <Chip
                label={option.label}
                color={option.color}
                size="small"
                sx={{ fontWeight: 'medium' }}
              />
              {option.value === status && (
                <Box
                  sx={{
                    ml: 'auto',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: theme.palette.primary.main
                  }}
                />
              )}
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
