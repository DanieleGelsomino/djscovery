// src/components/AdminLogin.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Box, Button, Paper, TextField, Typography,
    InputAdornment, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, GlobalStyles, CircularProgress
} from '@mui/material';
import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    sendPasswordResetEmail
} from 'firebase/auth';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

import { useLanguage } from './LanguageContext';
import { auth } from '../firebase/config';
import { setAuthToken } from '../api';

import logo from '../assets/img/ADMIN.png';
import heroImg from '../assets/img/hero.png';

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
        if (!auth) {
            setChecking(false);
            setError('Configurazione Firebase mancante. Imposta le variabili VITE_FIREBASE_* su Vercel.');
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setChecking(false);
            setError('');
            setInfo('');
            if (!user) return;

            try {
                const idToken = await user.getIdToken(true);
                const tokenResult = await user.getIdTokenResult();
                const isAdmin = !!tokenResult.claims?.admin;

                setAuthToken(idToken);

                if (isAdmin) {
                    localStorage.setItem('isAdmin', 'true'); // solo UI hints
                    navigate('/admin/panel');
                } else {
                    localStorage.removeItem('isAdmin');
                    await auth.signOut();
                    setError('Accesso negato: non hai permessi amministratore.');
                    navigate('/');
                }
            } catch {
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
            // onAuthStateChanged farà il resto
        } catch {
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
        } catch {
            setError('Impossibile inviare email di reset. Verifica l’indirizzo.');
        }
    };

    // Stile comune “glass overlay” per i TextField
    const textFieldSx = {
        '& .MuiOutlinedInput-root': {
            color: '#fff',
            backgroundColor: 'rgba(255,255,255,0.12)', // overlay fisso anche senza autofill
            '& fieldset': { borderRadius: '12px', borderColor: 'rgba(255,255,255,0.5)' },
            '&:hover fieldset': { borderColor: '#fff' },
            '&.Mui-focused fieldset': { borderColor: '#fff' },
        },
        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.85)' },
    };

    return (
        <Box
            sx={{
                textAlign: 'center',
                minHeight: '100vh',
                backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${heroImg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
            }}
        >
            {/* Override globale per autofill: mantiene overlay e testo bianco */}
            <GlobalStyles styles={{
                'input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active': {
                    WebkitBoxShadow: '0 0 0 40px rgba(255,255,255,0.12) inset !important',
                    WebkitTextFillColor: '#fff !important',
                    caretColor: '#fff',
                    transition: 'background-color 9999s ease-in-out 0s',
                }
            }} />

            <Paper
                component="form"
                onSubmit={handleSubmit}
                elevation={6}
                sx={{
                    p: { xs: 3, sm: 4 },
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    width: 420,
                    maxWidth: '100%',
                    minHeight: 440,
                    backgroundColor: 'rgba(255,255,255,0.14)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
                    borderRadius: '16px', // ✅ card 16px
                    border: '1px solid rgba(255,255,255,0.25)',
                }}
            >
                {/* Logo più grande e responsivo */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                    <img
                        src={logo}
                        alt="Admin logo"
                        style={{
                            width: '200px',
                            maxWidth: '80%',
                            height: 'auto',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))'
                        }}
                    />
                </Box>

                <TextField
                    label="Email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    variant="outlined"
                    fullWidth
                    sx={textFieldSx}
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
                    sx={textFieldSx}
                    InputLabelProps={{ style: { color: '#fff' } }}
                    InputProps={{
                        style: { color: '#fff' },
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    edge="end"
                                    sx={{ color: '#fff' }}
                                    aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
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
                        borderRadius: '12px', // ✅ button 12px
                        py: 1.2,
                        fontWeight: 700,
                    }}
                    disabled={submitting || !email || !password}
                >
                    {submitting ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Login'}
                </Button>

                <Button
                    variant="text"
                    onClick={openReset}
                    sx={{ color: '#fff', textDecoration: 'underline', mt: -0.5 }}
                >
                    Password dimenticata?
                </Button>

                {error && (
                    <Typography color="error" variant="body2">{error}</Typography>
                )}
                {info && (
                    <Typography sx={{ color: '#4caf50' }} variant="body2">{info}</Typography>
                )}

                <Button
                    component={Link}
                    to="/"
                    variant="outlined"
                    sx={{
                        mt: 1,
                        color: 'var(--yellow)',
                        borderColor: 'var(--yellow)',
                        borderRadius: '12px',
                        fontWeight: 600,
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

            {/* Overlay di checking auth (prima di sapere se è admin) */}
            {checking && (
                <Box
                    sx={{
                        position: 'fixed', inset: 0, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(2px)',
                    }}
                >
                    <CircularProgress />
                </Box>
            )}
        </Box>
    );
};

export default AdminLogin;
