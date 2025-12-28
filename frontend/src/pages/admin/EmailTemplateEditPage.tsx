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
  Paper,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
  Visibility as PreviewIcon,
  Mail as MailIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';

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
  const [selectedVariable, setSelectedVariable] = useState('');
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
      const response = await api.get(`/admin/email-templates/${id}`);

      const template = response as any;
      setTemplate(template);
      setSubject(template.subject);
      setBodyHtml(template.bodyHtml);
      setIsActive(template.isActive);
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
      const response = await api.get(
        `/admin/email-templates/config/available-variables`
      );
      setVariables((response as any) || []);
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
      await api.put(
        `/admin/email-templates/${id}`,
        {
          subject,
          bodyHtml,
          isActive,
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
      const response = await api.post(
        `/admin/email-templates/${id}/preview`,
        {}
      );

      const data = response as any;
      setPreviewData({
        subject: data.subject,
        body: data.body,
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
      await api.post(
        `/admin/email-templates/${id}/send-test`,
        {
          recipientEmail: testEmail,
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
              <CardHeader title="Available Variables" subheader="Select to insert" />
              <CardContent>
                <Stack spacing={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="variable-select-label">Select Variable</InputLabel>
                    <Select
                      labelId="variable-select-label"
                      id="variable-select"
                      value={selectedVariable}
                      label="Select Variable"
                      onChange={(e) => {
                        setSelectedVariable(e.target.value);
                        insertVariable(e.target.value);
                        setSelectedVariable('');
                      }}
                    >
                      {variables.map((variable) => (
                        <MenuItem key={variable.name} value={variable.name}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <code style={{ fontWeight: 'bold' }}>{`{{${variable.name}}}`}</code>
                            <span style={{ fontSize: '0.85em', color: '#666' }}>{variable.description}</span>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Variable Info Box */}
                  {selectedVariable === '' && variables.length > 0 && (
                    <Box
                      sx={{
                        p: 1.5,
                        backgroundColor: '#f0f4ff',
                        borderRadius: 1,
                        borderLeft: '4px solid #6366f1',
                        fontSize: '0.875rem',
                        color: '#1e40af',
                      }}
                    >
                      <strong>How to use:</strong>
                      <br />
                      Select a variable from the dropdown above to automatically insert it into your email template.
                      You can also manually type variables in the format: {`{{variableName}}`}
                    </Box>
                  )}
                </Stack>
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
