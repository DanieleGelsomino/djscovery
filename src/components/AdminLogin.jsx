// src/components/AdminLogin.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Box, Button, Paper, TextField, Typography,
    InputAdornment, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, CircularProgress
} from '@mui/material';
import { useLanguage } from './LanguageContext';
import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    sendPasswordResetEmail
} from 'firebase/auth';
import logo from '../assets/img/ADMIN.png';
import heroImg from '../assets/img/hero.png';
import { auth } from '../firebase/config';
import { setAuthToken } from '../api';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [resetEmail, setResetEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [checking, setChecking] = useState(true);
    const [resetOpen, setResetOpen] = useState(false);

    const navigate = useNavigate();
    const { t } = useLanguage();

    // Se l'utente è loggato, verifica che sia admin prima di farlo entrare
    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setChecking(false);
            setError('');
            setInfo('');
            if (!user) return;

            try {
                const idToken = await user.getIdToken(/* forceRefresh */ true);
                const tokenResult = await user.getIdTokenResult();
                const isAdmin = !!tokenResult.claims?.admin;

                // (facoltativo) invia il token al backend
                setAuthToken(idToken);

                if (isAdmin) {
                    localStorage.setItem('isAdmin', 'true'); // solo per UI hints; non è sicurezza
                    navigate('/admin/panel');
                } else {
                    // Non admin: esce e redirect
                    localStorage.removeItem('isAdmin');
                    await auth.signOut();
                    setError('Accesso negato: non hai permessi amministratore.');
                    navigate('/');
                }
            } catch (e) {
                setError('Errore nella verifica dei permessi.');
            }
        });
        return unsubscribe;
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!auth) {
            setError('Configurazione Firebase mancante');
            return;
        }
        setSubmitting(true);
        setError('');
        setInfo('');
        try {
            await signInWithEmailAndPassword(auth, email.trim(), password);
            // onAuthStateChanged farà il resto (claim check + redirect)
        } catch (err) {
            setError('Credenziali non valide.');
        } finally {
            setSubmitting(false);
        }
    };

    const openReset = () => {
        setResetEmail(email);
        setInfo('');
        setError('');
        setResetOpen(true);
    };

    const handleSendReset = async () => {
        setError('');
        setInfo('');
        try {
            if (!resetEmail) {
                setError('Inserisci una email valida.');
                return;
            }
            await sendPasswordResetEmail(auth, resetEmail.trim());
            setInfo('Email di reset inviata. Controlla la tua casella di posta.');
            setResetOpen(false);
        } catch (err) {
            setError('Impossibile inviare email di reset. Verifica l’indirizzo.');
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
                    minHeight: 420,
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                    borderRadius: 2,
                }}
            >
                <img
                    src={logo}
                    alt="Admin logo"
                    style={{ width: '200px', alignSelf: 'center', marginBottom: '1rem' }}
                />

                <TextField
                    label="Email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    variant="outlined"
                    fullWidth
                    sx={{
                        '& .MuiOutlinedInput-root': { color: '#fff' },
                        '& .MuiInputLabel-root': { color: '#fff' },
                        '& fieldset': { borderRadius: 0 },
                    }}
                    InputLabelProps={{ style: { color: '#fff' } }}
                    InputProps={{ style: { color: '#fff' } }}
                />

                <TextField
                    type={showPassword ? 'text' : 'password'}
                    label="Password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    variant="outlined"
                    fullWidth
                    sx={{
                        '& .MuiOutlinedInput-root': { color: '#fff' },
                        '& .MuiInputLabel-root': { color: '#fff' },
                        '& fieldset': { borderRadius: 0 },
                    }}
                    InputLabelProps={{ style: { color: '#fff' } }}
                    InputProps={{
                        style: { color: '#fff' },
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    edge="end"
                                    sx={{ color: '#fff' }}
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                <Button
                    type="submit"
                    variant="contained"
                    sx={{
                        backgroundColor: 'var(--red)',
                        '&:hover': { backgroundColor: '#c62828' },
                        borderRadius: 1,
                    }}
                    disabled={submitting || !email || !password}
                >
                    {submitting ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Login'}
                </Button>

                <Button
                    variant="text"
                    onClick={openReset}
                    sx={{ color: '#fff', textDecoration: 'underline', mt: -1 }}
                >
                    Password dimenticata?
                </Button>

                {error && (
                    <Typography color="error" variant="body2">{error}</Typography>
                )}
                {info && (
                    <Typography color="success.main" variant="body2">{info}</Typography>
                )}

                <Button
                    component={Link}
                    to="/"
                    variant="outlined"
                    sx={{
                        mt: 1, color: 'var(--yellow)',
                        borderColor: 'var(--yellow)', borderRadius: 1
                    }}
                >
                    {t('nav.home')}
                </Button>
            </Paper>

            {/* Dialog reset password */}
            <Dialog open={resetOpen} onClose={() => setResetOpen(false)}>
                <DialogTitle>Recupero password</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Inserisci la tua email: ti invieremo un link per reimpostare la password.
                    </Typography>
                    <TextField
                        label="Email"
                        type="email"
                        fullWidth
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        autoFocus
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setResetOpen(false)}>Annulla</Button>
                    <Button onClick={handleSendReset} variant="contained">Invia</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminLogin;
