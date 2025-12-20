import { Box, CircularProgress, Typography } from '@mui/material'
import { keyframes } from '@emotion/react'
import styled from '@emotion/styled'

interface LoaderProps {
  size?: 'small' | 'medium' | 'large'
  fullScreen?: boolean
  text?: string
  variant?: 'circular' | 'spinner' | 'pulse'
}

const spinAnimation = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`

const pulseAnimation = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`

const shimmerAnimation = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`

const sizeMap = {
  small: 40,
  medium: 60,
  large: 80,
}

const StyledContainer = styled(Box)<{ fullScreen: boolean }>(({ fullScreen }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1rem',
  ...(fullScreen && {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(4px)',
    zIndex: 9999,
  }),
  ...(!fullScreen && {
    padding: '2rem',
    minHeight: '200px',
  }),
}))

const CircularLoaderContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',

  '& .outer-circle': {
    position: 'absolute',
    borderRadius: '50%',
    animation: `${spinAnimation} 2s linear infinite`,
    background: `conic-gradient(from 0deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
  },

  '& .middle-circle': {
    position: 'absolute',
    borderRadius: '50%',
    animation: `${spinAnimation} 3s linear infinite reverse`,
    background: `conic-gradient(from 0deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  },

  '& .inner-circle': {
    position: 'absolute',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: theme.palette.primary.main,
  },
}))

const SpinnerWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  '& .spinner': {
    animation: `${spinAnimation} 1.5s linear infinite`,
  },
}))

const PulseContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: '0.5rem',
  alignItems: 'center',
  justifyContent: 'center',

  '& .pulse-dot': {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    animation: `${pulseAnimation} 1.4s infinite`,

    '&:nth-of-type(2)': {
      animationDelay: '0.2s',
    },
    '&:nth-of-type(3)': {
      animationDelay: '0.4s',
    },
  },
}))

export const Loader: React.FC<LoaderProps> = ({
  size = 'medium',
  fullScreen = false,
  text = 'Loading...',
  variant = 'circular',
}) => {
  const loaderSize = sizeMap[size]

  return (
    <StyledContainer fullScreen={fullScreen}>
      {variant === 'circular' && (
        <CircularLoaderContainer sx={{ width: loaderSize, height: loaderSize }}>
          <Box
            className="outer-circle"
            sx={{
              width: '100%',
              height: '100%',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)',
            }}
          />
          <Box
            className="middle-circle"
            sx={{
              width: '70%',
              height: '70%',
            }}
          />
          <Box
            className="inner-circle"
            sx={{
              width: '50%',
              height: '50%',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              {size === 'small' ? '' : size === 'medium' ? '...' : 'Loading'}
            </Typography>
          </Box>
        </CircularLoaderContainer>
      )}

      {variant === 'spinner' && (
        <SpinnerWrapper>
          <CircularProgress
            className="spinner"
            size={loaderSize}
            sx={{
              color: 'primary.main',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }}
          />
        </SpinnerWrapper>
      )}

      {variant === 'pulse' && (
        <PulseContainer>
          <Box className="pulse-dot" />
          <Box className="pulse-dot" />
          <Box className="pulse-dot" />
        </PulseContainer>
      )}

      {text && (
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontWeight: 500,
            minHeight: '1.5rem',
          }}
        >
          {text}
        </Typography>
      )}
    </StyledContainer>
  )
}

// Simplified inline loader for use in smaller spaces
export const InlineLoader: React.FC<{ size?: 'small' | 'medium' }> = ({ size = 'small' }) => (
  <CircularProgress
    size={size === 'small' ? 24 : 40}
    sx={{
      color: 'primary.main',
    }}
  />
)

export default Loader
