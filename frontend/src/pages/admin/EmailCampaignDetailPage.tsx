import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  Grid,
  CircularProgress,
  Stack,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Chip,
  LinearProgress,
  Typography,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';

interface CampaignDetail {
  id: number;
  campaignName: string;
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

interface CampaignStats {
  campaignId: number;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  pendingCount: number;
  successRate: number;
  failureRate: number;
  status: string;
}

interface Recipient {
  id: number;
  customerId: number;
  customerName: string;
  email: string;
  status: string;
  sentAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export default function EmailCampaignDetailPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientFilter, setRecipientFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showDetails, setShowDetails] = useState(false);

  // Auto-refresh for active campaigns
  useEffect(() => {
    if (campaign?.status === 'SENDING' || campaign?.status === 'SCHEDULED') {
      const interval = setInterval(() => {
        fetchCampaignData();
      }, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [campaign?.status]);

  useEffect(() => {
    if (campaignId) {
      fetchCampaignData();
    }
  }, [campaignId]);

  const fetchCampaignData = async () => {
    if (!campaignId) return;

    try {
      setLoading(true);
      setError('');

      // Fetch campaign details
      const campaignRes = (await api.get(`/admin/email-campaigns/${campaignId}`)) as any;
      setCampaign(campaignRes);

      // Fetch stats
      const statsRes = (await api.get(`/admin/email-campaigns/${campaignId}/stats`)) as any;
      setStats(statsRes);

      // Fetch recipients
      const recipientUrl = recipientFilter
        ? `/admin/email-campaigns/${campaignId}/recipients/status/${recipientFilter}?page=${page}&size=${rowsPerPage}`
        : `/admin/email-campaigns/${campaignId}/recipients?page=${page}&size=${rowsPerPage}`;
      const recipientRes = (await api.get(recipientUrl)) as any;
      setRecipients(recipientRes.content || []);
    } catch (err) {
      setError('Failed to load campaign data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePauseCampaign = async () => {
    if (!campaignId) return;

    try {
      await api.patch(`/admin/email-campaigns/${campaignId}/pause`);
      setSuccess('Campaign paused successfully');
      setTimeout(() => fetchCampaignData(), 1500);
    } catch (err) {
      setError('Failed to pause campaign');
      console.error(err);
    }
  };

  const handleResumeCampaign = async () => {
    if (!campaignId) return;

    try {
      await api.patch(`/admin/email-campaigns/${campaignId}/resume`);
      setSuccess('Campaign resumed successfully');
      setTimeout(() => fetchCampaignData(), 1500);
    } catch (err) {
      setError('Failed to resume campaign');
      console.error(err);
    }
  };

  const handleDownloadReport = () => {
    if (!campaign || !recipients) return;

    const csvContent = [
      ['Email Campaign Report', campaign.campaignName],
      ['Status', campaign.status],
      ['Total Recipients', campaign.totalRecipients],
      ['Sent', campaign.sentCount],
      ['Failed', campaign.failedCount],
      ['Pending', campaign.pendingCount],
      ['Success Rate', `${campaign.successRate.toFixed(2)}%`],
      ['Created At', new Date(campaign.createdAt).toLocaleString()],
      [],
      ['Email', 'Customer Name', 'Status', 'Sent At', 'Error Message'],
      ...recipients.map((r) => [
        r.email,
        r.customerName,
        r.status,
        r.sentAt ? new Date(r.sentAt).toLocaleString() : '-',
        r.errorMessage || '-',
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `campaign-${campaign.id}-report.csv`;
    link.click();
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      DRAFT: 'default',
      SCHEDULED: 'info',
      SENDING: 'warning',
      COMPLETED: 'success',
      FAILED: 'error',
      PENDING: 'default',
      SENT: 'success',
      BOUNCED: 'error',
      COMPLAINED: 'error',
      UNSUBSCRIBED: 'warning',
    };
    return colors[status] || 'default';
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value));
    setPage(0);
  };

  if (loading && !campaign) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!campaign) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Campaign not found</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/admin/email-campaigns')} sx={{ mt: 2 }}>
          Back to Campaigns
        </Button>
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
              title={campaign.campaignName}
              subheader={`Campaign ID: ${campaign.id}`}
              action={
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={() => fetchCampaignData()}
                    disabled={loading}
                  >
                    Refresh
                  </Button>
                  {campaign.status === 'SENDING' && (
                    <Button
                      variant="outlined"
                      color="warning"
                      size="small"
                      startIcon={<PauseIcon />}
                      onClick={handlePauseCampaign}
                    >
                      Pause
                    </Button>
                  )}
                  {campaign.status === 'PAUSED' && (
                    <Button
                      variant="outlined"
                      color="success"
                      size="small"
                      startIcon={<PlayIcon />}
                      onClick={handleResumeCampaign}
                    >
                      Resume
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadReport}
                  >
                    Export
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<BackIcon />}
                    onClick={() => navigate('/admin/email-campaigns')}
                  >
                    Back
                  </Button>
                </Stack>
              }
            />
          </Card>
        </Grid>

        {/* Campaign Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Status
                  </Typography>
                  <Chip label={campaign.status} color={getStatusColor(campaign.status) as any} sx={{ mt: 1 }} />
                </Box>

                {campaign.status === 'SENDING' && stats && (
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                      Progress
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={stats.successRate}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                      <Typography variant="body2">{stats.successRate.toFixed(1)}%</Typography>
                    </Box>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Recipients
              </Typography>
              <Typography variant="h5">{campaign.totalRecipients}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Successfully Sent
              </Typography>
              <Typography variant="h5" sx={{ color: '#4caf50' }}>
                {campaign.sentCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Failed
              </Typography>
              <Typography variant="h5" sx={{ color: '#f44336' }}>
                {campaign.failedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h5" sx={{ color: '#ff9800' }}>
                {campaign.pendingCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Campaign Details */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Campaign Details"
              action={
                <Button size="small" onClick={() => setShowDetails(!showDetails)}>
                  {showDetails ? 'Hide' : 'Show'}
                </Button>
              }
            />
            {showDetails && (
              <CardContent>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Template
                    </Typography>
                    <Typography variant="body1">{campaign.templateName}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Subject
                    </Typography>
                    <Typography variant="body1">{campaign.subject}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Target Type
                    </Typography>
                    <Typography variant="body1">{campaign.targetType}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Created By
                    </Typography>
                    <Typography variant="body1">{campaign.createdByName}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Created At
                    </Typography>
                    <Typography variant="body1">{new Date(campaign.createdAt).toLocaleString()}</Typography>
                  </Box>
                  {campaign.scheduledAt && (
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Scheduled For
                      </Typography>
                      <Typography variant="body1">{new Date(campaign.scheduledAt).toLocaleString()}</Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            )}
          </Card>
        </Grid>

        {/* Recipients Table */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Recipients" />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                  Filter by Status
                </Typography>
                <Stack direction="row" spacing={1}>
                  {['', 'PENDING', 'SENT', 'FAILED', 'BOUNCED', 'COMPLAINED', 'UNSUBSCRIBED'].map((status) => (
                    <Chip
                      key={status}
                      label={status || 'All'}
                      onClick={() => {
                        setRecipientFilter(status);
                        setPage(0);
                      }}
                      variant={recipientFilter === status ? 'filled' : 'outlined'}
                      color={recipientFilter === status ? 'primary' : 'default'}
                    />
                  ))}
                </Stack>
              </Box>

              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Customer Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Sent At</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Error Message</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recipients.map((recipient) => (
                      <TableRow key={recipient.id} hover>
                        <TableCell>{recipient.email}</TableCell>
                        <TableCell>{recipient.customerName}</TableCell>
                        <TableCell>
                          <Chip label={recipient.status} color={getStatusColor(recipient.status) as any} size="small" />
                        </TableCell>
                        <TableCell>
                          {recipient.sentAt ? new Date(recipient.sentAt).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 300, wordBreak: 'break-word' }}>
                          {recipient.errorMessage ? (
                            <Typography variant="caption" color="error">
                              {recipient.errorMessage}
                            </Typography>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={recipients.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
