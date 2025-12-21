import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  IconButton,
  alpha,
  useTheme,
} from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

interface ProductImageGalleryProps {
  images: Array<string | { url: string }>;
  productName: string;
  variationImageUrl?: string;
  mainImageHeight?: number;
  thumbnailSize?: number;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  images = [],
  productName,
  variationImageUrl,
  mainImageHeight = 450,
  thumbnailSize = 80,
}) => {
  const theme = useTheme();
  const [selectedImage, setSelectedImage] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [imageStates, setImageStates] = useState<Map<string, boolean>>(new Map());

  // Helper to extract image URL
  const getImageUrl = (image: string | { url: string }): string => {
    if (typeof image === 'string') return image;
    return image.url || '';
  };

  // Format image URLs with API base if needed
  const formatImageUrl = (url: string): string => {
    if (!url) return '';

    // If it's an external URL, use as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // If it starts with /, prepend API base
    if (url.startsWith('/')) {
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      return `${apiBase}${url}`;
    }

    // Otherwise prepend API base and /
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    return `${apiBase}/${url}`;
  };

  // Normalize images array
  const normalizedImages = useMemo(() => {
    return images.map(getImageUrl).map(formatImageUrl).filter(Boolean);
  }, [images]);

  // Use variation image if provided
  const displayImages = useMemo(() => {
    if (variationImageUrl) {
      return [formatImageUrl(variationImageUrl), ...normalizedImages];
    }
    return normalizedImages;
  }, [variationImageUrl, normalizedImages]);

  // Get current image with fallback
  const getCurrentImageUrl = (index: number): string => {
    if (index < 0 || index >= displayImages.length) return '';
    const url = displayImages[index];
    return failedImages.has(url)
      ? 'https://via.placeholder.com/500x500?text=Image+Not+Available'
      : url;
  };

  // Navigation handlers
  const handlePrevious = () => {
    setSelectedImage(prev =>
      prev === 0 ? displayImages.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setSelectedImage(prev =>
      prev === displayImages.length - 1 ? 0 : prev + 1
    );
  };

  // Thumbnail click handler
  const handleThumbnailClick = (index: number) => {
    setSelectedImage(index);
  };

  // Image error handler
  const handleImageError = (imageUrl: string) => {
    setFailedImages(prev => new Set([...prev, imageUrl]));
    setImageStates(prev => new Map(prev).set(imageUrl, true));
  };

  // Handle image load
  const handleImageLoad = (imageUrl: string) => {
    setImageStates(prev => new Map(prev).set(imageUrl, true));
  };

  if (displayImages.length === 0) {
    return (
      <Card
        sx={{
          mb: 2,
          overflow: 'hidden',
          borderRadius: 3,
          boxShadow: theme.shadows[10],
          bgcolor: '#f9f9f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: mainImageHeight,
        }}
      >
        <Box
          component="img"
          src="https://via.placeholder.com/500x500?text=No+Images"
          alt="No images available"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            padding: 2,
          }}
        />
      </Card>
    );
  }

  return (
    <Box>
      {/* Main Image Card - Modern Design */}
      <Card
        sx={{
          mb: 3,
          overflow: 'hidden',
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          bgcolor: '#fafafa',
          position: 'relative',
          aspectRatio: '1 / 1',
          maxWidth: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          component="img"
          src={getCurrentImageUrl(selectedImage)}
          alt={`${productName} - Image ${selectedImage + 1}`}
          onError={() => {
            const url = displayImages[selectedImage];
            if (url) handleImageError(url);
          }}
          onLoad={() => {
            const url = displayImages[selectedImage];
            if (url) handleImageLoad(url);
          }}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transition: 'opacity 0.3s ease-in-out',
            animation: 'fadeIn 0.3s ease-in-out',
            '@keyframes fadeIn': {
              from: { opacity: 0 },
              to: { opacity: 1 },
            },
          }}
        />

        {/* Invisible Navigation Arrows - Only visible on hover */}
        {displayImages.length > 1 && (
          <>
            {/* Left Arrow - Invisible until hover */}
            <IconButton
              onClick={handlePrevious}
              aria-label="Previous image"
              sx={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'transparent',
                border: 'none',
                padding: '12px',
                minWidth: 'auto',
                minHeight: 'auto',
                zIndex: 10,
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: alpha(theme.palette.common.white, 0.9),
                  boxShadow: theme.shadows[4],
                },
              }}
              size="large"
            >
              <ChevronLeft
                sx={{
                  fontSize: '2rem',
                  color: alpha(theme.palette.primary.main, 0),
                  transition: 'color 0.3s ease',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  }
                }}
              />
            </IconButton>

            {/* Right Arrow - Invisible until hover */}
            <IconButton
              onClick={handleNext}
              aria-label="Next image"
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'transparent',
                border: 'none',
                padding: '12px',
                minWidth: 'auto',
                minHeight: 'auto',
                zIndex: 10,
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: alpha(theme.palette.common.white, 0.9),
                  boxShadow: theme.shadows[4],
                },
              }}
              size="large"
            >
              <ChevronRight
                sx={{
                  fontSize: '2rem',
                  color: alpha(theme.palette.primary.main, 0),
                  transition: 'color 0.3s ease',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  }
                }}
              />
            </IconButton>
          </>
        )}
      </Card>

      {/* Thumbnail Row - Clean Minimalist Design */}
      {displayImages.length > 1 && (
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            justifyContent: 'center',
            alignItems: 'center',
            overflowX: 'auto',
            overflowY: 'hidden',
            pb: 1,
            scrollBehavior: 'smooth',
            '&::-webkit-scrollbar': {
              height: '4px',
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: alpha(theme.palette.primary.main, 0.3),
              borderRadius: '2px',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.5),
              },
            },
          }}
        >
          {displayImages.map((image, index) => (
            <Box
              key={`${image}-${index}`}
              onClick={() => handleThumbnailClick(index)}
              sx={{
                position: 'relative',
                flexShrink: 0,
                width: thumbnailSize,
                height: thumbnailSize,
                borderRadius: 1.5,
                overflow: 'hidden',
                cursor: 'pointer',
                bgcolor: '#f5f5f5',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                border: selectedImage === index
                  ? `2px solid ${theme.palette.primary.main}`
                  : `2px solid ${alpha(theme.palette.divider, 0.2)}`,
                boxShadow: selectedImage === index
                  ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                  : '0 2px 4px rgba(0, 0, 0, 0.05)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.15)}`,
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              <Box
                component="img"
                src={getCurrentImageUrl(index)}
                alt={`${productName} thumbnail ${index + 1}`}
                onError={() => handleImageError(image)}
                onLoad={() => handleImageLoad(image)}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: imageStates.get(image) ? 1 : 0.6,
                  transition: 'opacity 0.25s ease',
                }}
              />

              {/* Subtle Selection Ring */}
              {selectedImage === index && (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    pointerEvents: 'none',
                  }}
                />
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ProductImageGallery;
