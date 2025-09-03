import React from "react";
import { Stack, Typography, IconButton } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

function InfoRow({ label, value, copy = false }) {
    return (
        <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mb: 0.6, minWidth: 0 }}
        >
            <Typography
                sx={{
                    flex: { xs: "0 0 96px", sm: "0 0 120px" },
                    width: { xs: 96, sm: 120 },
                    opacity: 0.75,
                }}
            >
                {label}
            </Typography>

            <Typography
                sx={{
                    flex: "1 1 auto",
                    minWidth: 0,
                    fontWeight: 600,
                    overflowWrap: "anywhere",   // <-- niente scroll orizzontale
                    wordBreak: "break-word",
                }}
            >
                {value}
            </Typography>

            {copy && (
                <IconButton
                    size="small"
                    onClick={async () => {
                        try { await navigator.clipboard.writeText(String(value || "")); } catch {}
                    }}
                    sx={{ flex: "0 0 auto", ml: 0.5, opacity: 0.8 }}
                >
                    <ContentCopyIcon fontSize="small" />
                </IconButton>
            )}
        </Stack>
    );
}

export default InfoRow;
