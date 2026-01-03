import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardHeader,
  Button,
  Grid,
  CircularProgress,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';

interface EmailTemplate {
  id: number;
  templateKey: string;
  templateName: string;
  subject: string;
  bodyHtml: string;
  isActive: boolean;
}

interface EmailCampaign {
  id: number;
  campaignName: string;
  templateId: number;
  templateName: string;
  subject: string;
  targetType: string;
  status: string;
  scheduledAt: string | null;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  pendingCount: number;
  successRate: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateCampaignData {
  campaignName: string;
  templateId: string;
  subject: string;
  body: string;
  targetType: string;
  recipientIds: number[];
  scheduledAt: string;
  sendImmediately: boolean;
}

export default function EmailCampaignListPage() {
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [recipients, setRecipients] = useState<any[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Set<number>>(new Set());
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  const [newCampaign, setNewCampaign] = useState<CreateCampaignData>({
    campaignName: '',
    templateId: '',
    subject: '',
    body: '',
    targetType: 'SELECTED',
    recipientIds: [],
    scheduledAt: '',
    sendImmediately: false,
  });

  // Fetch campaigns and templates
  useEffect(() => {
    fetchCampaigns();
    fetchTemplates();
  }, [page, statusFilter]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError('');
      const url = statusFilter
        ? `/admin/email-campaigns/status/${statusFilter}?page=${page}&size=${rowsPerPage}`
        : `/admin/email-campaigns?page=${page}&size=${rowsPerPage}`;
      const response = (await api.get(url)) as any;
      setCampaigns(response.content || []);
    } catch (error) {
      setError('Failed to fetch campaigns');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = (await api.get('/admin/email-templates?page=0&size=100')) as any;
      setTemplates(response.content || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchRecipients = async () => {
    try {
      setLoadingRecipients(true);
      const response = (await api.get('/customers?page=0&size=1000')) as any;
      setRecipients(response.data?.content || response.content || response || []);
    } catch (error) {
      console.error('Failed to fetch recipients:', error);
      setError('Failed to load recipient list');
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleCreateOpen = async () => {
    await fetchRecipients();
    setOpenCreateDialog(true);
  };

  const handleCreateClose = () => {
    setOpenCreateDialog(false);
    setNewCampaign({
      campaignName: '',
      templateId: '',
      subject: '',
      body: '',
      targetType: 'SELECTED',
      recipientIds: [],
      scheduledAt: '',
      sendImmediately: false,
    });
    setSelectedRecipients(new Set());
  };

  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id.toString() === templateId);
    if (template) {
      setNewCampaign({
        ...newCampaign,
        templateId,
        subject: template.subject,
        body: template.bodyHtml,
      });
    }
  };

  const handleRecipientToggle = (recipientId: number) => {
    const newSelected = new Set(selectedRecipients);
    if (newSelected.has(recipientId)) {
      newSelected.delete(recipientId);
    } else {
      newSelected.add(recipientId);
    }
    setSelectedRecipients(newSelected);
    setNewCampaign({
      ...newCampaign,
      recipientIds: Array.from(newSelected),
    });
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.campaignName.trim()) {
      setError('Campaign name is required');
      return;
    }
    if (!newCampaign.templateId) {
      setError('Template is required');
      return;
    }
    if (newCampaign.recipientIds.length === 0) {
      setError('At least one recipient must be selected');
      return;
    }
    if (!newCampaign.sendImmediately && !newCampaign.scheduledAt) {
      setError('Either send immediately or select a scheduled date');
      return;
    }

    try {
      setCreating(true);
      setError('');
      setSuccess('');

      const payload = {
        campaignName: newCampaign.campaignName,
        templateId: parseInt(newCampaign.templateId),
        subject: newCampaign.subject,
        body: newCampaign.body,
        targetType: newCampaign.targetType,
        recipientIds: newCampaign.recipientIds,
        sendImmediately: newCampaign.sendImmediately,
        scheduledAt: newCampaign.scheduledAt ? new Date(newCampaign.scheduledAt).toISOString() : null,
      };

      await api.post('/admin/email-campaigns', payload);
      setSuccess('Campaign created successfully!');
      handleCreateClose();
      setTimeout(() => fetchCampaigns(), 1500);
    } catch (error) {
      setError('Failed to create campaign');
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteOpen = (campaignId: number) => {
    setSelectedCampaignId(campaignId);
    setDeleteConfirmDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCampaignId) return;

    try {
      setDeleting(true);
      setError('');
      await api.delete(`/admin/email-campaigns/${selectedCampaignId}`);
      setSuccess('Campaign deleted successfully!');
      setDeleteConfirmDialog(false);
      setTimeout(() => fetchCampaigns(), 1500);
    } catch (error) {
      setError('Failed to delete campaign');
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      DRAFT: 'default',
      SCHEDULED: 'info',
      SENDING: 'warning',
      COMPLETED: 'success',
      FAILED: 'error',
      PAUSED: 'error',
    };
    return colors[status] || 'default';
  };

  if (loading && campaigns.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Email Campaigns"
              action={
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateOpen}
                  disabled={loading || templates.length === 0}
                >
                  Create Campaign
                </Button>
              }
            />
          </Card>
        </Grid>

        {/* Status Filter */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={statusFilter}
              label="Filter by Status"
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">All Campaigns</MenuItem>
              <MenuItem value="DRAFT">Draft</MenuItem>
              <MenuItem value="SCHEDULED">Scheduled</MenuItem>
              <MenuItem value="SENDING">Sending</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
              <MenuItem value="FAILED">Failed</MenuItem>
              <MenuItem value="PAUSED">Paused</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Campaigns Table */}
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Campaign Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Template</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">
                    Recipients
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">
                    Sent / Failed
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">
                    Success Rate
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Scheduled At</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id} hover>
                    <TableCell>{campaign.campaignName}</TableCell>
                    <TableCell>{campaign.templateName}</TableCell>
                    <TableCell>
                      <Chip label={campaign.status} color={getStatusColor(campaign.status) as any} size="small" />
                    </TableCell>
                    <TableCell align="right">{campaign.totalRecipients}</TableCell>
                    <TableCell align="right">
                      {campaign.sentCount} / {campaign.failedCount}
                    </TableCell>
                    <TableCell align="right">{campaign.successRate.toFixed(1)}%</TableCell>
                    <TableCell>
                      {campaign.scheduledAt ? new Date(campaign.scheduledAt).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ViewIcon />}
                          onClick={() => navigate(`/admin/email-campaigns/${campaign.id}`)}
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteOpen(campaign.id)}
                        >
                          Delete
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {campaigns.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      No campaigns found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={campaigns.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Grid>
      </Grid>

      {/* Create Campaign Dialog */}
      <Dialog open={openCreateDialog} onClose={handleCreateClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create Email Campaign</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Campaign Name */}
            <TextField
              label="Campaign Name"
              value={newCampaign.campaignName}
              onChange={(e) =>
                setNewCampaign({
                  ...newCampaign,
                  campaignName: e.target.value,
                })
              }
              fullWidth
              required
              placeholder="e.g., Spring Promotion 2024"
            />

            {/* Email Template */}
            <FormControl fullWidth required>
              <InputLabel>Select Email Template</InputLabel>
              <Select
                value={newCampaign.templateId}
                label="Select Email Template"
                onChange={(e) => handleSelectTemplate(e.target.value)}
              >
                {templates.map((template) => (
                  <MenuItem key={template.id} value={template.id.toString()}>
                    {template.templateName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Subject */}
            <TextField
              label="Subject"
              value={newCampaign.subject}
              onChange={(e) =>
                setNewCampaign({
                  ...newCampaign,
                  subject: e.target.value,
                })
              }
              fullWidth
              required
              placeholder="Email subject"
            />

            {/* Body */}
            <TextField
              label="Email Body (HTML)"
              value={newCampaign.body}
              onChange={(e) =>
                setNewCampaign({
                  ...newCampaign,
                  body: e.target.value,
                })
              }
              fullWidth
              multiline
              rows={8}
              placeholder="Email body content"
              sx={{ fontFamily: 'monospace' }}
            />

            {/* Target Type */}
            <FormControl fullWidth>
              <InputLabel>Target Type</InputLabel>
              <Select
                value={newCampaign.targetType}
                label="Target Type"
                onChange={(e) =>
                  setNewCampaign({
                    ...newCampaign,
                    targetType: e.target.value,
                  })
                }
              >
                <MenuItem value="SELECTED">Selected Recipients</MenuItem>
                <MenuItem value="ALL">All Customers</MenuItem>
              </Select>
            </FormControl>

            {/* Send Options */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={newCampaign.sendImmediately}
                  onChange={(e) =>
                    setNewCampaign({
                      ...newCampaign,
                      sendImmediately: e.target.checked,
                    })
                  }
                />
              }
              label="Send Immediately"
            />

            {/* Scheduled Date (if not send immediately) */}
            {!newCampaign.sendImmediately && (
              <TextField
                label="Schedule Send Date & Time"
                type="datetime-local"
                value={newCampaign.scheduledAt}
                onChange={(e) =>
                  setNewCampaign({
                    ...newCampaign,
                    scheduledAt: e.target.value,
                  })
                }
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                required
              />
            )}

            {/* Recipients Selection */}
            {loadingRecipients ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={30} />
              </Box>
            ) : (
              <>
                <Box sx={{ fontWeight: 'bold', mt: 1 }}>
                  Select Recipients ({selectedRecipients.size} selected)
                </Box>
                <Paper
                  sx={{
                    maxHeight: 200,
                    overflow: 'auto',
                    border: '1px solid #ddd',
                    p: 1,
                  }}
                >
                  <Stack spacing={1}>
                    {recipients.map((recipient: any) => (
                      <FormControlLabel
                        key={recipient.id}
                        control={
                          <Checkbox
                            checked={selectedRecipients.has(recipient.id)}
                            onChange={() => handleRecipientToggle(recipient.id)}
                          />
                        }
                        label={`${recipient.firstName} ${recipient.lastName} (${recipient.email})`}
                      />
                    ))}
                  </Stack>
                </Paper>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateClose}>Cancel</Button>
          <Button
            onClick={handleCreateCampaign}
            variant="contained"
            disabled={creating || selectedRecipients.size === 0}
          >
            {creating ? 'Creating...' : 'Create Campaign'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmDialog} onClose={() => setDeleteConfirmDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>Are you sure you want to delete this campaign? This action cannot be undone.</Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
