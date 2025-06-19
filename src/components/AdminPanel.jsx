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
} from '@mui/material';
import ListAltIcon from '@mui/icons-material/ListAlt';
import EventIcon from '@mui/icons-material/Event';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarIcon from '@mui/icons-material/CalendarToday';

const drawerWidth = 240;

const AdminPanel = () => {
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [formData, setFormData] = useState({
    date: '',
    place: '',
    time: '',
    price: '',
    image: '',
    description: '',
  });
  const [message, setMessage] = useState('');
  const [section, setSection] = useState('bookings');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createEvent(formData);
      setMessage('Evento creato');
      setFormData({
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
        <ListItem button onClick={() => setSection('bookings')} selected={section === 'bookings'}>
          <ListItemIcon>
            <ListAltIcon />
          </ListItemIcon>
          <ListItemText primary="Prenotazioni" />
        </ListItem>
        <ListItem button onClick={() => setSection('events')} selected={section === 'events'}>
          <ListItemIcon>
            <CalendarIcon />
          </ListItemIcon>
          <ListItemText primary="Eventi" />
        </ListItem>
        <ListItem button onClick={() => setSection('create')} selected={section === 'create'}>
          <ListItemIcon>
            <EventIcon />
          </ListItemIcon>
          <ListItemText primary="Crea Evento" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: 'var(--black)', color: 'var(--yellow)' }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6" noWrap component="div">
            Admin Panel
          </Typography>
          <Button color="inherit" onClick={() => { localStorage.removeItem('isAdmin'); navigate('/'); }}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
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
        )}
        {section === 'events' && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Eventi
            </Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Luogo</TableCell>
                  <TableCell>Data</TableCell>
                  <TableCell>Orario</TableCell>
                  <TableCell>Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.map((ev) => (
                  <TableRow key={ev.id}>
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
        )}
        {section === 'create' && (
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400 }}>
            <Typography variant="h5" gutterBottom>
              Crea Evento
            </Typography>
            <TextField name="date" label="Data" variant="outlined" value={formData.date} onChange={handleChange} fullWidth />
            <TextField name="place" label="Luogo" variant="outlined" value={formData.place} onChange={handleChange} fullWidth />
            <TextField name="time" label="Orario" variant="outlined" value={formData.time} onChange={handleChange} fullWidth />
            <TextField name="price" label="Prezzo" variant="outlined" value={formData.price} onChange={handleChange} fullWidth />
            <TextField name="image" label="URL immagine" variant="outlined" value={formData.image} onChange={handleChange} fullWidth />
            <TextField name="description" label="Descrizione" variant="outlined" value={formData.description} onChange={handleChange} fullWidth />
            <Button type="submit" variant="contained"
              sx={{ backgroundColor: 'var(--red)', '&:hover': { backgroundColor: '#c62828' } }}>
              Crea
            </Button>
            {message && <Typography>{message}</Typography>}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AdminPanel;

