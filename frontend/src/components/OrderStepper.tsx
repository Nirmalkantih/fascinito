import { Box, Step, StepLabel, Stepper, Typography, Paper, useTheme, alpha } from '@mui/material'
import {
  ShoppingCart,
  CheckCircle,
  Settings,
  LocalShipping,
  Done,
  Cancel,
  MoneyOff
} from '@mui/icons-material'

interface OrderStepperProps {
  status: string
  statusHistory?: Array<{
    id: number
    status: string
    notes?: string
    updatedBy?: string
    createdAtTimestamp: number
  }>
}

interface StepConfig {
  label: string
  value: string
  icon: React.ReactElement
  description: string
}

export default function OrderStepper({ status, statusHistory = [] }: OrderStepperProps) {
  const theme = useTheme()

  // Define the order flow steps
  const steps: StepConfig[] = [
    {
      label: 'Order Placed',
      value: 'PENDING',
      icon: <ShoppingCart />,
      description: 'Your order has been received'
    },
    {
      label: 'Confirmed',
      value: 'CONFIRMED',
      icon: <CheckCircle />,
      description: 'Order confirmed and being prepared'
    },
    {
      label: 'Processing',
      value: 'PROCESSING',
      icon: <Settings />,
      description: 'Your order is being processed'
    },
    {
      label: 'Shipped',
      value: 'SHIPPED',
      icon: <LocalShipping />,
      description: 'Order is on the way'
    },
    {
      label: 'Delivered',
      value: 'DELIVERED',
      icon: <Done />,
      description: 'Order delivered successfully'
    }
  ]

  // Handle cancelled and refunded orders
  const isCancelled = status === 'CANCELLED'
  const isRefunded = status === 'REFUNDED'

  // Find current step index
  const currentStepIndex = steps.findIndex(s => s.value === status)
  const activeStep = currentStepIndex >= 0 ? currentStepIndex : 0

  // If order is cancelled or refunded, show alternative view
  if (isCancelled || isRefunded) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.05)} 0%, ${alpha(theme.palette.error.main, 0.02)} 100%)`,
          border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
          borderRadius: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          {isCancelled ? (
            <Cancel sx={{ fontSize: 40, color: 'error.main' }} />
          ) : (
            <MoneyOff sx={{ fontSize: 40, color: 'warning.main' }} />
          )}
          <Box>
            <Typography variant="h6" color="error.main" fontWeight="bold">
              Order {isCancelled ? 'Cancelled' : 'Refunded'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isCancelled
                ? 'This order has been cancelled'
                : 'This order has been refunded'}
            </Typography>
          </Box>
        </Box>

        {statusHistory.length > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" mb={1}>
              Status History:
            </Typography>
            {statusHistory.map((history) => (
              <Box key={history.id} sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {new Date(history.createdAtTimestamp).toLocaleString()} - <strong>{history.status}</strong>
                  {history.notes && ` - ${history.notes}`}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    )
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        mb: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        borderRadius: 2
      }}
    >
      <Typography variant="h6" fontWeight="bold" mb={3} color="primary">
        Order Status Tracking
      </Typography>

      <Stepper
        activeStep={activeStep}
        alternativeLabel
        sx={{
          '& .MuiStepLabel-root .Mui-completed': {
            color: theme.palette.success.main
          },
          '& .MuiStepLabel-root .Mui-active': {
            color: theme.palette.primary.main
          },
          '& .MuiStepConnector-line': {
            borderTopWidth: 3
          }
        }}
      >
        {steps.map((step, index) => {
          const isCompleted = index < activeStep
          const isActive = index === activeStep
          
          return (
            <Step key={step.value} completed={isCompleted}>
              <StepLabel
                icon={
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isCompleted
                        ? theme.palette.success.main
                        : isActive
                        ? theme.palette.primary.main
                        : alpha(theme.palette.action.disabled, 0.1),
                      color: isCompleted || isActive ? 'white' : theme.palette.action.disabled,
                      transition: 'all 0.3s ease',
                      boxShadow: isActive ? `0 0 20px ${alpha(theme.palette.primary.main, 0.4)}` : 'none'
                    }}
                  >
                    {step.icon}
                  </Box>
                }
              >
                <Typography
                  variant="body2"
                  fontWeight={isActive ? 'bold' : 'medium'}
                  color={isCompleted ? 'success.main' : isActive ? 'primary' : 'text.secondary'}
                  sx={{ mt: 1 }}
                >
                  {step.label}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: { xs: 'none', sm: 'block' } }}
                >
                  {step.description}
                </Typography>
              </StepLabel>
            </Step>
          )
        })}
      </Stepper>

      {/* Status History Timeline */}
      {statusHistory.length > 0 && (
        <Box sx={{ mt: 4, pt: 3, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" mb={2}>
            Status History
          </Typography>
          <Box sx={{ pl: 2 }}>
            {statusHistory.map((history, index) => (
              <Box
                key={history.id}
                sx={{
                  position: 'relative',
                  pb: 2,
                  pl: 3,
                  '&::before': index < statusHistory.length - 1 ? {
                    content: '""',
                    position: 'absolute',
                    left: 5,
                    top: 12,
                    bottom: -8,
                    width: 2,
                    backgroundColor: alpha(theme.palette.primary.main, 0.2)
                  } : {}
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: 6,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.primary.main,
                    border: `2px solid ${theme.palette.background.paper}`,
                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
                  }}
                />
                <Typography variant="body2" fontWeight="medium">
                  {history.status}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(history.createdAtTimestamp).toLocaleString()}
                  {history.updatedBy && ` • Updated by ${history.updatedBy}`}
                </Typography>
                {history.notes && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    {history.notes}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  )
}
