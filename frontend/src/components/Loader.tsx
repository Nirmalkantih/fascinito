import { Box, Typography } from '@mui/material'
import styled from '@emotion/styled'

interface LoaderProps {
  size?: 'small' | 'medium' | 'large'
  fullScreen?: boolean
  text?: string
}

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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(2px)',
    zIndex: 9999,
  }),
  ...(!fullScreen && {
    padding: '2rem',
    minHeight: '200px',
  }),
}))

const ProfessionalLoaderContainer = styled(Box)`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  & .loader-ring {
    position: absolute;
    border-radius: 50%;
    border-width: 3px;
    border-style: solid;
  }

  & .ring-1 {
    border-color: #6366f1 #e5e7eb #e5e7eb #e5e7eb;
  }

  & .ring-2 {
    border-color: #e5e7eb #ec4899 #e5e7eb #e5e7eb;
  }

  & .ring-3 {
    border-color: #e5e7eb #e5e7eb #6366f1 #e5e7eb;
  }

  & .center-dot {
    position: absolute;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #ec4899);
  }
`

export const Loader: React.FC<LoaderProps> = ({
  size = 'medium',
  fullScreen = false,
  text = 'Loading...',
}) => {
  const loaderSize = sizeMap[size]
  const ringGap = 6

  return (
    <StyledContainer fullScreen={fullScreen}>
      <ProfessionalLoaderContainer sx={{ width: loaderSize, height: loaderSize }}>
        {/* Outer ring */}
        <Box
          className="loader-ring ring-1"
          sx={{
            width: '100%',
            height: '100%',
          }}
        />
        {/* Middle ring */}
        <Box
          className="loader-ring ring-2"
          sx={{
            width: `calc(100% - ${ringGap * 2}px)`,
            height: `calc(100% - ${ringGap * 2}px)`,
            top: ringGap,
            left: ringGap,
          }}
        />
        {/* Inner ring */}
        <Box
          className="loader-ring ring-3"
          sx={{
            width: `calc(100% - ${ringGap * 4}px)`,
            height: `calc(100% - ${ringGap * 4}px)`,
            top: ringGap * 2,
            left: ringGap * 2,
          }}
        />
        {/* Center dot */}
        <Box
          className="center-dot"
          sx={{
            width: size === 'small' ? 8 : size === 'medium' ? 12 : 16,
            height: size === 'small' ? 8 : size === 'medium' ? 12 : 16,
            boxShadow: '0 0 10px rgba(99, 102, 241, 0.4)',
          }}
        />
      </ProfessionalLoaderContainer>

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
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size === 'small' ? 24 : 40,
      height: size === 'small' ? 24 : 40,
      position: 'relative',
    }}
  >
    <Box
      sx={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        border: '2px solid #e5e7eb',
        borderTop: '2px solid #6366f1',
        borderRight: '2px solid #ec4899',
      }}
    />
  </Box>
)

export default Loader
