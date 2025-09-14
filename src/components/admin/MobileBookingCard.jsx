import React from "react";
import { Card, CardContent, Typography, Stack, IconButton, Tooltip, Button, CardActions } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

function MobileBookingCard({ b, onEdit, onDelete }) {
    return (
        <Card sx={{ mb: 1.2, background: "#18181f", border: "1px solid rgba(255,255,255,0.06)" }}>
            <CardContent>
                <Typography variant="subtitle1" fontWeight={700}>{b.nome} {b.cognome}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>{b.email}</Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 0.5, opacity: 0.85 }}>
                    <Typography variant="caption">📞 {b.telefono}</Typography>
                    <Typography variant="caption">🎟️ {b.quantity || 1}</Typography>
                </Stack>
            </CardContent>
            <CardActions sx={{ pt: 0, pb: 1.2, px: 2, justifyContent: "flex-end" }}>
                <Button size="small" startIcon={<EditIcon />} onClick={onEdit}>Modifica</Button>
                <Tooltip title="Elimina">
                    <span>
                        <IconButton size="small" color="error" onClick={onDelete}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
            </CardActions>
        </Card>
    );
}

export default MobileBookingCard;
