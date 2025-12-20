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
import { 
  Add, 
  Edit, 
  Delete, 
  Search, 
  Store as VendorIcon,
  Inventory,
  CheckCircle
} from '@mui/icons-material';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';
import React from 'react';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface Vendor {
  id: number;
  name: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  active: boolean;
  productCount: number;
}

interface VendorForm {
  name: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  active: boolean;
}

export default function VendorsEnhanced() {
  const theme = useTheme();
  const { showSuccess, showError } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState<VendorForm>({
    name: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    active: true,
  });

  useEffect(() => {
    fetchVendors();
  }, [page, rowsPerPage, search]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const data: any = await api.get('/vendors', {
        params: {
          page,
          size: rowsPerPage,
          search: search || undefined,
        },
      });
      setVendors(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor);
      setFormData({
        name: vendor.name,
        description: vendor.description || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        address: vendor.address || '',
        website: vendor.website || '',
        active: vendor.active,
      });
    } else {
      setEditingVendor(null);
      setFormData({
        name: '',
        description: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        active: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingVendor(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingVendor) {
        await api.put(`/vendors/${editingVendor.id}`, formData);
        showSuccess('Vendor updated successfully');
      } else {
        await api.post('/vendors', formData);
        showSuccess('Vendor created successfully');
      }
      handleCloseDialog();
      fetchVendors();
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to save vendor');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      try {
        await api.delete(`/vendors/${id}`);
        showSuccess('Vendor deleted successfully');
        fetchVendors();
      } catch (error: any) {
        showError(error.response?.data?.message || 'Failed to delete vendor');
      }
    }
  };

  const totalVendors = totalElements;
  const activeVendors = vendors.filter(v => v.active).length;
  const totalProducts = vendors.reduce((sum, v) => sum + v.productCount, 0);

  return (
    <Box>
      {/* Header with Stats */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          gutterBottom 
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Vendor Management
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Manage your suppliers and partners
        </Typography>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: theme.shadows[20]
              },
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
                      Total Vendors
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      {totalVendors}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: alpha('#ffffff', 0.2), width: 56, height: 56 }}>
                    <VendorIcon sx={{ fontSize: 32 }} />
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
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: theme.shadows[20]
              },
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
                      Active Vendors
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      {activeVendors}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: alpha('#ffffff', 0.2), width: 56, height: 56 }}>
                    <CheckCircle sx={{ fontSize: 32 }} />
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
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: theme.shadows[20]
              },
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
                      Products Supplied
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
            placeholder="Search vendors..."
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
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              fontWeight: 600,
              boxShadow: theme.shadows[8],
              '&:hover': {
                boxShadow: theme.shadows[12],
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Add Vendor
          </Button>
        </Box>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: theme.shadows[4] }}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>Name</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>Contact</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>Address</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>Products</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>Status</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">Loading...</TableCell>
              </TableRow>
            ) : vendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">No vendors found</TableCell>
              </TableRow>
            ) : (
              vendors.map((vendor) => (
                <TableRow 
                  key={vendor.id}
                  sx={{
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      transform: 'scale(1.01)',
                      transition: 'all 0.2s ease'
                    },
                    '&:nth-of-type(odd)': {
                      bgcolor: alpha(theme.palette.primary.main, 0.02),
                    },
                  }}
                >
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
                      {vendor.name}
                    </Typography>
                    {vendor.website && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {vendor.website}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{vendor.email || '-'}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {vendor.phone || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Typography variant="body2" sx={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {vendor.address || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={vendor.productCount} 
                      size="small" 
                      sx={{ 
                        bgcolor: alpha('#43e97b', 0.2),
                        color: '#43e97b',
                        fontWeight: 700
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={vendor.active ? 'Active' : 'Inactive'}
                      color={vendor.active ? 'success' : 'default'}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDialog(vendor)}
                      sx={{
                        color: theme.palette.primary.main,
                        '&:hover': { 
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => handleDelete(vendor.id)}
                      sx={{
                        '&:hover': { 
                          bgcolor: alpha(theme.palette.error.main, 0.1),
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease'
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
        maxWidth="md"
        fullWidth
        TransitionComponent={Transition}
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
          fontWeight: 700,
          fontSize: '1.5rem',
          p: 3,
          pb: 2
        }}>
          {editingVendor ? 'Edit Vendor' : 'Create Vendor'}
        </DialogTitle>
        <DialogContent sx={{ pt: 4, pb: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Vendor Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                variant="outlined"
                sx={{ mt: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Website"
                value={formData.website}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                borderRadius: 2
              }}>
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({...formData, active: e.target.checked})}
                  style={{ cursor: 'pointer', width: 18, height: 18 }}
                />
                <Typography sx={{ fontWeight: 600 }}>Active</Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button
            onClick={handleCloseDialog}
            sx={{ fontWeight: 600, color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              fontWeight: 600,
              px: 4,
              boxShadow: theme.shadows[8],
              '&:hover': {
                boxShadow: theme.shadows[12]
              }
            }}
          >
            {editingVendor ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
