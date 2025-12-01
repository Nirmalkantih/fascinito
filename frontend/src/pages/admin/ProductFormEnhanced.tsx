import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  MenuItem,
  IconButton,
  InputAdornment,
  Card,
  CardContent,
  alpha,
  useTheme,
  Avatar,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Add,
  Delete,
  ArrowBack,
  Image as ImageIcon,
  AttachMoney,
  Inventory,
  Category as CategoryIcon,
  Store,
  Save,
  Cancel,
  Warning,
} from '@mui/icons-material';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Helper function to construct proper image URL
const getImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return ''

  // If it's an external URL (starts with http/https), use as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  // If it's a relative path (starts with /), prepend API base URL
  if (imageUrl.startsWith('/')) {
    return `${API_BASE_URL}${imageUrl}`
  }

  // Otherwise assume it's an API path
  return `${API_BASE_URL}/${imageUrl}`
}

interface VariationOption {
  id?: number;
  name: string;  // e.g., "Red", "Small", "XL"
  priceAdjustment?: number;
  stockQuantity?: number;
  sku?: string;
  imageUrl?: string;
  active?: boolean;
}

interface ProductVariation {
  id?: number;
  type: string;  // e.g., "Color", "Size", "Material"
  active?: boolean;
  options?: VariationOption[];  // Specific choices for this variation type
}

interface ProductFormData {
  title: string;
  slug: string;
  description: string;
  sku: string;
  upc: string;
  categoryId: number | null;
  subCategoryId: number | null;
  vendorId: number | null;
  locationId: number | null;
  regularPrice: number;
  salePrice: number | null;
  costPerItem: number | null;
  taxRate: number;
  taxExempt: boolean;
  visibleToCustomers: boolean;
  trackInventory: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  active: boolean;
  featured: boolean;
  imageUrls: string[];
  variations: ProductVariation[];
}

export default function ProductFormEnhanced() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    slug: '',
    description: '',
    sku: '',
    upc: '',
    categoryId: null,
    subCategoryId: null,
    vendorId: null,
    locationId: null,
    regularPrice: 0,
    salePrice: null,
    costPerItem: null,
    taxRate: 0,
    taxExempt: false,
    visibleToCustomers: true,
    trackInventory: false,
    stockQuantity: 0,
    lowStockThreshold: 5,
    active: true,
    featured: false,
    imageUrls: [],
    variations: [],
  });
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    fetchDropdownData();
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchDropdownData = async () => {
    try {
      console.log('📡 Fetching dropdown data...');
      
      // Fetch all data in parallel
      const [categoriesRes, vendorsRes, locationsRes] = await Promise.all([
        api.get('/categories', { params: { page: 0, size: 100 } }),
        api.get('/vendors', { params: { page: 0, size: 100 } }),
        api.get('/locations', { params: { page: 0, size: 100 } })
      ]);
      
      console.log('📦 Raw API Responses:', {
        categories: categoriesRes,
        vendors: vendorsRes,
        locations: locationsRes
      });
      
      // The api interceptor already extracts response.data, so the result IS the data
      // Check if it's a paginated response (has 'content' property) or direct array
      const categoriesData = Array.isArray(categoriesRes) 
        ? categoriesRes 
        : ((categoriesRes as any)?.content || []);
      
      const vendorsData = Array.isArray(vendorsRes) 
        ? vendorsRes 
        : ((vendorsRes as any)?.content || []);
      
      const locationsData = Array.isArray(locationsRes) 
        ? locationsRes 
        : ((locationsRes as any)?.content || []);
      
      console.log('✅ Extracted Data:', {
        categories: categoriesData.length,
        vendors: vendorsData.length,
        locations: locationsData.length
      });
      
      setCategories(categoriesData);
      setVendors(vendorsData);
      setLocations(locationsData);
      
      if (categoriesData.length > 0) {
        console.log('📋 Sample Category:', categoriesData[0]);
      }
      if (vendorsData.length > 0) {
        console.log('🏪 Sample Vendor:', vendorsData[0]);
      }
      if (locationsData.length > 0) {
        console.log('📍 Sample Location:', locationsData[0]);
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching dropdown data:', error);
      console.error('Error details:', error.response?.data);
      showError('Failed to load form data: ' + (error.response?.data?.message || error.message));
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/products/${id}`);
      const product = response.data.data || response.data;

      // Process variation images to ensure they have absolute URLs
      const processedVariations = (product.variations || []).map((variation: any) => {
        // Process imageUrl - each variation option now has only a single imageUrl
        const processedImageUrl = variation.imageUrl && !variation.imageUrl.startsWith('http')
          ? `${API_BASE_URL}${variation.imageUrl}`
          : variation.imageUrl;

        return {
          ...variation,
          imageUrl: processedImageUrl
        };
      });

      setFormData({
        title: product.title || '',
        slug: product.slug || '',
        description: product.description || '',
        sku: product.sku || '',
        upc: product.upc || '',
        categoryId: product.category?.id || product.categoryId || null,
        subCategoryId: product.subCategoryId || null,
        vendorId: product.vendor?.id || product.vendorId || null,
        locationId: product.location?.id || product.locationId || null,
        regularPrice: product.regularPrice || 0,
        salePrice: product.salePrice || null,
        costPerItem: product.costPerItem || null,
        taxRate: product.taxRate || 0,
        taxExempt: product.taxExempt || false,
        visibleToCustomers: product.visibleToCustomers ?? true,
        trackInventory: product.trackInventory || false,
        stockQuantity: product.stockQuantity || 0,
        lowStockThreshold: product.lowStockThreshold || 5,
        active: product.active ?? true,
        featured: product.featured || false,
        imageUrls: product.images?.map((img: any) => img.url) || [],
        variations: processedVariations,
      });
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to fetch product');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Auto-generate slug from title
    if (field === 'title' && !id) {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        imageUrls: [...prev.imageUrls, newImageUrl.trim()],
      }));
      setNewImageUrl('');
    }
  };

  const handleImageFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        if (!file.type.startsWith('image/')) {
          showError(`File ${file.name} is not an image`);
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          showError(`File ${file.name} is too large (max 5MB)`);
          continue;
        }

        const formDataWithFile = new FormData();
        formDataWithFile.append('file', file);

        try {
          // Use api interceptor which automatically adds Authorization header with accessToken
          const response = await api.post('/products/upload-image', formDataWithFile, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          // API interceptor extracts response.data automatically, so response is the ApiResponse object
          // Structure: { success: true, message: "...", data: { url: "...", filename: "..." }, timestamp: "..." }
          const uploadResponse = response as any;
          uploadedUrls.push(uploadResponse.data?.url || uploadResponse?.url);
          showSuccess(`Image ${file.name} uploaded successfully`);
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
          showError(`Failed to upload ${file.name}: ${errorMessage}`);
          console.error(`Upload failed for ${file.name}:`, error.response?.data || error);
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          imageUrls: [...prev.imageUrls, ...uploadedUrls],
        }));
      }

      // Reset file input
      event.target.value = '';
    } catch (error: any) {
      console.error('Error uploading images:', error);
      showError('Failed to upload images');
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  };

  const handleVariationOptionImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    variationIndex: number,
    optionIndex: number
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0]; // Only accept one image per option

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showError(`File ${file.name} is not an image`);
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError(`File ${file.name} is too large (max 5MB)`);
        return;
      }

      const formDataWithFile = new FormData();
      formDataWithFile.append('file', file);

      try {
        const response = await api.post('/products/upload-image', formDataWithFile, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const uploadResponse = response as any;
        const imageUrl = uploadResponse.data?.url || uploadResponse?.url;

        if (imageUrl) {
          // Update the specific variation option with the image URL
          handleVariationOptionChange(variationIndex, optionIndex, 'imageUrl', imageUrl);
          showSuccess(`Image uploaded successfully`);
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
        showError(`Failed to upload image: ${errorMessage}`);
        console.error(`Upload failed:`, error.response?.data || error);
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      showError('Failed to upload image');
    } finally {
      // Reset file input
      event.target.value = '';
    }
  };

  const handleAddVariation = () => {
    setFormData(prev => ({
      ...prev,
      variations: [
        ...prev.variations,
        { type: '', active: true, options: [] },
      ],
    }));
  };

  const handleRemoveVariation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.filter((_, i) => i !== index),
    }));
  };

  const handleVariationChange = (index: number, field: keyof ProductVariation, value: any) => {
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.map((v, i) =>
        i === index ? { ...v, [field]: value } : v
      ),
    }));
  };

  // handleAddAdditionalVariationImage removed - replaced by handleUploadVariationImage

  // const handleRemoveVariationImage is no longer needed as each VariationOption has only one imageUrl
  // This function is kept for reference but not used in the new architecture

  const handleAddVariationOption = (variationIndex: number) => {
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.map((v, idx) => {
        if (idx === variationIndex) {
          const options = v.options ? [...v.options] : [];
          options.push({ name: '', priceAdjustment: 0, stockQuantity: 0, sku: '', imageUrl: '', active: true });
          return { ...v, options };
        }
        return v;
      })
    }));
  };

  const handleRemoveVariationOption = (variationIndex: number, optionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.map((v, idx) => {
        if (idx === variationIndex) {
          const options = v.options ? [...v.options] : [];
          options.splice(optionIndex, 1);
          return { ...v, options };
        }
        return v;
      })
    }));
  };

  const handleVariationOptionChange = (variationIndex: number, optionIndex: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.map((v, idx) => {
        if (idx === variationIndex) {
          const options = v.options ? [...v.options] : [];
          if (options[optionIndex]) {
            options[optionIndex] = { ...options[optionIndex], [field]: value };
          }
          return { ...v, options };
        }
        return v;
      })
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (!formData.title || !formData.sku) {
        showError('Please fill in Product Title and SKU');
        return;
      }

      // Validate prices
      if (formData.regularPrice <= 0) {
        showError('Regular Price must be greater than 0');
        return;
      }

      if (formData.salePrice !== null && formData.salePrice < 0) {
        showError('Sale Price cannot be negative');
        return;
      }

      if (formData.salePrice !== null && formData.salePrice >= formData.regularPrice) {
        showError('Sale Price must be less than Regular Price');
        return;
      }

      if (formData.costPerItem !== null && formData.costPerItem < 0) {
        showError('Cost Per Item cannot be negative');
        return;
      }

      // Validate mandatory Organization fields
      if (!formData.categoryId) {
        showError('Please select a Category');
        return;
      }
      if (!formData.vendorId) {
        showError('Please select a Vendor');
        return;
      }
      if (!formData.locationId) {
        showError('Please select a Location');
        return;
      }

      const payload = {
        ...formData,
        salePrice: formData.salePrice || null,
        costPerItem: formData.costPerItem || null,
        // Variations with new architecture - each option has a single imageUrl
        variations: formData.variations.map(v => ({
          ...v
        }))
      };

      if (id) {
        await api.put(`/products/${id}`, payload);
        showSuccess('Product updated successfully');
      } else {
        await api.post('/products', payload);
        showSuccess('Product created successfully');
      }
      navigate('/admin/products');
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;
    
    try {
      await api.delete(`/products/${id}`);
      showSuccess('Product deleted successfully');
      navigate('/admin/products');
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <IconButton 
            onClick={() => navigate('/admin/products')}
            sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
            }}
          >
            <ArrowBack />
          </IconButton>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            {id ? 'Edit Product' : 'Create New Product'}
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          {id ? 'Update product information and inventory' : 'Add a new product to your catalog'}
        </Typography>
      </Box>

      {/* Warning if dropdowns are empty */}
      {(categories.length === 0 || vendors.length === 0 || locations.length === 0) && (
        <Alert 
          severity="warning" 
          sx={{ 
            mb: 3,
            '& .MuiAlert-message': { fontWeight: 600 }
          }}
        >
          <strong>Setup Required:</strong> Please create the following before adding products:
          {categories.length === 0 && ' Categories'}
          {vendors.length === 0 && ' • Vendors'}
          {locations.length === 0 && ' • Locations'}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} lg={8}>
          {/* Basic Information */}
          <Card sx={{ 
            mb: 3,
            borderRadius: 3, 
            boxShadow: theme.shadows[4],
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  width: 48,
                  height: 48
                }}>
                  <Inventory sx={{ color: 'white' }} />
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Basic Information
                </Typography>
              </Box>
              
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Product Title"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Enter product name"
                    error={!formData.title}
                    helperText={!formData.title ? 'Required field' : ''}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="SKU"
                    value={formData.sku}
                    onChange={(e) => handleChange('sku', e.target.value)}
                    placeholder="Stock Keeping Unit"
                    error={!formData.sku}
                    helperText={!formData.sku ? 'Required field' : ''}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="UPC"
                    value={formData.upc}
                    onChange={(e) => handleChange('upc', e.target.value)}
                    placeholder="Universal Product Code"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Product Slug"
                    value={formData.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
                    placeholder="product-url-slug"
                    helperText="URL-friendly version of the product name"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Detailed product description"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card sx={{ 
            mb: 3,
            borderRadius: 3, 
            boxShadow: theme.shadows[4],
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ 
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  width: 48,
                  height: 48
                }}>
                  <AttachMoney sx={{ color: 'white' }} />
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Pricing & Tax
                </Typography>
              </Box>
              
              <Grid container spacing={2.5}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    required
                    type="number"
                    label="Regular Price"
                    value={formData.regularPrice}
                    onChange={(e) => handleChange('regularPrice', parseFloat(e.target.value) || 0)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                    error={formData.regularPrice <= 0}
                    helperText={formData.regularPrice <= 0 ? 'Must be greater than 0' : ''}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Sale Price"
                    value={formData.salePrice || ''}
                    onChange={(e) => handleChange('salePrice', e.target.value ? parseFloat(e.target.value) : null)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                    error={formData.salePrice !== null && (formData.salePrice < 0 || formData.salePrice >= formData.regularPrice)}
                    helperText={
                      formData.salePrice !== null && formData.salePrice < 0
                        ? 'Cannot be negative'
                        : formData.salePrice !== null && formData.salePrice >= formData.regularPrice
                        ? 'Must be less than Regular Price'
                        : 'Optional - leave empty if no discount'
                    }
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Cost Per Item"
                    value={formData.costPerItem || ''}
                    onChange={(e) => handleChange('costPerItem', e.target.value ? parseFloat(e.target.value) : null)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                    error={formData.costPerItem !== null && formData.costPerItem < 0}
                    helperText={formData.costPerItem !== null && formData.costPerItem < 0 ? 'Cannot be negative' : 'Your cost'}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Tax Rate (%)"
                    value={formData.taxRate}
                    onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.taxExempt}
                        onChange={(e) => handleChange('taxExempt', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Tax Exempt"
                    sx={{ mt: 2 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Product Images */}
          <Card sx={{ 
            mb: 3,
            borderRadius: 3, 
            boxShadow: theme.shadows[4],
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ 
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  width: 48,
                  height: 48
                }}>
                  <ImageIcon sx={{ color: 'white' }} />
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Product Images
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Box sx={{ flex: 1, display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Image URL"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddImage}
                    startIcon={<Add />}
                    sx={{
                      minWidth: 120,
                      whiteSpace: 'nowrap',
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    }}
                  >
                    Add URL
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<ImageIcon />}
                    sx={{ minWidth: 150 }}
                  >
                    Upload Files
                    <input
                      hidden
                      accept="image/*"
                      multiple
                      type="file"
                      onChange={handleImageFileUpload}
                    />
                  </Button>
                  <Typography variant="caption" color="textSecondary">
                    Max 5MB per file
                  </Typography>
                </Box>
              </Box>

              <Stack spacing={2}>
                {formData.imageUrls.length > 0 && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                    {formData.imageUrls.map((url, index) => (
                      <Box
                        key={index}
                        sx={{
                          position: 'relative',
                          border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                          borderRadius: 2,
                          overflow: 'hidden',
                          aspectRatio: '1',
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                        }}
                      >
                        <img
                          src={getImageUrl(url)}
                          alt={`Product image ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveImage(index)}
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            bgcolor: 'white',
                            '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) },
                          }}
                        >
                          <Delete />
                        </IconButton>
                        <Typography
                          variant="caption"
                          sx={{
                            position: 'absolute',
                            bottom: 4,
                            left: 4,
                            bgcolor: alpha(theme.palette.common.black, 0.6),
                            color: 'white',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                          }}
                        >
                          #{index + 1}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
                {formData.imageUrls.length > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Image URLs ({formData.imageUrls.length}):
                    </Typography>
                    {formData.imageUrls.map((url, index) => (
                      <Box
                        key={`url-${index}`}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: 1.5,
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                          borderRadius: 1,
                          fontSize: '0.85rem',
                          wordBreak: 'break-all',
                        }}
                      >
                        <ImageIcon color="primary" fontSize="small" />
                        <Typography sx={{ flex: 1, fontSize: '0.85rem' }}>
                          {url}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
                {formData.imageUrls.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                    No images added yet. Upload or add image URLs above.
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Product Variations */}
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: theme.shadows[4],
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ 
                    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    width: 48,
                    height: 48
                  }}>
                    <Inventory sx={{ color: 'white' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      Product Variations
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Add sizes, colors, or other variants
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddVariation}
                  sx={{
                    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    fontWeight: 600
                  }}
                >
                  Add Variation
                </Button>
              </Box>

              {formData.variations.length > 0 ? (
                <Stack spacing={2} sx={{ mt: 3 }}>
                  {formData.variations.map((variation, index) => (
                    <Card key={index} sx={{ border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}` }}>
                      <CardContent sx={{ p: 2 }}>
                        <Stack direction="row" spacing={2} alignItems="flex-start" justifyContent="space-between">
                          {/* Variation Type */}
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                              Variation Type
                            </Typography>
                            <TextField
                              size="small"
                              fullWidth
                              value={variation.type || ''}
                              onChange={(e) => handleVariationChange(index, 'type', e.target.value)}
                              placeholder="e.g., Color, Size, Material"
                              error={!variation.type}
                            />
                          </Box>

                          {/* Options Count */}
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                              Options
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                              {variation.options?.length || 0}
                            </Typography>
                          </Box>

                          {/* Delete Button */}
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveVariation(index)}
                            title="Delete variation"
                          >
                            <Delete />
                          </IconButton>
                        </Stack>

                        {/* Options Section */}
                        <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.15)}` }}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              Options
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Add />}
                              onClick={() => handleAddVariationOption(index)}
                            >
                              Add Option
                            </Button>
                          </Stack>

                          {variation.options && variation.options.length > 0 ? (
                            <Stack spacing={1.5}>
                              {variation.options.map((option, optionIndex) => (
                                <Box
                                  key={optionIndex}
                                  sx={{
                                    p: 1.5,
                                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                                    borderRadius: 1,
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                                  }}
                                >
                                  <Stack spacing={1.5}>
                                    <Stack direction="row" spacing={1.5}>
                                      <TextField
                                        label="Name"
                                        size="small"
                                        fullWidth
                                        value={option.name || ''}
                                        onChange={(e) => handleVariationOptionChange(index, optionIndex, 'name', e.target.value)}
                                        placeholder="e.g., Red, Small, XL"
                                      />
                                      <TextField
                                        label="SKU"
                                        size="small"
                                        fullWidth
                                        value={option.sku || ''}
                                        onChange={(e) => handleVariationOptionChange(index, optionIndex, 'sku', e.target.value)}
                                        placeholder="Unique SKU"
                                      />
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleRemoveVariationOption(index, optionIndex)}
                                        title="Delete option"
                                      >
                                        <Delete />
                                      </IconButton>
                                    </Stack>
                                    <Stack direction="row" spacing={1.5}>
                                      <TextField
                                        label="Price Adjustment (₹)"
                                        type="number"
                                        size="small"
                                        fullWidth
                                        value={option.priceAdjustment || 0}
                                        onChange={(e) => handleVariationOptionChange(index, optionIndex, 'priceAdjustment', parseFloat(e.target.value) || 0)}
                                      />
                                      <TextField
                                        label="Stock Quantity"
                                        type="number"
                                        size="small"
                                        fullWidth
                                        value={option.stockQuantity || 0}
                                        onChange={(e) => handleVariationOptionChange(index, optionIndex, 'stockQuantity', parseInt(e.target.value) || 0)}
                                      />
                                    </Stack>
                                    {/* Image Upload Section */}
                                    <Box>
                                      <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                        {/* Image Preview */}
                                        {option.imageUrl && (
                                          <Box
                                            sx={{
                                              position: 'relative',
                                              width: 100,
                                              height: 100,
                                              borderRadius: 1,
                                              overflow: 'hidden',
                                              bgcolor: '#f5f5f5',
                                              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                                            }}
                                          >
                                            <Box
                                              component="img"
                                              src={getImageUrl(option.imageUrl)}
                                              alt={option.name}
                                              sx={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                              }}
                                            />
                                            <IconButton
                                              size="small"
                                              sx={{
                                                position: 'absolute',
                                                top: 0,
                                                right: 0,
                                                bgcolor: 'rgba(0,0,0,0.5)',
                                                color: 'white',
                                                '&:hover': {
                                                  bgcolor: 'rgba(0,0,0,0.7)'
                                                }
                                              }}
                                              onClick={() => handleVariationOptionChange(index, optionIndex, 'imageUrl', '')}
                                            >
                                              <Delete />
                                            </IconButton>
                                          </Box>
                                        )}

                                        {/* Upload Button and Hidden Input */}
                                        <Stack spacing={1} sx={{ flex: 1 }}>
                                          <input
                                            id={`variation-image-upload-${index}-${optionIndex}`}
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleVariationOptionImageUpload(e, index, optionIndex)}
                                          />
                                          <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<ImageIcon />}
                                            onClick={() => document.getElementById(`variation-image-upload-${index}-${optionIndex}`)?.click()}
                                            fullWidth
                                          >
                                            Upload Image
                                          </Button>
                                          {option.imageUrl && (
                                            <Typography variant="caption" sx={{ color: 'text.secondary', wordBreak: 'break-all' }}>
                                              {option.imageUrl.split('/').pop() || 'Image uploaded'}
                                            </Typography>
                                          )}
                                        </Stack>
                                      </Stack>
                                    </Box>
                                  </Stack>
                                </Box>
                              ))}
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                              No options added. Click "Add Option" to create choices.
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Box sx={{
                  textAlign: 'center',
                  py: 4,
                  bgcolor: alpha(theme.palette.primary.main, 0.02),
                  borderRadius: 2,
                  border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}`
                }}>
                  <Typography variant="body2" color="text.secondary">
                    No variations added. Click "Add Variation" to create product variants.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          {/* Organization - MANDATORY */}
          <Card sx={{ 
            mb: 3,
            borderRadius: 3, 
            boxShadow: theme.shadows[4],
            border: `2px solid ${!formData.categoryId || !formData.vendorId || !formData.locationId ? theme.palette.error.main : alpha(theme.palette.primary.main, 0.1)}`
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Avatar sx={{ 
                    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                    width: 40,
                    height: 40
                  }}>
                    <CategoryIcon sx={{ color: 'white' }} />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Organization *
                  </Typography>
                </Box>
                <Typography variant="caption" color="error" sx={{ fontWeight: 600, display: 'block', ml: 7 }}>
                  All fields required
                </Typography>
              </Box>

              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  select
                  required
                  label="Category"
                  value={formData.categoryId || ''}
                  onChange={(e) => handleChange('categoryId', e.target.value ? parseInt(e.target.value) : null)}
                  error={!formData.categoryId}
                  helperText={!formData.categoryId ? 'Required field' : `${categories.length} categories available`}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  fullWidth
                  select
                  required
                  label="Vendor"
                  value={formData.vendorId || ''}
                  onChange={(e) => handleChange('vendorId', e.target.value ? parseInt(e.target.value) : null)}
                  error={!formData.vendorId}
                  helperText={!formData.vendorId ? 'Required field' : `${vendors.length} vendors available`}
                >
                  {vendors.map((vendor) => (
                    <MenuItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  fullWidth
                  select
                  required
                  label="Location"
                  value={formData.locationId || ''}
                  onChange={(e) => handleChange('locationId', e.target.value ? parseInt(e.target.value) : null)}
                  error={!formData.locationId}
                  helperText={!formData.locationId ? 'Required field' : `${locations.length} locations available`}
                >
                  {locations.map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card sx={{ 
            mb: 3,
            borderRadius: 3, 
            boxShadow: theme.shadows[4],
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  width: 40,
                  height: 40
                }}>
                  <Store sx={{ color: 'white' }} />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Inventory
                </Typography>
              </Box>

              <Stack spacing={2.5}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.trackInventory}
                      onChange={(e) => handleChange('trackInventory', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Track Inventory"
                />

                {formData.trackInventory && (
                  <>
                    <TextField
                      fullWidth
                      type="number"
                      label="Stock Quantity"
                      value={formData.stockQuantity}
                      onChange={(e) => handleChange('stockQuantity', parseInt(e.target.value) || 0)}
                    />

                    <TextField
                      fullWidth
                      type="number"
                      label="Low Stock Threshold"
                      value={formData.lowStockThreshold}
                      onChange={(e) => handleChange('lowStockThreshold', parseInt(e.target.value) || 0)}
                      helperText="Alert when stock falls below"
                    />
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Status */}
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: theme.shadows[4],
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Status & Visibility
              </Typography>

              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.active}
                      onChange={(e) => handleChange('active', e.target.checked)}
                      color="success"
                    />
                  }
                  label="Active"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.featured}
                      onChange={(e) => handleChange('featured', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Featured Product"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.visibleToCustomers}
                      onChange={(e) => handleChange('visibleToCustomers', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Visible to Customers"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          {id && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={handleDeleteClick}
              sx={{
                px: 3,
                py: 1.5,
                fontWeight: 600,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                }
              }}
            >
              Delete Product
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Cancel />}
            onClick={() => navigate('/admin/products')}
            sx={{
              px: 4,
              py: 1.5,
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSubmit}
            disabled={loading}
            sx={{
              px: 4,
              py: 1.5,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              fontWeight: 600,
              boxShadow: theme.shadows[8],
              '&:hover': {
                boxShadow: theme.shadows[12],
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            {loading ? 'Saving...' : id ? 'Update Product' : 'Create Product'}
          </Button>
        </Box>
      </Box>

      {/* Enhanced Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: theme.shadows[20]
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          py: 3
        }}>
          <Avatar sx={{ bgcolor: alpha('#ffffff', 0.2), width: 56, height: 56 }}>
            <Warning sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Confirm Deletion
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              This action cannot be undone
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <DialogContentText sx={{ fontSize: '1.1rem', color: 'text.primary' }}>
            Are you sure you want to delete <strong>"{formData.title}"</strong>?
          </DialogContentText>
          <Alert severity="warning" sx={{ mt: 2, fontWeight: 600 }}>
            <strong>Warning:</strong> This will permanently remove the product from your inventory, including all associated data and cannot be recovered.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
            startIcon={<Cancel />}
            sx={{ 
              px: 3,
              py: 1,
              fontWeight: 600
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            startIcon={<Delete />}
            sx={{ 
              px: 3,
              py: 1,
              fontWeight: 700,
              boxShadow: theme.shadows[8],
              '&:hover': {
                boxShadow: theme.shadows[12]
              }
            }}
          >
            Yes, Delete Product
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
