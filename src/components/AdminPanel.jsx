import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBookings, createEvent, fetchEvents, deleteEvent } from '../api';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Button,
  CssBaseline,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import heroImg from '../assets/img/hero.png';
import { theme as appTheme } from '../styles/globalStyles';
import ListAltIcon from '@mui/icons-material/ListAlt';
import EventIcon from '@mui/icons-material/Event';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarIcon from '@mui/icons-material/CalendarToday';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';

const drawerWidth = 240;
const muiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: appTheme.colors.yellow },
    secondary: { main: appTheme.colors.red },
    background: {
      default: appTheme.colors.black,
      paper: appTheme.colors.gray,
    },
  },
});

const AdminPanel = () => {
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    dj: '',
    date: '',
    place: '',
    time: '',
    price: '',
    image: '',
    description: '',
  });
  const [message, setMessage] = useState('');
  const [section, setSection] = useState('bookings');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('isAdmin') !== 'true') {
      navigate('/admin');
      return;
    }
    fetchBookings().then(setBookings).catch(() => {});
    fetchEvents().then(setEvents).catch(() => {});
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((f) => ({ ...f, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, image: formData.image || heroImg };
      await createEvent(data);
      setMessage('Evento creato');
      fetchEvents().then(setEvents).catch(() => {});
      setFormData({
        name: '',
        dj: '',
        date: '',
        place: '',
        time: '',
        price: '',
        image: '',
        description: '',
      });
    } catch (err) {
      setMessage('Errore');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminare questo evento?')) return;
    try {
      await deleteEvent(id);
      setEvents(events.filter((ev) => ev.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        <ListItem button onClick={() => {setSection('bookings'); setMobileOpen(false);}} selected={section === 'bookings'}>
          <ListItemIcon>
            <ListAltIcon />
          </ListItemIcon>
          <ListItemText primary="Prenotazioni" />
        </ListItem>
        <ListItem button onClick={() => {setSection('events'); setMobileOpen(false);}} selected={section === 'events'}>
          <ListItemIcon>
            <CalendarIcon />
          </ListItemIcon>
          <ListItemText primary="Eventi" />
        </ListItem>
        <ListItem button onClick={() => {setSection('create'); setMobileOpen(false);}} selected={section === 'create'}>
          <ListItemIcon>
            <EventIcon />
          </ListItemIcon>
          <ListItemText primary="Crea Evento" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <MuiThemeProvider theme={muiTheme}>
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: 'var(--black)', color: 'var(--yellow)' }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isMobile && (
              <IconButton color="inherit" onClick={() => setMobileOpen(true)}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" noWrap component="div">
              Admin Panel
            </Typography>
          </Box>
          <IconButton color="inherit" onClick={() => { localStorage.removeItem('isAdmin'); navigate('/'); }}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: 'var(--black)',
            color: 'var(--white)'
          },
        }}
      >
        {drawer}
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {section === 'bookings' && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Prenotazioni
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Cognome</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Telefono</TableCell>
                  <TableCell>Biglietti</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>{b.nome}</TableCell>
                    <TableCell>{b.cognome}</TableCell>
                    <TableCell>{b.email}</TableCell>
                    <TableCell>{b.telefono}</TableCell>
                    <TableCell>{b.quantity || 1}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </Box>
          </Box>
        )}
        {section === 'events' && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Eventi
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>DJ</TableCell>
                  <TableCell>Luogo</TableCell>
                  <TableCell>Data</TableCell>
                  <TableCell>Orario</TableCell>
                  <TableCell>Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.map((ev) => (
                  <TableRow key={ev.id}>
                    <TableCell>{ev.name}</TableCell>
                    <TableCell>{ev.dj}</TableCell>
                    <TableCell>{ev.place}</TableCell>
                    <TableCell>{ev.date}</TableCell>
                    <TableCell>{ev.time}</TableCell>
                    <TableCell>
                      <Button size="small" color="error" onClick={() => handleDelete(ev.id)}>
                        <DeleteIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </Box>
          </Box>
        )}
        {section === 'create' && (
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400 }}>
            <Typography variant="h5" gutterBottom>
              Crea Evento
            </Typography>
            <TextField name="name" label="Nome Evento" variant="outlined" value={formData.name} onChange={handleChange} fullWidth />
            <TextField name="dj" label="DJ" variant="outlined" value={formData.dj} onChange={handleChange} fullWidth />
            <TextField name="date" label="Data" variant="outlined" value={formData.date} onChange={handleChange} fullWidth />
            <TextField name="place" label="Luogo" variant="outlined" value={formData.place} onChange={handleChange} fullWidth />
            <TextField name="time" label="Orario" variant="outlined" value={formData.time} onChange={handleChange} fullWidth />
            <TextField name="price" label="Prezzo" variant="outlined" value={formData.price} onChange={handleChange} fullWidth />
            <Button variant="outlined" component="label" sx={{ color: 'var(--yellow)', borderColor: 'var(--yellow)' }}>
              Carica Immagine
              <input type="file" hidden accept="image/*" onChange={handleFile} />
            </Button>
            <TextField name="description" label="Descrizione" variant="outlined" value={formData.description} onChange={handleChange} fullWidth />
            <Button type="submit" variant="contained" fullWidth={isMobile}
              sx={{ alignSelf: isMobile ? 'stretch' : 'flex-start', backgroundColor: 'var(--red)', '&:hover': { backgroundColor: '#c62828' } }}>
              Crea
            </Button>
            {message && <Typography>{message}</Typography>}
          </Box>
        )}
      </Box>
    </Box>
    </MuiThemeProvider>
  );
};

export default AdminPanel;

