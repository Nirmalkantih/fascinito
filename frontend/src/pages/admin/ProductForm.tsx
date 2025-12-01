import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  MenuItem,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Add, Delete, ArrowBack, CloudUpload, Edit as EditIcon } from '@mui/icons-material';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';

interface ProductVariation {
  id?: number;
  name: string;
  value?: string;
  sku: string;
  price: number;
  priceAdjustment?: number;
  stockQuantity: number;
  imageUrl?: string;
  options?: string;
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

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
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
  const [uploadingVariationImage, setUploadingVariationImage] = useState<{ [key: number]: boolean }>({});
  const [editingVariationIndex, setEditingVariationIndex] = useState<number | null>(null);
  const [variationDialogOpen, setVariationDialogOpen] = useState(false);

  useEffect(() => {
    fetchDropdownData();
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchDropdownData = async () => {
    try {
      const [categoriesRes, vendorsRes, locationsRes] = await Promise.all([
        api.get('/categories'),
        api.get('/vendors'),
        api.get('/locations'),
      ]);
      setCategories(categoriesRes.data.data || []);
      setVendors(vendorsRes.data.data || []);
      setLocations(locationsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/products/${id}`);
      const product = response.data.data;
      setFormData({
        title: product.title || '',
        slug: product.slug || '',
        description: product.description || '',
        sku: product.sku || '',
        upc: product.upc || '',
        categoryId: product.categoryId || null,
        subCategoryId: product.subCategoryId || null,
        vendorId: product.vendorId || null,
        locationId: product.locationId || null,
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
        variations: product.variations || [],
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
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
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

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  };

  const handleAddVariation = () => {
    setFormData(prev => ({
      ...prev,
      variations: [
        ...prev.variations,
        { name: '', value: '', sku: '', price: 0, priceAdjustment: 0, stockQuantity: 0, imageUrl: '', options: '' },
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

  const handleVariationImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, variationIndex: number) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

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

    try {
      setUploadingVariationImage(prev => ({ ...prev, [variationIndex]: true }));

      const formDataWithFile = new FormData();
      formDataWithFile.append('file', file);

      const response = await api.post('/products/upload-image', formDataWithFile, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const imageUrl = response.data?.data?.url || response.data?.url;
      if (imageUrl) {
        handleVariationChange(variationIndex, 'imageUrl', imageUrl);
        showSuccess(`Image ${file.name} uploaded successfully`);
      }
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to upload image');
      console.error('Error uploading variation image:', error);
    } finally {
      setUploadingVariationImage(prev => ({ ...prev, [variationIndex]: false }));
      // Reset file input
      event.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Validate that all variations have images
      if (formData.variations.length > 0) {
        const variationsWithoutImages = formData.variations.filter(v => !v.imageUrl || v.imageUrl.trim() === '');
        if (variationsWithoutImages.length > 0) {
          showError(`⚠️ ${variationsWithoutImages.length} variation(s) are missing images. Please upload an image for each variation.`);
          setLoading(false);
          return;
        }
      }

      if (id) {
        await api.put(`/products/${id}`, formData);
        showSuccess('Product updated successfully');
      } else {
        await api.post('/products', formData);
        showSuccess('Product created successfully');
      }
      navigate('/admin/products');
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/admin/products')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">
          {id ? 'Edit Product' : 'Create New Product'}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    required
                    label="Product Title"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    required
                    label="Slug (URL)"
                    value={formData.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
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
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="SKU"
                    value={formData.sku}
                    onChange={(e) => handleChange('sku', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="UPC (Barcode)"
                    value={formData.upc}
                    onChange={(e) => handleChange('upc', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Categories and Organization */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Categories & Organization
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    select
                    label="Category"
                    value={formData.categoryId || ''}
                    onChange={(e) => handleChange('categoryId', e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <MenuItem value="">None</MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    select
                    label="Vendor"
                    value={formData.vendorId || ''}
                    onChange={(e) => handleChange('vendorId', e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <MenuItem value="">None</MenuItem>
                    {vendors.map((vendor) => (
                      <MenuItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    select
                    label="Location"
                    value={formData.locationId || ''}
                    onChange={(e) => handleChange('locationId', e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <MenuItem value="">None</MenuItem>
                    {locations.map((location) => (
                      <MenuItem key={location.id} value={location.id}>
                        {location.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Pricing */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Pricing
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    required
                    type="number"
                    label="Regular Price"
                    value={formData.regularPrice}
                    onChange={(e) => handleChange('regularPrice', parseFloat(e.target.value))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
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
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
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
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Tax Rate (%)"
                    value={formData.taxRate}
                    onChange={(e) => handleChange('taxRate', parseFloat(e.target.value))}
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
                      />
                    }
                    label="Tax Exempt"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Inventory */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Inventory
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.trackInventory}
                        onChange={(e) => handleChange('trackInventory', e.target.checked)}
                      />
                    }
                    label="Track Inventory"
                  />
                </Grid>
                {formData.trackInventory && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Stock Quantity"
                        value={formData.stockQuantity}
                        onChange={(e) => handleChange('stockQuantity', parseInt(e.target.value))}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Low Stock Threshold"
                        value={formData.lowStockThreshold}
                        onChange={(e) => handleChange('lowStockThreshold', parseInt(e.target.value))}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </Paper>
          </Grid>

          {/* Images */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Product Images
              </Typography>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Image URL"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleAddImage}>
                          <Add />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  helperText="Press Enter or click + to add image"
                />
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {formData.imageUrls.map((url, index) => (
                  <Box
                    key={index}
                    sx={{
                      position: 'relative',
                      width: 150,
                      height: 150,
                      border: '1px solid #ddd',
                      borderRadius: 1,
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={url}
                      alt={`Product ${index + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                      }}
                    />
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'rgba(255,255,255,0.9)',
                        '&:hover': { bgcolor: 'rgba(255,0,0,0.9)', color: 'white' },
                      }}
                      onClick={() => handleRemoveImage(index)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Variations */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Product Variations
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Add sizes, colors, or other variants
                  </Typography>
                  {formData.variations.length > 0 && (
                    <Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: 600, display: 'block', mt: 0.5 }}>
                      ⚠️ Image upload is mandatory for each variation
                    </Typography>
                  )}
                </Box>
                <Button
                  startIcon={<Add />}
                  variant="contained"
                  onClick={handleAddVariation}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Add Variation
                </Button>
              </Box>

              {formData.variations.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    No variations added yet. Click "Add Variation" to get started.
                  </Typography>
                </Box>
              ) : (
                <TableContainer sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 700, width: '12%' }}>Attribute</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: '12%' }}>Value</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: '10%' }}>SKU</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: '10%' }} align="right">Price</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: '10%' }} align="right">Stock</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: '12%' }}>Image</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: '10%' }} align="center">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.variations.map((variation, index) => {
                        const hasImage = variation.imageUrl && variation.imageUrl.trim() !== '';
                        return (
                          <TableRow key={index} sx={{ '&:hover': { bgcolor: '#f9f9f9' } }}>
                            <TableCell>{variation.name || '-'}</TableCell>
                            <TableCell>{variation.value || '-'}</TableCell>
                            <TableCell>{variation.sku || '-'}</TableCell>
                            <TableCell align="right">₹{variation.price?.toFixed(2) || '0.00'}</TableCell>
                            <TableCell align="right">{variation.stockQuantity || 0}</TableCell>
                            <TableCell>
                              {hasImage ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box
                                    component="img"
                                    src={variation.imageUrl}
                                    alt="variation"
                                    sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover', border: '1px solid #ddd' }}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=Invalid';
                                    }}
                                  />
                                  <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 700 }}>✓</Typography>
                                </Box>
                              ) : (
                                <Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: 700 }}>⚠️ Missing</Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setEditingVariationIndex(index);
                                  setVariationDialogOpen(true);
                                }}
                                color="primary"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveVariation(index)}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>

          {/* Variation Edit Dialog */}
          <Dialog
            open={variationDialogOpen}
            onClose={() => setVariationDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            {editingVariationIndex !== null && formData.variations[editingVariationIndex] && (
              <>
                <DialogTitle sx={{ fontWeight: 700 }}>
                  Edit Variation: {formData.variations[editingVariationIndex]?.name}
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Name */}
                    <TextField
                      fullWidth
                      required
                      label="Variation Name (e.g., Size)"
                      value={formData.variations[editingVariationIndex]?.name || ''}
                      onChange={(e) => handleVariationChange(editingVariationIndex, 'name', e.target.value)}
                    />

                    {/* Value */}
                    <TextField
                      fullWidth
                      required
                      label="Variation Value (e.g., M)"
                      value={formData.variations[editingVariationIndex]?.value || ''}
                      onChange={(e) => handleVariationChange(editingVariationIndex, 'value', e.target.value)}
                    />

                    {/* SKU */}
                    <TextField
                      fullWidth
                      label="SKU"
                      value={formData.variations[editingVariationIndex]?.sku || ''}
                      onChange={(e) => handleVariationChange(editingVariationIndex, 'sku', e.target.value)}
                    />

                    {/* Price */}
                    <TextField
                      fullWidth
                      required
                      type="number"
                      label="Price"
                      value={formData.variations[editingVariationIndex]?.price || 0}
                      onChange={(e) => handleVariationChange(editingVariationIndex, 'price', parseFloat(e.target.value))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                    />

                    {/* Stock */}
                    <TextField
                      fullWidth
                      type="number"
                      label="Stock Quantity"
                      value={formData.variations[editingVariationIndex]?.stockQuantity || 0}
                      onChange={(e) => handleVariationChange(editingVariationIndex, 'stockQuantity', parseInt(e.target.value) || 0)}
                    />

                    {/* Image Upload */}
                    <Box sx={{ border: '2px dashed #1976d2', p: 2, borderRadius: 1.5, bgcolor: '#f5f5f5' }}>
                      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: '#1976d2' }}>
                        📸 Variation Image (Required)
                      </Typography>

                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<CloudUpload />}
                        fullWidth
                        sx={{ mb: 1.5 }}
                      >
                        {uploadingVariationImage[editingVariationIndex] ? 'Uploading...' : 'Click to Upload Image'}
                        <input
                          hidden
                          accept="image/*"
                          type="file"
                          onChange={(e) => handleVariationImageUpload(e, editingVariationIndex)}
                          disabled={uploadingVariationImage[editingVariationIndex]}
                        />
                      </Button>

                      <Box sx={{ display: 'flex', alignItems: 'center', my: 1.5, gap: 1 }}>
                        <Box sx={{ flex: 1, height: '1px', bgcolor: '#ccc' }} />
                        <Typography variant="caption" sx={{ color: '#999' }}>OR</Typography>
                        <Box sx={{ flex: 1, height: '1px', bgcolor: '#ccc' }} />
                      </Box>

                      <TextField
                        fullWidth
                        label="Image URL"
                        value={formData.variations[editingVariationIndex]?.imageUrl || ''}
                        onChange={(e) => handleVariationChange(editingVariationIndex, 'imageUrl', e.target.value)}
                        placeholder="Paste image URL"
                        size="small"
                      />

                      {formData.variations[editingVariationIndex]?.imageUrl && (
                        <Box sx={{ mt: 1.5 }}>
                          <Box
                            component="img"
                            src={formData.variations[editingVariationIndex]?.imageUrl}
                            alt="preview"
                            sx={{ width: '100%', maxHeight: 150, borderRadius: 1, objectFit: 'cover', border: '1px solid #ddd' }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Invalid';
                            }}
                          />
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleVariationChange(editingVariationIndex, 'imageUrl', '')}
                            sx={{ mt: 1 }}
                          >
                            Remove Image
                          </Button>
                        </Box>
                      )}
                    </Box>

                    {/* Price Adjustment */}
                    <TextField
                      fullWidth
                      type="number"
                      label="Price Adjustment (Optional)"
                      value={formData.variations[editingVariationIndex]?.priceAdjustment || ''}
                      onChange={(e) => handleVariationChange(editingVariationIndex, 'priceAdjustment', e.target.value ? parseFloat(e.target.value) : 0)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                    />

                    {/* Options */}
                    <TextField
                      fullWidth
                      label="Options (JSON - Optional)"
                      value={formData.variations[editingVariationIndex]?.options || ''}
                      onChange={(e) => handleVariationChange(editingVariationIndex, 'options', e.target.value)}
                      placeholder='{"color": "Red", "size": "M"}'
                      multiline
                      rows={3}
                    />
                  </Box>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setVariationDialogOpen(false)}>Cancel</Button>
                  <Button onClick={() => setVariationDialogOpen(false)} variant="contained">
                    Done
                  </Button>
                </DialogActions>
              </>
            )}
          </Dialog>

          {/* Settings */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.visibleToCustomers}
                        onChange={(e) => handleChange('visibleToCustomers', e.target.checked)}
                      />
                    }
                    label="Visible to Customers"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.active}
                        onChange={(e) => handleChange('active', e.target.checked)}
                      />
                    }
                    label="Active"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.featured}
                        onChange={(e) => handleChange('featured', e.target.checked)}
                      />
                    }
                    label="Featured Product"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/admin/products')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
              >
                {loading ? 'Saving...' : id ? 'Update Product' : 'Create Product'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}
