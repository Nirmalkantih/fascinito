import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Grid,
  Card,
  CardContent,
  InputAdornment,
  Switch,
  FormControlLabel,
  Alert,
  Avatar,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  AdminPanelSettings as AdminIcon,
  Group as GroupIcon,
  VerifiedUser as VerifiedIcon,
} from '@mui/icons-material';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';

interface Staff {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  roles: string[]; // Changed from role: string to match API
  active: boolean;
  emailVerified: boolean;
  createdAt: string;
}

interface StaffFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'ROLE_ADMIN' | 'ROLE_STAFF';
  active: boolean;
}

const Staff: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);

  const [formData, setFormData] = useState<StaffFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'ROLE_STAFF',
    active: true,
  });

  const [formErrors, setFormErrors] = useState<Partial<StaffFormData>>({});

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    admins: 0,
  });

  useEffect(() => {
    fetchStaff();
    fetchStats();
  }, [page, rowsPerPage, searchTerm, roleFilter, statusFilter]);

  const fetchStats = async () => {
    try {
      // Fetch all staff to calculate stats (without pagination)
      const response = await api.get('/staff', { params: { page: 0, size: 1000 } });
      const data = response as any || {};
      const allStaff = data.content || [];
      
      setStats({
        total: data.totalElements || 0,
        active: allStaff.filter((s: Staff) => s.active).length,
        admins: allStaff.filter((s: Staff) => s.roles?.includes('ROLE_ADMIN')).length,
      });
    } catch (error) {
      console.error('Error fetching staff stats:', error);
    }
  };

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = {
        page,
        size: rowsPerPage,
      };

      if (searchTerm) params.search = searchTerm;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.active = statusFilter;

      const response = await api.get('/staff', { params });
      const data = response as any || {};
      
      setStaff(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (error: any) {
      console.error('Error fetching staff:', error);
      showError(error.response?.data?.message || 'Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (staff?: Staff) => {
    if (staff) {
      setEditingStaff(staff);
      setFormData({
        email: staff.email,
        password: '******', // Show placeholder to indicate password exists
        firstName: staff.firstName,
        lastName: staff.lastName,
        phone: staff.phone || '',
        role: (staff.roles?.includes('ROLE_ADMIN') ? 'ROLE_ADMIN' : 'ROLE_STAFF') as 'ROLE_ADMIN' | 'ROLE_STAFF',
        active: staff.active,
      });
    } else {
      setEditingStaff(null);
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'ROLE_STAFF',
        active: true,
      });
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingStaff(null);
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'ROLE_STAFF',
      active: true,
    });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Partial<StaffFormData> = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    // For new staff, password is required
    if (!editingStaff && !formData.password) {
      errors.password = 'Password is required';
    } 
    // For editing, only validate if password was changed (not the placeholder)
    else if (editingStaff && formData.password && formData.password !== '••••••••' && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    // For new staff, validate length
    else if (!editingStaff && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // Check if password is the placeholder or empty (don't send it)
      const isPasswordUnchanged = !formData.password || formData.password === '••••••••';
      
      const payload = editingStaff && isPasswordUnchanged
        ? {
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone || null,
            roles: [formData.role], // Backend expects roles as array
            active: formData.active,
          }
        : {
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone || null,
            roles: [formData.role], // Backend expects roles as array
            active: formData.active,
          };

      if (editingStaff) {
        await api.put(`/staff/${editingStaff.id}`, payload);
        showSuccess('Staff member updated successfully');
      } else {
        await api.post('/staff', payload);
        showSuccess('Staff member created successfully');
      }

      handleCloseDialog();
      fetchStaff();
    } catch (error: any) {
      console.error('Error saving staff:', error);
      showError(error.response?.data?.message || 'Failed to save staff member');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (staff: Staff) => {
    setStaffToDelete(staff);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!staffToDelete) return;

    try {
      setLoading(true);
      await api.delete(`/staff/${staffToDelete.id}`);
      showSuccess('Staff member deleted successfully');
      setDeleteConfirmOpen(false);
      setStaffToDelete(null);
      fetchStaff();
    } catch (error: any) {
      console.error('Error deleting staff:', error);
      showError(error.response?.data?.message || 'Failed to delete staff member');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getRoleColor = (role: string): 'primary' | 'secondary' | 'default' => {
    switch (role) {
      case 'ROLE_ADMIN':
        return 'primary';
      case 'ROLE_STAFF':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role: string): string => {
    return role.replace('ROLE_', '');
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="bold">
          Staff Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Staff
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Staff
                  </Typography>
                  <Typography variant="h3" fontWeight="bold">
                    {stats.total}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha('#ffffff', 0.3), width: 60, height: 60 }}>
                  <GroupIcon sx={{ fontSize: 32 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Active Staff
                  </Typography>
                  <Typography variant="h3" fontWeight="bold">
                    {stats.active}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha('#ffffff', 0.3), width: 60, height: 60 }}>
                  <VerifiedIcon sx={{ fontSize: 32 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Administrators
                  </Typography>
                  <Typography variant="h3" fontWeight="bold">
                    {stats.admins}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha('#ffffff', 0.3), width: 60, height: 60 }}>
                  <AdminIcon sx={{ fontSize: 32 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={roleFilter}
                label="Role"
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="ROLE_ADMIN">Admin</MenuItem>
                <MenuItem value="ROLE_STAFF">Staff</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Staff Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Email Verified</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                  <Typography>Loading...</Typography>
                </TableCell>
              </TableRow>
            ) : staff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                  <Typography color="textSecondary">No staff members found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              staff.map((member) => (
                <TableRow key={member.id} hover>
                  <TableCell>{member.id}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon sx={{ color: 'text.secondary' }} />
                      <Typography variant="body2" fontWeight="medium">
                        {member.firstName} {member.lastName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      {member.email}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {member.phone ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        {member.phone}
                      </Box>
                    ) : (
                      <Typography color="textSecondary" variant="body2">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getRoleLabel(member.roles?.[0] || 'ROLE_STAFF')}
                      color={getRoleColor(member.roles?.[0] || 'ROLE_STAFF')}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={member.active ? 'Active' : 'Inactive'}
                      color={member.active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={member.emailVerified ? 'Verified' : 'Not Verified'}
                      color={member.emailVerified ? 'success' : 'warning'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(member)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(member)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalElements}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  error={!!formErrors.firstName}
                  helperText={formErrors.firstName}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  error={!!formErrors.lastName}
                  helperText={formErrors.lastName}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  error={!!formErrors.password}
                  helperText={formErrors.password || (editingStaff ? 'Change password or leave as is to keep current' : 'Minimum 6 characters')}
                  required={!editingStaff}
                  placeholder={editingStaff ? 'Enter new password to change' : 'Enter password'}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    label="Role"
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ROLE_ADMIN' | 'ROLE_STAFF' })}
                  >
                    <MenuItem value="ROLE_STAFF">Staff</MenuItem>
                    <MenuItem value="ROLE_ADMIN">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    />
                  }
                  label="Active"
                />
              </Grid>
              {editingStaff && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    Editing staff member ID: {editingStaff.id}
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {editingStaff ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {staffToDelete?.firstName} {staffToDelete?.lastName}?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={loading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Staff;
