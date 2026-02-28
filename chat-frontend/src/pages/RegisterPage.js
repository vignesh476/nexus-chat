import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Paper,
  IconButton,
  InputAdornment,
  LinearProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  Lock,
  PersonAdd,
  Check,
} from '@mui/icons-material';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword && confirmPassword !== '';

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await authAPI.register({ username, password });
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError('Registration failed. Username might already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%)',
        pointerEvents: 'none',
      },
    }}>
      <Container component="main" maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper 
          elevation={0}
          sx={{ 
            padding: 6,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: 4,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
            animation: 'fadeInUp 0.6s ease-out',
            '@keyframes fadeInUp': {
              from: { opacity: 0, transform: 'translateY(30px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          {/* Logo/Brand Section */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)',
            }}>
              <PersonAdd sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography 
              component="h1" 
              variant="h3" 
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              Join Us
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '1.1rem',
              }}
            >
              Create your account to start chatting
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleRegister} sx={{ mt: 3 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  color: 'white',
                  '& fieldset': {
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    border: '2px solid rgba(255, 255, 255, 0.8)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: 'white',
                  },
                },
                '& .MuiInputBase-input': {
                  color: 'white',
                },
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  color: 'white',
                  '& fieldset': {
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    border: '2px solid rgba(255, 255, 255, 0.8)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: 'white',
                  },
                },
                '& .MuiInputBase-input': {
                  color: 'white',
                },
              }}
            />
            
            {/* Password Strength Indicator */}
            {password && (
              <Box sx={{ mt: 1, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Password Strength:
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: passwordStrength < 50 ? '#ef4444' : passwordStrength < 75 ? '#f59e0b' : '#10b981',
                      fontWeight: 600,
                    }}
                  >
                    {passwordStrength < 50 ? 'Weak' : passwordStrength < 75 ? 'Medium' : 'Strong'}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={passwordStrength} 
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: passwordStrength < 50 ? '#ef4444' : passwordStrength < 75 ? '#f59e0b' : '#10b981',
                      borderRadius: 3,
                    },
                  }}
                />
              </Box>
            )}
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {passwordsMatch && (
                        <Check sx={{ color: '#10b981', fontSize: 20 }} />
                      )}
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </Box>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  color: 'white',
                  '& fieldset': {
                    border: `1px solid ${passwordsMatch ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.3)'}`,
                  },
                  '&:hover fieldset': {
                    border: `1px solid ${passwordsMatch ? 'rgba(16, 185, 129, 0.7)' : 'rgba(255, 255, 255, 0.5)'}`,
                  },
                  '&.Mui-focused fieldset': {
                    border: `2px solid ${passwordsMatch ? '#10b981' : 'rgba(255, 255, 255, 0.8)'}`,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: 'white',
                  },
                },
                '& .MuiInputBase-input': {
                  color: 'white',
                },
              }}
            />
            
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 2,
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fecaca',
                  '& .MuiAlert-icon': {
                    color: '#fca5a5',
                  },
                }}
              >
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert 
                severity="success" 
                sx={{ 
                  mt: 2,
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#a7f3d0',
                  '& .MuiAlert-icon': {
                    color: '#6ee7b7',
                  },
                }}
              >
                {success}
              </Alert>
            )}
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || !passwordsMatch || passwordStrength < 50}
              sx={{ 
                mt: 4, 
                mb: 3,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                color: 'white',
                boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover:not(:disabled)': {
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 35px rgba(16, 185, 129, 0.4)',
                },
                '&:disabled': {
                  background: 'rgba(255, 255, 255, 0.3)',
                  color: 'rgba(255, 255, 255, 0.7)',
                },
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography 
                component={Link} 
                to="/login" 
                sx={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    color: 'white',
                    textDecoration: 'underline',
                  },
                }}
              >
                Already have an account? Sign in
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterPage;
