import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import { useLanguage } from './LanguageContext';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import logo from '../assets/img/ADMIN.png';
import heroImg from '../assets/img/hero.png';
import { auth } from '../firebase/config';
import { setAuthToken } from '../api';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    if (!auth) return; // Firebase non configurato
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        setAuthToken(token);
        localStorage.setItem('isAdmin', 'true');
        navigate('/admin/panel');
      }
    });
    return unsubscribe;
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!auth) {
      setError('Configurazione Firebase mancante');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      const token = await auth.currentUser.getIdToken();
      setAuthToken(token);
      localStorage.setItem('isAdmin', 'true');
      navigate('/admin/panel');
    } catch (err) {
      setError('Credenziali non valide');
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
          width: 400,
          maxWidth: '100%',
          minHeight: 400,
          backgroundColor: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          borderRadius: 0,
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
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          variant="outlined"
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              color: '#fff',
            },
            '& .MuiInputLabel-root': { color: '#fff' },
            '& fieldset': { borderRadius: 0 },
          }}
          InputLabelProps={{ style: { color: '#fff' } }}
          InputProps={{ style: { color: '#fff' } }}
        />
        <TextField
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          variant="outlined"
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              color: '#fff',
            },
            '& .MuiInputLabel-root': { color: '#fff' },
            '& fieldset': { borderRadius: 0 },
          }}
          InputLabelProps={{ style: { color: '#fff' } }}
          InputProps={{ style: { color: '#fff' } }}
        />
        <Button
          type="submit"
          variant="contained"
          sx={{
            backgroundColor: 'var(--red)',
            '&:hover': { backgroundColor: '#c62828' },
            borderRadius: 0,
          }}
        >
          Login
        </Button>
        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}
        <Button
          component={Link}
          to="/"
          variant="outlined"
          sx={{ mt: 1, color: 'var(--yellow)', borderColor: 'var(--yellow)', borderRadius: 0 }}
        >
          {t('nav.home')}
        </Button>
      </Paper>
    </Box>
  );
};

export default AdminLogin;
