import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import logo from '../assets/img/djscovery-logo.png';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('isAdmin') === 'true') {
      navigate('/admin/panel');
    }
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const expected = import.meta.env.VITE_ADMIN_PASSWORD || 'admin';
    if (password === expected) {
      localStorage.setItem('isAdmin', 'true');
      navigate('/admin/panel');
    } else {
      setError('Password errata');
    }
  };

  return (
    <Box
      sx={{
        textAlign: 'center',
        minHeight: 'calc(100vh - 200px)',
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
          backgroundColor: 'rgba(0,0,0,0.3)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          borderRadius: 3,
        }}
      >
        <img
          src={logo}
          alt="Djscovery logo"
          style={{ width: '150px', alignSelf: 'center', marginBottom: '1rem' }}
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
