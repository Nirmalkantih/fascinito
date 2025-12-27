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
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as PreviewIcon,
  Mail as MailIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

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

  // Fetch email templates
  const fetchTemplates = async (pageNum: number = 0) => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(
        `${API_BASE}/api/admin/email-templates?page=${pageNum}&size=${rowsPerPage}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      setTemplates(response.data.content);
      setTotal(response.data.totalElements);
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
      const response = await axios.get(`${API_BASE}/api/admin/email-templates/stats/summary`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setStats(response.data);
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
      const response = await axios.post(
        `${API_BASE}/api/admin/email-templates/${id}/preview`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      // Show preview in new window
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write(response.data.body);
        previewWindow.document.close();
      }
    } catch (error) {
      setError('Failed to preview template');
      console.error(error);
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
    </Box>
  );
}
