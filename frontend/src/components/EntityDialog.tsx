import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Alert,
  CircularProgress,
  Slide,
  Divider,
  Paper,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

// Types
export type FieldType = 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'switch';

export interface FormFieldConfig<T> {
  name: keyof T;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  rows?: number;
  options?: Array<{ value: string | number; label: string }>;
  gridSize?: { xs?: number; md?: number };
  disabled?: (isEditing: boolean) => boolean;
  validation?: (value: any) => string | null;
  hidden?: boolean;
}

export interface EntityDialogProps<T> {
  open: boolean;
  onClose: () => void;
  isEditing: boolean;
  title?: string;
  entity?: T | null;
  fields: FormFieldConfig<T>[];
  initialValues: Partial<T>;
  onSubmit: (data: Partial<T>) => Promise<void>;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg';
  submitButtonText?: string;
  cancelButtonText?: string;
  layout?: 'column' | 'grid';
  loading?: boolean;
  error?: string | null;
  onError?: (error: Error) => void;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function EntityDialog<T extends Record<string, any>>({
  open,
  onClose,
  isEditing,
  title,
  entity,
  fields,
  initialValues,
  onSubmit,
  maxWidth = 'md',
  submitButtonText,
  cancelButtonText = 'Cancel',
  layout = 'grid',
  loading = false,
  error = null,
  onError,
}: EntityDialogProps<T>) {
  const [formData, setFormData] = useState<Partial<T>>(initialValues);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(error);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (entity) {
        setFormData(entity as Partial<T>);
      } else {
        setFormData(initialValues);
      }
      setFormErrors({});
      setSubmitError(null);
    }
  }, [open, entity, initialValues]);

  // Update error when prop changes
  useEffect(() => {
    setSubmitError(error);
  }, [error]);

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof T, string>> = {};

    fields.forEach((field) => {
      if (field.hidden) return;

      const value = formData[field.name];

      // Check required fields
      if (field.required) {
        if (value === undefined || value === null || value === '') {
          errors[field.name] = `${field.label} is required`;
        }
      }

      // Run custom validation
      if (value && field.validation) {
        const validationError = field.validation(value);
        if (validationError) {
          errors[field.name] = validationError;
        }
      }

      // Type-specific validation
      if (value && field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors[field.name] = 'Invalid email format';
        }
      }

      // Password validation for create mode only
      if (field.type === 'password' && !isEditing && field.required) {
        if (!value) {
          errors[field.name] = `${field.label} is required`;
        }
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFieldChange = (fieldName: keyof T, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    // Clear error for this field when user starts typing
    if (formErrors[fieldName]) {
      setFormErrors((prev) => ({
        ...prev,
        [fieldName]: undefined,
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitError(null);
      await onSubmit(formData);
      handleClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setSubmitError(errorMessage);
      onError?.(err);
    }
  };

  const handleClose = () => {
    setFormData(initialValues);
    setFormErrors({});
    setSubmitError(null);
    onClose();
  };

  const renderField = (field: FormFieldConfig<T>) => {
    if (field.hidden) return null;

    const value = formData[field.name];
    const error = formErrors[field.name];
    const isDisabled = field.disabled?.(isEditing) || false;

    const commonFieldProps = {
      fullWidth: true,
      label: field.label,
      error: !!error,
      helperText: error || field.helperText,
      disabled: loading || isDisabled,
      variant: 'outlined' as const,
      size: 'small' as const,
      sx: {
        '& .MuiOutlinedInput-root': {
          borderRadius: '12px',
          backgroundColor: '#fafbfc',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: '#f5f7fa',
            '& fieldset': {
              borderColor: '#667eea',
              borderWidth: '1.5px',
            },
          },
          '&.Mui-focused': {
            backgroundColor: '#fff',
            boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.12)',
            '& fieldset': {
              borderColor: '#667eea',
              borderWidth: '2px',
            },
          },
          '&.Mui-error': {
            backgroundColor: '#fff5f5',
          },
          '& fieldset': {
            borderColor: '#d0d7e8',
            transition: 'all 0.3s ease',
          },
        },
        '& .MuiInputLabel-root': {
          fontSize: '0.95rem',
          fontWeight: 600,
          color: '#555',
          transition: 'all 0.3s ease',
          '&.Mui-focused': {
            color: '#667eea',
            fontWeight: 700,
          },
        },
        '& .MuiFormHelperText-root': {
          fontSize: '0.8rem',
          marginTop: '6px',
          fontWeight: 500,
        },
      },
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
        return (
          <TextField
            key={String(field.name)}
            type={field.type === 'text' ? 'text' : field.type}
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
            placeholder={field.placeholder}
            {...commonFieldProps}
          />
        );

      case 'textarea':
        return (
          <TextField
            key={String(field.name)}
            multiline
            rows={field.rows || 3}
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
            placeholder={field.placeholder}
            {...commonFieldProps}
          />
        );

      case 'select':
        return (
          <FormControl
            key={String(field.name)}
            fullWidth
            error={!!error}
            disabled={loading || isDisabled}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: '#fafbfc',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: '#f5f7fa',
                  '& fieldset': {
                    borderColor: '#667eea',
                    borderWidth: '1.5px',
                  },
                },
                '&.Mui-focused': {
                  backgroundColor: '#fff',
                  boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.12)',
                  '& fieldset': {
                    borderColor: '#667eea',
                    borderWidth: '2px',
                  },
                },
                '&.Mui-error': {
                  backgroundColor: '#fff5f5',
                },
                '& fieldset': {
                  borderColor: '#d0d7e8',
                  transition: 'all 0.3s ease',
                },
              },
              '& .MuiInputLabel-root': {
                fontSize: '0.95rem',
                fontWeight: 600,
                color: '#555',
                transition: 'all 0.3s ease',
                '&.Mui-focused': {
                  color: '#667eea',
                  fontWeight: 700,
                },
              },
            }}
          >
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={value || ''}
              label={field.label}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
            >
              {field.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {error && <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>{error}</Box>}
          </FormControl>
        );

      case 'checkbox':
        return (
          <Box
            key={String(field.name)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: '#fafbfc',
              border: '1.5px solid #d0d7e8',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: loading || isDisabled ? 'not-allowed' : 'pointer',
              '&:hover': {
                backgroundColor: '#f0f2f9',
                borderColor: '#667eea',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.1)',
              },
            }}
          >
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              disabled={loading || isDisabled}
              style={{
                cursor: loading || isDisabled ? 'not-allowed' : 'pointer',
                accentColor: '#667eea',
                width: '20px',
                height: '20px',
              }}
            />
            <span style={{ fontWeight: 600, color: '#555', fontSize: '0.95rem' }}>{field.label}</span>
          </Box>
        );

      case 'switch':
        return (
          <Box
            key={String(field.name)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: '12px',
              backgroundColor: '#fafbfc',
              border: '1.5px solid #d0d7e8',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: '#f0f2f9',
                borderColor: '#667eea',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.1)',
              },
            }}
          >
            <span style={{ fontWeight: 600, color: '#555', fontSize: '0.95rem' }}>{field.label}</span>
            <Switch
              checked={value || false}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              disabled={loading || isDisabled}
              sx={{
                '& .MuiSwitch-switchBase': {
                  transition: 'all 0.3s ease',
                  '&.Mui-checked': {
                    color: '#667eea',
                    '& + .MuiSwitch-track': {
                      backgroundColor: '#667eea',
                      boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.1)',
                    },
                  },
                },
              }}
            />
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        },
      }}
    >
      {/* Header Section */}
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontWeight: 700,
          fontSize: '1.5rem',
          p: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.3) 0%, transparent 100%)',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              animation: isEditing ? 'pulse 2s infinite' : 'bounce 0.6s ease-out',
            }}
          >
            {isEditing ? (
              <CheckCircleIcon sx={{ fontSize: '1.8rem', color: '#10b981' }} />
            ) : (
              <Box sx={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fff' }}>+</Box>
            )}
          </Box>
          <Box>
            <Box sx={{ fontSize: '0.8rem', opacity: 0.85, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              {isEditing ? '✏️ Editing' : '➕ Creating New'}
            </Box>
            <Box sx={{ fontSize: '1.35rem', fontWeight: 700, mt: 0.4, letterSpacing: '-0.5px' }}>
              {title || (isEditing ? 'Edit Item' : 'New Item')}
            </Box>
          </Box>
        </Box>
        <Button
          size="small"
          onClick={handleClose}
          disabled={loading}
          sx={{
            color: 'white',
            minWidth: 'auto',
            p: 1.2,
            borderRadius: '8px',
            position: 'relative',
            zIndex: 1,
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.15)',
              transform: 'rotate(90deg) scale(1.1)',
            },
          }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      {/* Content Section */}
      <DialogContent
        sx={{
          pt: 4.5,
          pb: 2,
          px: 3,
          flex: 1,
          overflow: 'auto',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #f8f9fc 100%)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(102, 126, 234, 0.2) 50%, transparent 100%)',
            pointerEvents: 'none',
          },
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '4px',
            border: '2px solid transparent',
            backgroundClip: 'padding-box',
            '&:hover': {
              background: 'linear-gradient(135deg, #5568d3 0%, #6d3b91 100%)',
            },
          },
        }}
      >
        {/* Error Alert */}
        {submitError && (
          <Alert
            severity="error"
            variant="filled"
            icon={<ErrorIcon />}
            sx={{
              mb: 2.5,
              borderRadius: '12px',
              fontSize: '0.95rem',
              fontWeight: 500,
              backgroundColor: '#ef5350',
              animation: 'slideDown 0.3s ease-out',
            }}
            onClose={() => setSubmitError(null)}
          >
            {submitError}
          </Alert>
        )}

        {/* Form Fields */}
        <Box
          component={Paper}
          elevation={0}
          sx={{
            p: 3,
            borderRadius: '16px',
            background: 'white',
            border: '1px solid rgba(102, 126, 234, 0.12)',
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.08)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 6px 24px rgba(102, 126, 234, 0.12)',
              border: '1px solid rgba(102, 126, 234, 0.2)',
            },
          }}
        >
          {layout === 'column' ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {fields.map((field, index) => (
                <Box key={String(field.name)}>
                  {renderField(field)}
                  {index < fields.length - 1 && (
                    <Divider sx={{ mt: 2.5, opacity: 0.3 }} />
                  )}
                </Box>
              ))}
            </Box>
          ) : (
            <Grid container spacing={2.5}>
              {fields.map((field) => (
                <Grid
                  item
                  key={String(field.name)}
                  xs={field.gridSize?.xs || 12}
                  md={field.gridSize?.md || 6}
                >
                  {renderField(field)}
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </DialogContent>

      {/* Actions Section */}
      <DialogActions
        sx={{
          p: 3,
          pt: 2.5,
          gap: 2,
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.8), #fafbfc)',
          borderTop: '1px solid rgba(102, 126, 234, 0.1)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
          sx={{
            borderColor: '#e0e0e0',
            color: '#666',
            fontWeight: 600,
            borderRadius: '10px',
            textTransform: 'none',
            fontSize: '0.95rem',
            padding: '11px 28px',
            transition: 'all 0.3s ease',
            border: '1.5px solid',
            '&:hover': {
              backgroundColor: '#f5f5f5',
              borderColor: '#667eea',
              color: '#667eea',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
            },
          }}
        >
          {cancelButtonText}
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{
            background: loading ? 'linear-gradient(135deg, #999 0%, #777 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontWeight: 700,
            px: 4,
            py: 1.4,
            borderRadius: '10px',
            textTransform: 'none',
            fontSize: '0.95rem',
            boxShadow: loading ? '0 4px 12px rgba(0,0,0,0.1)' : '0 8px 24px rgba(102, 126, 234, 0.35)',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 0,
              height: 0,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              transform: 'translate(-50%, -50%)',
              transition: 'width 0.6s, height 0.6s',
            },
            '&:hover::before': {
              width: '400px',
              height: '400px',
            },
            '&:hover': {
              boxShadow: loading ? 'none' : '0 14px 35px rgba(102, 126, 234, 0.45)',
              transform: loading ? 'none' : 'translateY(-4px)',
            },
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <CircularProgress size={20} color="inherit" />
              <span>Saving...</span>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>{submitButtonText || (isEditing ? 'Update' : 'Create')}</span>
              {isEditing ? '✓' : '→'}
            </Box>
          )}
        </Button>
      </DialogActions>

      {/* Global Styles for animations */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </Dialog>
  );
}
