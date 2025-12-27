import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  Grid,
  CircularProgress,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Paper,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
  Visibility as PreviewIcon,
  Mail as MailIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

interface EmailTemplate {
  id: number;
  templateKey: string;
  templateName: string;
  subject: string;
  bodyHtml: string;
  isActive: boolean;
}

interface Variable {
  name: string;
  description: string;
}

export default function EmailTemplateEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [testEmail, setTestEmail] = useState('');
  const [previewModal, setPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState({ subject: '', body: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch template
  const fetchTemplate = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${API_BASE}/api/admin/email-templates/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      setTemplate(response.data);
      setSubject(response.data.subject);
      setBodyHtml(response.data.bodyHtml);
      setIsActive(response.data.isActive);
    } catch (error) {
      setError('Failed to fetch template');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available variables
  const fetchVariables = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/admin/email-templates/config/available-variables`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setVariables(response.data);
    } catch (error) {
      console.error('Failed to fetch variables:', error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTemplate();
    }
    fetchVariables();
  }, [id]);

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await axios.put(
        `${API_BASE}/api/admin/email-templates/${id}`,
        {
          subject,
          bodyHtml,
          isActive,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      setSuccess('Template saved successfully!');
      setTimeout(() => navigate('/admin/email-templates'), 2000);
    } catch (error) {
      setError('Failed to save template');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Handle preview
  const handlePreview = async () => {
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

      setPreviewData({
        subject: response.data.subject,
        body: response.data.body,
      });
      setPreviewModal(true);
    } catch (error) {
      setError('Failed to preview template');
      console.error(error);
    }
  };

  // Handle send test email
  const handleSendTest = async () => {
    if (!testEmail) {
      setError('Please enter an email address');
      return;
    }

    try {
      await axios.post(
        `${API_BASE}/api/admin/email-templates/${id}/send-test`,
        {
          recipientEmail: testEmail,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      setSuccess(`Test email sent to ${testEmail}`);
      setTestEmail('');
    } catch (error) {
      setError('Failed to send test email');
      console.error(error);
    }
  };

  // Insert variable into body
  const insertVariable = (variableName: string) => {
    const newBody = bodyHtml + ` {{${variableName}}}`;
    setBodyHtml(newBody);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* Main Form */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardHeader title={`Edit: ${template?.templateName || 'Email Template'}`} />
            <CardContent>
              <Stack spacing={2}>
                {/* Template Name (Read-only) */}
                <TextField
                  label="Template Name"
                  value={template?.templateName || ''}
                  disabled
                  fullWidth
                  size="small"
                />

                {/* Subject */}
                <TextField
                  label="Email Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  fullWidth
                  placeholder='e.g., Order Confirmed – {{orderId}}'
                  required
                />

                {/* Body HTML */}
                <TextField
                  label="Email Body (HTML)"
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  fullWidth
                  multiline
                  rows={15}
                  placeholder="Enter HTML email body"
                  sx={{ fontFamily: 'monospace' }}
                  required
                />

                {/* Active toggle */}
                <FormControlLabel
                  control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
                  label="Active"
                />

                {/* Action Buttons */}
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                    color="primary"
                  >
                    {saving ? 'Saving...' : 'Save Template'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<PreviewIcon />}
                    onClick={handlePreview}
                    disabled={saving || !id}
                  >
                    Preview
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<BackIcon />}
                    onClick={() => navigate('/admin/email-templates')}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Panel - Variables & Test Email */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={2}>
            {/* Available Variables */}
            <Card>
              <CardHeader title="Available Variables" subheader="Click to insert" />
              <CardContent>
                <List dense>
                  {variables.map((variable) => (
                    <ListItem
                      key={variable.name}
                      button
                      onClick={() => insertVariable(variable.name)}
                      sx={{
                        mb: 1,
                        backgroundColor: '#f5f5f5',
                        borderRadius: 1,
                        '&:hover': { backgroundColor: '#e0e0e0' },
                      }}
                    >
                      <ListItemText
                        primary={
                          <code style={{ backgroundColor: '#fff3e0', padding: '2px 6px', borderRadius: '3px' }}>
                            {`{{${variable.name}}}`}
                          </code>
                        }
                        secondary={variable.description}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* Send Test Email */}
            <Card>
              <CardHeader title="Send Test Email" />
              <CardContent>
                <Stack spacing={2}>
                  <TextField
                    type="email"
                    label="Test Email Address"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    fullWidth
                    size="small"
                    placeholder="test@example.com"
                  />
                  <Button variant="contained" startIcon={<MailIcon />} onClick={handleSendTest} fullWidth>
                    Send Test Email
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Preview Modal */}
      <Dialog open={previewModal} onClose={() => setPreviewModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Email Preview</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Box>
              <Box sx={{ fontSize: '0.875rem', fontWeight: 'bold', mb: 1, color: 'text.secondary' }}>
                Subject
              </Box>
              <Box sx={{ p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>{previewData.subject}</Box>
            </Box>

            <Divider />

            <Box>
              <Box sx={{ fontSize: '0.875rem', fontWeight: 'bold', mb: 1, color: 'text.secondary' }}>
                Email Body
              </Box>
              <Paper
                sx={{
                  p: 2,
                  backgroundColor: '#f5f5f5',
                  maxHeight: 400,
                  overflow: 'auto',
                }}
              >
                <Box
                  dangerouslySetInnerHTML={{ __html: previewData.body }}
                  sx={{
                    '& img': { maxWidth: '100%' },
                    '& table': { width: '100%', borderCollapse: 'collapse' },
                    '& td': { padding: '8px', border: '1px solid #ddd' },
                  }}
                />
              </Paper>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
