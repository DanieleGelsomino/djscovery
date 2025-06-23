import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

const ConfirmDialog = ({ open, title, message, onConfirm, onClose }) => (
  <Dialog open={open} onClose={onClose}>
    {title && <DialogTitle>{title}</DialogTitle>}
    {message && <DialogContent>{message}</DialogContent>}
    <DialogActions>
      <Button onClick={onClose}>Annulla</Button>
      <Button onClick={onConfirm} color="error">Conferma</Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmDialog;
