import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import logo from '../assets/img/ADMIN.png';
import heroImg from '../assets/img/hero.png';
import { login } from '../api';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('isAdmin') === 'true') {
      navigate('/admin/panel');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(password);
      localStorage.setItem('isAdmin', 'true');
      navigate('/admin/panel');
    } catch (err) {
      setError('Password errata');
    }
  };

  return (
    <Box
      sx={{
        textAlign: 'center',
        minHeight: '100vh',
        backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${heroImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          width: '100%',
          maxWidth: 400,
          backgroundColor: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          borderRadius: 3,
        }}
      >
        <img
          src={logo}
          alt="Admin logo"
          style={{ width: '200px', alignSelf: 'center', marginBottom: '1rem' }}
        />
        <Typography variant="h5" gutterBottom>
          Admin Login
        </Typography>
        <TextField
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          variant="outlined"
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': { color: '#fff' },
            '& .MuiInputLabel-root': { color: '#fff' },
          }}
          InputLabelProps={{ style: { color: '#fff' } }}
          InputProps={{ style: { color: '#fff' } }}
        />
        <Button type="submit" variant="contained" sx={{ backgroundColor: 'var(--red)', '&:hover': { backgroundColor: '#c62828' } }}>
          Login
        </Button>
        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default AdminLogin;
