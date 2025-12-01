import React, { useState, useEffect, useRef, memo } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { BrokenImage } from '@mui/icons-material';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  placeholderColor?: string;
}

const LazyImage: React.FC<LazyImageProps> = memo(({
  src,
  alt,
  width = '100%',
  height = '100%',
  style,
  className,
  objectFit = 'cover',
  placeholderColor = 'grey.100',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    // Check if IntersectionObserver is available (browser support)
    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '100px', // Start loading 100px before entering viewport
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <Box
      ref={imgRef}
      sx={{
        position: 'relative',
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: placeholderColor,
        overflow: 'hidden',
        ...style,
      }}
      className={className}
    >
      {!isLoaded && isInView && (
        <CircularProgress size={24} sx={{ position: 'absolute', zIndex: 1 }} />
      )}

      {hasError ? (
        <BrokenImage sx={{ color: 'grey.400', fontSize: 40 }} />
      ) : (
        isInView && (
          <img
            src={src}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            style={{
              width: '100%',
              height: '100%',
              objectFit,
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out',
            }}
            loading="lazy"
            decoding="async"
          />
        )
      )}
    </Box>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo - only re-render if src changes
  return prevProps.src === nextProps.src;
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;
