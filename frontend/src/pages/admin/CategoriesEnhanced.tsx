import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Avatar,
  alpha,
  Slide,
  useTheme,
} from '@mui/material';
import PaginationComponent from '../../components/PaginationComponent';
import { TransitionProps } from '@mui/material/transitions';
import { Add, Edit, Delete, Search, Category as CategoryIcon, Inventory, Image as ImageIcon } from '@mui/icons-material';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';
import React from 'react';

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

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  active: boolean;
  productCount: number;
}

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  active: boolean;
}

export default function Categories() {
  const theme = useTheme();
  const { showSuccess, showError } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryForm>({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    active: true,
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [page, rowsPerPage, search]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data: any = await api.get('/categories', {
        params: {
          page,
          size: rowsPerPage,
          search: search || undefined,
        },
      });
      setCategories(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        imageUrl: category.imageUrl || '',
        active: category.active,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        imageUrl: '',
        active: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCategory(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, formData);
        showSuccess('Category updated successfully');
      } else {
        await api.post('/categories', formData);
        showSuccess('Category created successfully');
      }
      handleCloseDialog();
      fetchCategories();
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await api.delete(`/categories/${id}`);
        showSuccess('Category deleted successfully');
        fetchCategories();
      } catch (error: any) {
        showError(error.response?.data?.message || 'Failed to delete category');
      }
    }
  };

  const handleFormChange = (field: keyof CategoryForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-generate slug from name
    if (field === 'name' && !editingCategory) {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      showError('File must be an image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('File size must not exceed 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      const formDataWithFile = new FormData();
      formDataWithFile.append('file', file);

      const response = await api.post('/products/upload-image', formDataWithFile, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadResponse = response as any;
      const imageUrl = uploadResponse.data?.url || uploadResponse?.url;
      setFormData(prev => ({ ...prev, imageUrl }));
      showSuccess(`Image uploaded successfully`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      showError(`Failed to upload image: ${errorMessage}`);
    } finally {
      setUploadingImage(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const totalCategories = totalElements;
  const activeCategories = categories.filter(c => c.active).length;
  const totalProducts = categories.reduce((sum, c) => sum + c.productCount, 0);

  return (
    <Box>
      {/* Header with Stats */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          gutterBottom 
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Category Management
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Organize your products with categories
        </Typography>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: alpha('#ffffff', 0.1)
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Total Categories
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      {totalCategories}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: alpha('#ffffff', 0.2), width: 56, height: 56 }}>
                    <CategoryIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: alpha('#ffffff', 0.1)
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Active Categories
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      {activeCategories}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: alpha('#ffffff', 0.2), width: 56, height: 56 }}>
                    <CategoryIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: alpha('#ffffff', 0.1)
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Total Products
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      {totalProducts}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: alpha('#ffffff', 0.2), width: 56, height: 56 }}>
                    <Inventory sx={{ fontSize: 32 }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Search and Add Button */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: theme.shadows[4] }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="primary" />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: 300 }}
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
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
            Add Category
          </Button>
        </Box>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: theme.shadows[4] }}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>Image</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>Name</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>Slug</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>Products</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>Status</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Loading...</TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">No categories found</TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow
                  key={category.id}
                  sx={{
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                    },
                    '&:nth-of-type(odd)': {
                      bgcolor: alpha(theme.palette.primary.main, 0.02),
                    },
                  }}
                >
                  <TableCell>
                    <Avatar
                      src={getImageUrl(category.imageUrl)}
                      alt={category.name}
                      variant="rounded"
                      sx={{ width: 50, height: 50 }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{category.name}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{category.slug}</TableCell>
                  <TableCell>
                    <Chip 
                      label={category.productCount} 
                      size="small" 
                      color="primary"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={category.active ? 'Active' : 'Inactive'}
                      color={category.active ? 'success' : 'default'}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDialog(category)}
                      sx={{
                        color: theme.palette.primary.main,
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                      }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => handleDelete(category.id)}
                      sx={{
                        '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ mt: 3 }}>
        <PaginationComponent
          page={page}
          rowsPerPage={rowsPerPage}
          totalElements={totalElements}
          onPageChange={(newPage) => setPage(newPage)}
          onRowsPerPageChange={(newSize) => {
            setRowsPerPage(newSize);
            setPage(0);
          }}
        />
      </Box>

      {/* Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        TransitionComponent={Transition}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontWeight: 700,
          fontSize: '1.5rem'
        }}>
          {editingCategory ? 'Edit Category' : 'Create Category'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              fullWidth
              required
              label="Category Name"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              sx={{ mt: 2 }}
            />
            <TextField
              fullWidth
              required
              label="Slug"
              value={formData.slug}
              onChange={(e) => handleFormChange('slug', e.target.value)}
              helperText="URL-friendly version of the name"
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
            />

            {/* Image Upload Section */}
            <Box sx={{ border: `2px dashed ${theme.palette.primary.main}`, borderRadius: 2, p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Category Image
              </Typography>

              {/* Image Preview */}
              {formData.imageUrl && (
                <Box sx={{ mb: 2, textAlign: 'center' }}>
                  <img
                    src={getImageUrl(formData.imageUrl)}
                    alt="Category preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}
                  />
                  <Typography variant="caption" color="textSecondary">
                    {formData.imageUrl}
                  </Typography>
                </Box>
              )}

              {/* Upload Button */}
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<ImageIcon />}
                sx={{ mb: 1 }}
                disabled={uploadingImage}
              >
                {uploadingImage ? 'Uploading...' : 'Upload Image'}
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={handleImageUpload}
                />
              </Button>
              <Typography variant="caption" color="textSecondary">
                Max 5MB, supports JPG, PNG, GIF
              </Typography>
            </Box>

            {/* Image URL Manual Entry */}
            <TextField
              fullWidth
              label="Or paste Image URL"
              value={formData.imageUrl}
              onChange={(e) => handleFormChange('imageUrl', e.target.value)}
              placeholder="https://example.com/image.jpg or /uploads/categories/..."
              size="small"
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => handleFormChange('active', e.target.checked)}
              />
              <Typography>Active</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ fontWeight: 600 }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              fontWeight: 600,
              px: 3
            }}
          >
            {editingCategory ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
