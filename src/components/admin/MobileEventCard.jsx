import React from "react";
import {
    Card,
    CardContent,
    Chip,
    Stack,
    Typography,
    Switch,
    Tooltip,
    IconButton,
    Button,
    CardActions
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockClockIcon from "@mui/icons-material/LockClock";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { isPast, formatDate } from "./eventUtils";
import { formatHM } from "../../lib/date";
import { useLanguage } from "../LanguageContext";

function MobileEventCard({ ev, onEdit, onDelete, onToggleSoldOut, onDuplicate, onExportICS, canDelete }) {
    const past = isPast(ev);
    const { t } = useLanguage();
    const statusColor =
        ev.status === "draft" ? "default" : ev.status === "archived" ? "warning" : "success";
    return (
        <Card sx={{ mb: 1.5, background: "#18181f", border: "1px solid rgba(255,255,255,0.06)" }}>
            <CardContent sx={{ pb: 1.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, flexWrap: "wrap" }}>
                    {!past ? <CheckCircleIcon color="success" fontSize="small" /> : <LockClockIcon color="disabled" fontSize="small" />}
                    <Typography variant="subtitle1" fontWeight={700}>{ev.name}</Typography>
                    <Chip size="small" label={t(`admin.events.statuses.${ev.status || "published"}`)} sx={{ ml: "auto" }} color={statusColor} />
                </Stack>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>{ev.dj || "—"}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>{ev.place || "—"}</Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 1, opacity: 0.8 }}>
                    <Typography variant="caption">
                      📅 {ev.endDate && ev.endDate !== ev.startDate && ev.endDate !== ev.date
                        ? `${formatDate(ev.startDate || ev.date)} → ${formatDate(ev.endDate)}`
                        : formatDate(ev.startDate || ev.date)}
                    </Typography>
                    <Typography variant="caption">⏰ {formatHM(ev.time)}</Typography>
                    <Typography variant="caption">👥 {ev.capacity || "-"}</Typography>
                </Stack>
            </CardContent>
            <CardActions sx={{ pt: 0, pb: 1.5, px: 2, justifyContent: "space-between" }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption">{t("admin.form.soldOut")}</Typography>
                    <Switch size="small" color="warning" checked={!!ev.soldOut} onChange={(e) => onToggleSoldOut(e.target.checked)} disabled={past} />
                </Stack>
                <Stack direction="row" spacing={1}>
                    <Tooltip title="Duplica"><IconButton size="small" onClick={onDuplicate}><ContentCopyIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title=".ics"><IconButton size="small" onClick={onExportICS}><CalendarMonthIcon fontSize="small" /></IconButton></Tooltip>
                    <Button size="small" startIcon={<EditIcon />} onClick={onEdit} disabled={past}>Modifica</Button>
                    <span>
            <IconButton size="small" color="error" onClick={onDelete} disabled={past || !canDelete}><DeleteIcon fontSize="small" /></IconButton>
          </span>
                </Stack>
            </CardActions>
        </Card>
    );
}

export default MobileEventCard;
