import {
  Box,
  IconButton,
  Select,
  MenuItem,
  Typography,
  alpha,
  useTheme,
  Paper
} from '@mui/material'
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon
} from '@mui/icons-material'

interface PaginationComponentProps {
  page: number
  rowsPerPage: number
  totalElements: number
  onPageChange: (newPage: number) => void
  onRowsPerPageChange: (newSize: number) => void
  rowsPerPageOptions?: number[]
}

export default function PaginationComponent({
  page,
  rowsPerPage,
  totalElements,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [5, 10, 25, 50]
}: PaginationComponentProps) {
  const theme = useTheme()
  const totalPages = Math.ceil(totalElements / rowsPerPage)
  const startIndex = page * rowsPerPage + 1
  const endIndex = Math.min((page + 1) * rowsPerPage, totalElements)

  const handleFirstPage = () => onPageChange(0)
  const handlePrevPage = () => onPageChange(Math.max(0, page - 1))
  const handleNextPage = () => onPageChange(Math.min(totalPages - 1, page + 1))
  const handleLastPage = () => onPageChange(totalPages - 1)

  return (
    <Paper
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 2.5,
        borderRadius: 2,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        backdropFilter: 'blur(8px)',
        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`
      }}
      elevation={0}
    >
      {/* Left Section: Rows Per Page */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: theme.palette.text.secondary,
            whiteSpace: 'nowrap'
          }}
        >
          Rows per page:
        </Typography>
        <Select
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
          size="small"
          sx={{
            minWidth: 70,
            borderRadius: 1,
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            '& .MuiSelect-select': {
              py: 1,
              px: 1.5,
              fontSize: '0.9rem',
              fontWeight: 600,
              color: theme.palette.primary.main
            },
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.12)
            },
            '&.Mui-focused': {
              backgroundColor: alpha(theme.palette.primary.main, 0.12),
              borderColor: theme.palette.primary.main
            }
          }}
        >
          {rowsPerPageOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {/* Center Section: Page Info */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            minWidth: '120px',
            textAlign: 'center'
          }}
        >
          {startIndex}-{endIndex} of {totalElements}
        </Typography>
      </Box>

      {/* Right Section: Navigation Buttons */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          onClick={handleFirstPage}
          disabled={page === 0}
          size="small"
          sx={{
            color: page === 0 ? theme.palette.action.disabled : theme.palette.primary.main,
            backgroundColor: page === 0 ? 'transparent' : alpha(theme.palette.primary.main, 0.08),
            '&:hover': {
              backgroundColor: page === 0 ? 'transparent' : alpha(theme.palette.primary.main, 0.15)
            },
            transition: 'all 0.3s ease'
          }}
          title="First page"
        >
          <FirstPageIcon sx={{ fontSize: '1.2rem' }} />
        </IconButton>

        <IconButton
          onClick={handlePrevPage}
          disabled={page === 0}
          size="small"
          sx={{
            color: page === 0 ? theme.palette.action.disabled : theme.palette.primary.main,
            backgroundColor: page === 0 ? 'transparent' : alpha(theme.palette.primary.main, 0.08),
            '&:hover': {
              backgroundColor: page === 0 ? 'transparent' : alpha(theme.palette.primary.main, 0.15)
            },
            transition: 'all 0.3s ease'
          }}
          title="Previous page"
        >
          <PrevIcon sx={{ fontSize: '1.2rem' }} />
        </IconButton>

        {/* Page Number Display */}
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            minWidth: '50px',
            textAlign: 'center',
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main
          }}
        >
          {page + 1} / {totalPages}
        </Typography>

        <IconButton
          onClick={handleNextPage}
          disabled={page >= totalPages - 1}
          size="small"
          sx={{
            color: page >= totalPages - 1 ? theme.palette.action.disabled : theme.palette.primary.main,
            backgroundColor: page >= totalPages - 1 ? 'transparent' : alpha(theme.palette.primary.main, 0.08),
            '&:hover': {
              backgroundColor: page >= totalPages - 1 ? 'transparent' : alpha(theme.palette.primary.main, 0.15)
            },
            transition: 'all 0.3s ease'
          }}
          title="Next page"
        >
          <NextIcon sx={{ fontSize: '1.2rem' }} />
        </IconButton>

        <IconButton
          onClick={handleLastPage}
          disabled={page >= totalPages - 1}
          size="small"
          sx={{
            color: page >= totalPages - 1 ? theme.palette.action.disabled : theme.palette.primary.main,
            backgroundColor: page >= totalPages - 1 ? 'transparent' : alpha(theme.palette.primary.main, 0.08),
            '&:hover': {
              backgroundColor: page >= totalPages - 1 ? 'transparent' : alpha(theme.palette.primary.main, 0.15)
            },
            transition: 'all 0.3s ease'
          }}
          title="Last page"
        >
          <LastPageIcon sx={{ fontSize: '1.2rem' }} />
        </IconButton>
      </Box>
    </Paper>
  )
}
