import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchBookings,
  createEvent,
  fetchEvents,
  deleteEvent,
  fetchGallery,
  uploadGalleryImage,
  deleteGalleryImage,
} from '../api';
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
  Autocomplete,
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
import AddToDriveIcon from '@mui/icons-material/AddToDrive';
import ConfirmDialog from './ConfirmDialog';
import { useToast } from './ToastContext';

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
  const [gallery, setGallery] = useState([]);
  const [gallerySrc, setGallerySrc] = useState('');
  const [pickerLoaded, setPickerLoaded] = useState(false);
  const [oauthToken, setOauthToken] = useState('');
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
  const { showToast } = useToast();
  const [placeOptions, setPlaceOptions] = useState([]);
  const [section, setSection] = useState('bookings');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, id: null, type: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!apiKey || !clientId) return;
    const onLoad = () => {
      window.gapi.load('client:picker', async () => {
        try {
          await window.gapi.client.init({ apiKey, discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'] });
          await window.gapi.auth2.init({ client_id: clientId, scope: 'https://www.googleapis.com/auth/drive.readonly' });
          setPickerLoaded(true);
        } catch (err) {
          console.error(err);
        }
      });
    };
    if (window.gapi) {
      onLoad();
    } else {
      const script = document.querySelector('script[src="https://apis.google.com/js/api.js"]');
      if (script) script.addEventListener('load', onLoad);
    }
  }, []);

  useEffect(() => {
    if (formData.place.length < 3) {
      setPlaceOptions([]);
      return;
    }
    const controller = new AbortController();
    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(formData.place)}`,
      { signal: controller.signal }
    )
      .then((res) => res.json())
      .then((data) => setPlaceOptions(data.map((d) => d.display_name)))
      .catch(() => {});
    return () => controller.abort();
  }, [formData.place]);

  useEffect(() => {
    if (localStorage.getItem('isAdmin') !== 'true') {
      navigate('/admin');
      return;
    }
    fetchBookings().then(setBookings).catch(() => {});
    fetchEvents().then(setEvents).catch(() => {});
    fetchGallery().then(setGallery).catch(() => {});
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
      showToast('Immagine caricata', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setGallerySrc(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const pickFromDrive = async () => {
    if (!pickerLoaded) return;
    try {
      const auth = await window.gapi.auth2.getAuthInstance().signIn();
      const token = auth.getAuthResponse().access_token;
      setOauthToken(token);
      const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS_IMAGES)
        .setMimeTypes('image/png,image/jpeg,image/jpg');
      const picker = new window.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(token)
        .setDeveloperKey(import.meta.env.VITE_GOOGLE_API_KEY)
        .setCallback(async (data) => {
          if (data.action === window.google.picker.Action.PICKED) {
            const id = data.docs[0].id;
            const res = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const blob = await res.blob();
            const reader = new FileReader();
            reader.onloadend = () => setGallerySrc(reader.result);
            reader.readAsDataURL(blob);
          }
        })
        .build();
      picker.setVisible(true);
    } catch (err) {
      console.error(err);
      showToast('Errore Google Drive', 'error');
    }
  };

const handleGallerySubmit = async (e) => {
    e.preventDefault();
    if (!gallerySrc) return;
    try {
      await uploadGalleryImage(gallerySrc);
      fetchGallery().then(setGallery).catch(() => {});
      setGallerySrc('');
      showToast('Immagine caricata', 'success');
    } catch (err) {
      showToast('Errore', 'error');
    }
  };

  const handleDeleteImage = async (id) => {
    try {
      await deleteGalleryImage(id);
      setGallery(gallery.filter((g) => g.id !== id));
      showToast('Immagine eliminata', 'success');
    } catch (err) {
      showToast('Errore', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, image: formData.image || heroImg };
      await createEvent(data);
      showToast('Evento creato', 'success');
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
      showToast('Errore', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteEvent(id);
      setEvents(events.filter((ev) => ev.id !== id));
      showToast('Evento eliminato', 'success');
    } catch (err) {
      showToast('Errore', 'error');
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
        <ListItem button onClick={() => {setSection('gallery'); setMobileOpen(false);}} selected={section === 'gallery'}>
          <ListItemIcon>
            <EventIcon />
          </ListItemIcon>
          <ListItemText primary="Gallery" />
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
                      <Button size="small" color="error" onClick={() => setConfirm({ open: true, id: ev.id, type: 'event' })}>
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
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: isMobile ? '100%' : 400, width: '100%' }}>
            <Typography variant="h5" gutterBottom>
              Crea Evento
            </Typography>
            <TextField name="name" label="Nome Evento" variant="outlined" value={formData.name} onChange={handleChange} fullWidth />
            <TextField name="dj" label="DJ" variant="outlined" value={formData.dj} onChange={handleChange} fullWidth />
            <TextField type="date" name="date" label="Data" InputLabelProps={{ shrink: true }} variant="outlined" value={formData.date} onChange={handleChange} fullWidth />
            <Autocomplete
              freeSolo
              options={placeOptions}
              inputValue={formData.place}
              onInputChange={(e, value) => setFormData({ ...formData, place: value })}
              renderInput={(params) => (
                <TextField {...params} label="Luogo" variant="outlined" fullWidth />
              )}
            />
            <TextField type="time" name="time" label="Orario" InputLabelProps={{ shrink: true }} variant="outlined" value={formData.time} onChange={handleChange} fullWidth />
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
          </Box>
        )}
        {section === 'gallery' && (
          <Box component="form" onSubmit={handleGallerySubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: isMobile ? '100%' : 400, width: '100%' }}>
            <Typography variant="h5" gutterBottom>
              Gallery
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" component="label" sx={{ color: 'var(--yellow)', borderColor: 'var(--yellow)' }}>
                Carica Immagine
                <input type="file" hidden accept="image/*" onChange={handleGalleryFile} />
              </Button>
              <Button variant="outlined" onClick={pickFromDrive} sx={{ color: 'var(--yellow)', borderColor: 'var(--yellow)' }}>
                <AddToDriveIcon />
              </Button>
            </Box>
            <Button type="submit" variant="contained" sx={{ backgroundColor: 'var(--red)', '&:hover': { backgroundColor: '#c62828' } }}>
              Aggiungi
            </Button>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              {gallery.map((img) => (
                <Box key={img.id} sx={{ position: 'relative' }}>
                  <img src={img.src} alt="gallery" style={{ width: 100, height: 100, objectFit: 'cover' }} />
                  <IconButton size="small" color="error" sx={{ position: 'absolute', top: 0, right: 0 }} onClick={() => setConfirm({ open: true, id: img.id, type: 'image' })}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
    <ConfirmDialog
      open={confirm.open}
      title="Conferma"
      message="Eliminare definitivamente?"
      onConfirm={() => {
        const id = confirm.id;
        setConfirm({ open: false, id: null, type: '' });
        if (confirm.type === 'event') handleDelete(id);
        if (confirm.type === 'image') handleDeleteImage(id);
      }}
      onClose={() => setConfirm({ open: false, id: null, type: '' })}
    />
    </MuiThemeProvider>
  );
};

export default AdminPanel;

