import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  TextField,
  Grid,
  Chip,
  IconButton,
  Stack,
  Alert,
  TablePagination,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as PreviewIcon,
  Mail as MailIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import api from '../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';

interface EmailTemplate {
  id: number;
  templateKey: string;
  templateName: string;
  subject: string;
  isActive: boolean;
  updatedAt: string;
}

interface Stats {
  totalTemplates: number;
  activeTemplates: number;
}

export default function EmailTemplateListPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [stats, setStats] = useState<Stats>({ totalTemplates: 0, activeTemplates: 0 });
  const [error, setError] = useState('');
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    templateKey: '',
    templateName: '',
    subject: '',
    bodyHtml: '',
    isActive: true,
  });
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch email templates
  const fetchTemplates = async (pageNum: number = 0) => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(
        `/admin/email-templates?page=${pageNum}&size=${rowsPerPage}`
      );

      setTemplates((response as any).content || []);
      setTotal((response as any).totalElements || 0);
    } catch (error) {
      setError('Failed to fetch email templates');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await api.get(`/admin/email-templates/stats/summary`);
      setStats(response as any);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchTemplates(0);
    fetchStats();
  }, []);

  // Handle template edit
  const handleEdit = (id: number) => {
    navigate(`/admin/email-templates/${id}/edit`);
  };

  // Handle preview
  const handlePreview = async (id: number) => {
    try {
      const response = await api.post(
        `/admin/email-templates/${id}/preview`,
        {}
      );

      // Show preview in new window
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write((response as any).body);
        previewWindow.document.close();
      }
    } catch (error) {
      setError('Failed to preview template');
      console.error(error);
    }
  };

  // Handle create template
  const handleCreateTemplate = async () => {
    if (!newTemplate.templateKey.trim() || !newTemplate.templateName.trim() ||
        !newTemplate.subject.trim() || !newTemplate.bodyHtml.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);
      await api.post('/admin/email-templates', newTemplate);
      setOpenCreateDialog(false);
      setNewTemplate({
        templateKey: '',
        templateName: '',
        subject: '',
        bodyHtml: '',
        isActive: true,
      });
      setError('');
      fetchTemplates(0);
      fetchStats();
    } catch (error) {
      setError('Failed to create template. Template key might already exist.');
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  // Handle delete template
  const handleDeleteTemplate = async (id: number) => {
    setSelectedTemplateId(id);
    setDeleteConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedTemplateId) return;

    try {
      setDeleting(true);
      await api.delete(`/admin/email-templates/${selectedTemplateId}`);
      setDeleteConfirmDialog(false);
      setSelectedTemplateId(null);
      setError('');
      fetchTemplates(page);
      fetchStats();
    } catch (error) {
      setError('Failed to delete template');
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchTemplates(page);
    fetchStats();
  };

  // Handle pagination
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
    fetchTemplates(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    fetchTemplates(0);
  };

  // Filter templates
  const filteredTemplates = templates.filter(
    (t) =>
      t.templateName.toLowerCase().includes(searchText.toLowerCase()) ||
      t.templateKey.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>Total Templates</Box>
                  <Box sx={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalTemplates}</Box>
                </Box>
                <MailIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>Active Templates</Box>
                  <Box sx={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.activeTemplates}</Box>
                </Box>
                <MailIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Error Alert */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Header and Search */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Email Templates"
          action={
            <Stack direction="row" spacing={1}>
              <TextField
                placeholder="Search templates..."
                size="small"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                sx={{ width: 250 }}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenCreateDialog(true)}
                disabled={loading}
              >
                Create Template
              </Button>
              <IconButton onClick={handleRefresh} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Stack>
          }
        />
      </Card>

      {/* Table */}
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}
        {!loading && (
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>Template Name</TableCell>
                <TableCell>Event Key</TableCell>
                <TableCell>Email Subject</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTemplates.map((template) => (
                <TableRow key={template.id} hover>
                  <TableCell>{template.templateName}</TableCell>
                  <TableCell>
                    <code style={{ backgroundColor: '#f0f0f0', padding: '4px 8px', borderRadius: '4px' }}>
                      {template.templateKey}
                    </code>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {template.subject.substring(0, 50)}...
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={template.isActive ? 'Active' : 'Inactive'}
                      color={template.isActive ? 'success' : 'error'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{new Date(template.updatedAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEdit(template.id)}
                        title="Edit"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => handlePreview(template.id)}
                        title="Preview"
                      >
                        <PreviewIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => navigate(`/admin/email-templates/${template.id}/test`)}
                        title="Send Test"
                      >
                        <MailIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteTemplate(template.id)}
                        title="Delete"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Pagination */}
      {!loading && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}

      {/* Create Template Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Email Template</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Template Key"
            placeholder="e.g., ORDER_CONFIRMED"
            fullWidth
            value={newTemplate.templateKey}
            onChange={(e) => setNewTemplate({ ...newTemplate, templateKey: e.target.value })}
            disabled={creating}
            helperText="Unique identifier for this template (e.g., ORDER_CONFIRMED)"
          />
          <TextField
            label="Template Name"
            placeholder="e.g., Order Confirmed"
            fullWidth
            value={newTemplate.templateName}
            onChange={(e) => setNewTemplate({ ...newTemplate, templateName: e.target.value })}
            disabled={creating}
          />
          <TextField
            label="Email Subject"
            placeholder="e.g., Your order #{{orderId}} has been confirmed"
            fullWidth
            value={newTemplate.subject}
            onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
            disabled={creating}
            helperText="You can use variables like {{orderId}}, {{customerName}}, etc."
          />
          <TextField
            label="Email Body (HTML)"
            placeholder="Enter HTML email body with variables"
            fullWidth
            multiline
            rows={6}
            value={newTemplate.bodyHtml}
            onChange={(e) => setNewTemplate({ ...newTemplate, bodyHtml: e.target.value })}
            disabled={creating}
            helperText="You can use variables like {{customerName}}, {{totalAmount}}, etc."
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={newTemplate.isActive}
                onChange={(e) => setNewTemplate({ ...newTemplate, isActive: e.target.checked })}
                disabled={creating}
              />
            }
            label="Active"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)} disabled={creating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateTemplate}
            variant="contained"
            disabled={creating}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmDialog} onClose={() => setDeleteConfirmDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this email template? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmDialog(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            color="error"
            disabled={deleting}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
