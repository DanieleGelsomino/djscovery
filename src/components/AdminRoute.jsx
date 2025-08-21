// src/components/AdminRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { Box, CircularProgress } from '@mui/material';

const AdminRoute = ({ children }) => {
    const [state, setState] = useState({ checking: true, allowed: false });

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setState({ checking: false, allowed: false });
                return;
            }
            try {
                const tokenResult = await user.getIdTokenResult(true);
                const isAdmin = !!tokenResult.claims?.admin;
                setState({ checking: false, allowed: isAdmin });
            } catch {
                setState({ checking: false, allowed: false });
            }
        });
        return unsub;
    }, []);

    if (state.checking) {
        return (
            <Box sx={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    return state.allowed ? children : <Navigate to="/" replace />;
};

export default AdminRoute;
