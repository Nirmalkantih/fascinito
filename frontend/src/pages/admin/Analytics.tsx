import { Box, Typography, Paper } from '@mui/material';

export default function Analytics() {
  return (
    <Box>
      <Typography 
        variant="h3" 
        gutterBottom 
        sx={{ 
          fontWeight: 700,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 3
        }}
      >
        Analytics & Reports
      </Typography>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">
          Analytics page coming soon...
        </Typography>
      </Paper>
    </Box>
  );
}
