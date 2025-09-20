import React, { useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toDateLike } from "../../lib/date";
import { isPast } from "./eventUtils";

const glass = {
  backgroundColor: "rgba(20,20,24,0.82)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 8px 26px rgba(0,0,0,0.45)",
  borderRadius: 16,
};

const COLORS = ["#FFD54F", "#7986CB", "#4DB6AC", "#FF8A65", "#BA68C8"];

const formatDayLabel = (date) => {
  if (!date) return "";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
  }).format(date);
};

const formatMonthLabel = (date) => {
  if (!date) return "";
  return new Intl.DateTimeFormat("it-IT", {
    month: "short",
    year: "numeric",
  }).format(date);
};

const quantityFromBooking = (booking) => {
  const raw = booking?.quantity ?? booking?.quantita ?? 1;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const AnalyticsDashboard = ({
  bookings = [],
  events = [],
  onRefresh,
  bookingsUpdatedAt,
  eventsUpdatedAt,
  isFetchingBookings,
  isFetchingEvents,
}) => {
  const theme = useTheme();

  const totalTickets = useMemo(
    () => bookings.reduce((sum, booking) => sum + quantityFromBooking(booking), 0),
    [bookings]
  );

  const uniqueBookings = bookings.length;

  const upcomingEventsCount = useMemo(
    () =>
      events.filter((event) => {
        if (event?.upcoming) return true;
        return !isPast(event);
      }).length,
    [events]
  );

  const soldOutEvents = useMemo(
    () => events.filter((event) => event?.soldOut).length,
    [events]
  );

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayTickets = useMemo(() => {
    return bookings.reduce((sum, booking) => {
      const created =
        toDateLike(booking?.createdAt) ||
        toDateLike(booking?.created) ||
        toDateLike(booking?.updatedAt);
      if (!created) return sum;
      const key = created.toISOString().slice(0, 10);
      if (key !== todayKey) return sum;
      return sum + quantityFromBooking(booking);
    }, 0);
  }, [bookings, todayKey]);

  const bookingsTrend = useMemo(() => {
    const days = [];
    const map = new Map();

    bookings.forEach((booking) => {
      const created =
        toDateLike(booking?.createdAt) ||
        toDateLike(booking?.created) ||
        toDateLike(booking?.updatedAt);
      if (!created) return;
      const key = created.toISOString().slice(0, 10);
      const value = map.get(key) ?? 0;
      map.set(key, value + quantityFromBooking(booking));
    });

    for (let i = 13; i >= 0; i -= 1) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      const key = day.toISOString().slice(0, 10);
      const total = map.get(key) ?? 0;
      days.push({
        key,
        label: formatDayLabel(day),
        value: total,
      });
    }

    return days;
  }, [bookings]);

  const eventsByMonth = useMemo(() => {
    const map = new Map();

    events.forEach((event) => {
      const when =
        toDateLike(event?.startDate) ||
        toDateLike(event?.date) ||
        toDateLike(event?.endDate);
      if (!when) return;
      const key = `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, "0")}`;
      const existing = map.get(key) ?? { key, date: when, total: 0 };
      existing.total += 1;
      existing.date = when;
      map.set(key, existing);
    });

    return Array.from(map.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((entry) => ({
        key: entry.key,
        label: formatMonthLabel(entry.date),
        value: entry.total,
      }));
  }, [events]);

  const eventsStatus = useMemo(() => {
    const statusCount = new Map();

    const statusFor = (event) => {
      if (event?.upcoming) return "upcoming";
      return event?.status || "published";
    };

    const labelFor = (status) => {
      switch (status) {
        case "draft":
          return "Bozze";
        case "archived":
          return "Archiviati";
        case "upcoming":
          return "Da annunciare";
        default:
          return "Pubblicati";
      }
    };

    events.forEach((event) => {
      const status = statusFor(event);
      const current = statusCount.get(status) ?? { status, label: labelFor(status), value: 0 };
      current.value += 1;
      statusCount.set(status, current);
    });

    return Array.from(statusCount.values());
  }, [events]);

  const eventsMap = useMemo(() => {
    const map = new Map();
    events.forEach((event) => {
      if (event?.id) {
        map.set(event.id, event);
      }
    });
    return map;
  }, [events]);

  const topEvents = useMemo(() => {
    const counts = new Map();

    bookings.forEach((booking) => {
      const eventId = booking?.eventId || booking?.event_id;
      if (!eventId) return;
      const quantity = quantityFromBooking(booking);
      const entry = counts.get(eventId) ?? { eventId, value: 0 };
      entry.value += quantity;
      counts.set(eventId, entry);
    });

    const withNames = Array.from(counts.values()).map((entry) => {
      const event = eventsMap.get(entry.eventId);
      const name =
        event?.name ||
        bookingEventName(bookings, entry.eventId) ||
        `Evento ${entry.eventId}`;
      return {
        ...entry,
        name,
      };
    });

    return withNames.sort((a, b) => b.value - a.value).slice(0, 6);
  }, [bookings, eventsMap]);

  const lastUpdated = Math.max(bookingsUpdatedAt ?? 0, eventsUpdatedAt ?? 0);
  const lastUpdatedLabel = lastUpdated
    ? new Intl.DateTimeFormat("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(lastUpdated))
    : "—";

  const isRefreshing = isFetchingBookings || isFetchingEvents;

  return (
    <Stack spacing={3} sx={{ color: theme.palette.common.white }}>
      <Paper sx={{ ...glass, p: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Analisi in tempo reale
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Aggiornato alle {lastUpdatedLabel} • Aggiornamento automatico ogni 30 secondi
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Aggiornamento…" : "Aggiorna ora"}
          </Button>
        </Stack>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ ...glass, p: 2 }}>
              <Stack spacing={0.5}>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Biglietti totali
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {totalTickets}
                </Typography>
                <Chip
                  label={`${uniqueBookings} prenotazioni`}
                  size="small"
                  sx={{
                    alignSelf: "flex-start",
                    backgroundColor: "rgba(255,213,79,0.12)",
                    color: "#FFD54F",
                    border: "1px solid rgba(255,213,79,0.35)",
                  }}
                />
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ ...glass, p: 2 }}>
              <Stack spacing={0.5}>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Biglietti odierni
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {todayTickets}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.6 }}>
                  Generati il {todayKey.split("-").reverse().join("/")}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ ...glass, p: 2 }}>
              <Stack spacing={0.5}>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Eventi futuri attivi
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {upcomingEventsCount}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.6 }}>
                  Include eventi pubblicati e da annunciare
                </Typography>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ ...glass, p: 2 }}>
              <Stack spacing={0.5}>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Eventi sold out
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {soldOutEvents}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.6 }}>
                  Aggiornamento automatico
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ ...glass, p: 3, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Andamento prenotazioni (ultimi 14 giorni)
            </Typography>
            <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bookingsTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis
                    dataKey="label"
                    stroke="rgba(255,255,255,0.6)"
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.6)"
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                    allowDecimals={false}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    labelFormatter={(label) => `Giorno: ${label}`}
                    formatter={(value) => [`${value} biglietti`, "Totale"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#FFD54F"
                    strokeWidth={3}
                    dot={{ r: 4, stroke: "#FFD54F", strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ ...glass, p: 3, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Stato eventi
            </Typography>
            {eventsStatus.length === 0 ? (
              <Box
                sx={{
                  height: 260,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.6,
                  textAlign: "center",
                }}
              >
                Nessun evento disponibile per le statistiche.
              </Box>
            ) : (
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={eventsStatus}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                    >
                      {eventsStatus.map((entry, index) => (
                        <Cell
                          key={entry.status}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                      formatter={(value, name) => [`${value} eventi`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ ...glass, p: 3, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Eventi programmati per mese
            </Typography>
            {eventsByMonth.length === 0 ? (
              <Box
                sx={{
                  height: 260,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.6,
                  textAlign: "center",
                }}
              >
                Nessun evento programmato con data.
              </Box>
            ) : (
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={eventsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis
                      dataKey="label"
                      stroke="rgba(255,255,255,0.6)"
                      tickLine={false}
                      axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.6)"
                      tickLine={false}
                      axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                      allowDecimals={false}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                      formatter={(value) => [`${value} eventi`, "Totale"]}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#7986CB" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ ...glass, p: 3, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Top eventi per prenotazioni
            </Typography>
            {topEvents.length === 0 ? (
              <Box
                sx={{
                  height: 260,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.6,
                  textAlign: "center",
                }}
              >
                Nessuna prenotazione registrata al momento.
              </Box>
            ) : (
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topEvents}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis
                      dataKey="name"
                      stroke="rgba(255,255,255,0.6)"
                      tickLine={false}
                      axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.6)"
                      tickLine={false}
                      axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                      allowDecimals={false}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                      formatter={(value) => [`${value} biglietti`, "Totale"]}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#4DB6AC" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
};

const bookingEventName = (bookings, eventId) => {
  const booking = bookings.find((b) => b?.eventId === eventId || b?.event_id === eventId);
  return booking?.eventName || booking?.event_title || null;
};

export default AnalyticsDashboard;
