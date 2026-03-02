import React from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Button,
  Card,
  CardContent,
  Divider,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled components for better mobile experience
const MobileCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: 16,
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  [theme.breakpoints.down('md')]: {
    borderRadius: 12,
    margin: theme.spacing(1, 0),
  },
}));

const MobileSwitch = styled(Switch)(({ theme }) => ({
  padding: 12,
  '& .MuiSwitch-thumb': {
    width: 24,
    height: 24,
  },
  '& .MuiSwitch-track': {
    borderRadius: 12,
    height: 24,
  },
  [theme.breakpoints.down('md')]: {
    padding: 16,
    '& .MuiSwitch-thumb': {
      width: 28,
      height: 28,
    },
    '& .MuiSwitch-track': {
      height: 28,
    },
  },
}));

const MobileFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
  margin: theme.spacing(1, 0),
  '& .MuiFormControlLabel-label': {
    fontSize: '1rem',
    fontWeight: 500,
  },
  [theme.breakpoints.down('md')]: {
    margin: theme.spacing(1.5, 0),
    '& .MuiFormControlLabel-label': {
      fontSize: '1.1rem',
    },
  },
}));

const MobileSelect = styled(Select)(({ theme }) => ({
  '& .MuiSelect-select': {
    padding: theme.spacing(1.5, 2),
  },
  [theme.breakpoints.down('md')]: {
    '& .MuiSelect-select': {
      padding: theme.spacing(2, 2.5),
      fontSize: '1.1rem',
    },
  },
}));

const MobileSlider = styled(Slider)(({ theme }) => ({
  '& .MuiSlider-thumb': {
    width: 24,
    height: 24,
  },
  '& .MuiSlider-track': {
    height: 6,
  },
  '& .MuiSlider-rail': {
    height: 6,
  },
  [theme.breakpoints.down('md')]: {
    '& .MuiSlider-thumb': {
      width: 32,
      height: 32,
    },
    '& .MuiSlider-track': {
      height: 8,
    },
    '& .MuiSlider-rail': {
      height: 8,
    },
  },
}));

const MobileButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: theme.spacing(1.5, 3),
  fontWeight: 600,
  textTransform: 'none',
  [theme.breakpoints.down('md')]: {
    borderRadius: 16,
    padding: theme.spacing(2, 4),
    fontSize: '1.1rem',
    minHeight: 48,
  },
}));

const MobileSettingsSection = ({ 
  title, 
  children, 
  icon, 
  description,
  actions 
}) => {
  const theme = useTheme();
  
  return (
    <MobileCard>
      <CardContent sx={{ p: { xs: 3, md: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {icon && (
            <Box sx={{ mr: 2, color: 'primary.main' }}>
              {icon}
            </Box>
          )}
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '1.2rem', md: '1.1rem' }
              }}
            >
              {title}
            </Typography>
            {description && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {description}
              </Typography>
            )}
          </Box>
        </Box>
        
        {children}
        
        {actions && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'flex-end'
            }}>
              {actions}
            </Box>
          </>
        )}
      </CardContent>
    </MobileCard>
  );
};

const MobileColorPicker = ({ 
  label, 
  value, 
  onChange, 
  fullWidth = false 
}) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Box
        sx={{
          position: 'relative',
          width: fullWidth ? '100%' : 120,
          height: { xs: 56, md: 48 },
          borderRadius: 2,
          border: '2px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.main',
          },
        }}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            cursor: 'pointer',
            opacity: 0,
          }}
        />
        <Box
          sx={{
            width: '100%',
            height: '100%',
            backgroundColor: value,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            fontWeight: 600,
            fontSize: { xs: '0.9rem', md: '0.8rem' },
          }}
        >
          {value}
        </Box>\n      </Box>\n    </Box>\n  );\n};\n\nexport {\n  MobileCard,\n  MobileSwitch,\n  MobileFormControlLabel,\n  MobileSelect,\n  MobileSlider,\n  MobileButton,\n  MobileSettingsSection,\n  MobileColorPicker,\n};