import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchBookings,
  createEvent,
  fetchEvents,
  updateEvent,
  deleteEvent,
  fetchGallery,
  uploadGalleryImage,
  deleteGalleryImage,
  setAuthToken,
} from "../api";
import { withLoading } from "../loading";
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
  Switch,
  Divider,
  IconButton,
  Grid,
  Paper,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
} from "@mui/material/styles";
import heroImg from "../assets/img/hero.png";
import { theme as appTheme } from "../styles/globalStyles";
import ListAltIcon from "@mui/icons-material/ListAlt";
import EventIcon from "@mui/icons-material/Event";
import DeleteIcon from "@mui/icons-material/Delete";
import CalendarIcon from "@mui/icons-material/CalendarToday";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import AddToDriveIcon from "@mui/icons-material/AddToDrive";
import ConfirmDialog from "./ConfirmDialog";
import { useToast } from "./ToastContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";

const drawerWidth = 240;
const muiTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: appTheme.colors.yellow },
    secondary: { main: appTheme.colors.red },
    background: {
      default: appTheme.colors.black,
      paper: appTheme.colors.gray,
    },
  },
  shape: { borderRadius: 12 },
});

const glass = {
  backgroundColor: "rgba(34, 34, 34, 0.85)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.6)",
};

const AdminPanel = () => {
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [gallerySrc, setGallerySrc] = useState("");
  const [pickerLoaded, setPickerLoaded] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    dj: "",
    date: "",
    place: "",
    time: "",
    price: "",
    capacity: "",
    image: "",
    description: "",
    soldOut: false,
  });
  const [editingId, setEditingId] = useState(null);
  const { showToast } = useToast();
  const [placeOptions, setPlaceOptions] = useState([]);
  const [section, setSection] = useState("bookings");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, id: null, type: "" });
  const navigate = useNavigate();
  const driveFolderLink = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER;

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!apiKey || !clientId) return;
    const onLoad = () => {
      window.gapi.load("client:picker", async () => {
        try {
          await window.gapi.client.init({
            apiKey,
            discoveryDocs: [
              "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
            ],
          });
          await window.gapi.auth2.init({
            client_id: clientId,
            scope: "https://www.googleapis.com/auth/drive.readonly",
          });
          setPickerLoaded(true);
        } catch (err) {
          console.error(err);
        }
      });
    };
    if (window.gapi) {
      onLoad();
    } else {
      const src = "https://apis.google.com/js/api.js";
      let script = document.querySelector(`script[src="${src}"]`);
      if (!script) {
        script = document.createElement("script");
        script.src = src;
        script.async = true;
        document.body.appendChild(script);
      }
      script.addEventListener("load", onLoad);
      return () => script.removeEventListener("load", onLoad);
    }
  }, []);

  useEffect(() => {
    if (formData.place.length < 3) {
      setPlaceOptions([]);
      return;
    }
    const controller = new AbortController();
    withLoading(async () => {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(
          formData.place
        )}`,
        { signal: controller.signal }
      );
      const data = await res.json();
      setPlaceOptions(data.map((d) => d.display_name));
    }).catch(() => {});
    return () => controller.abort();
  }, [formData.place]);

  useEffect(() => {
    if (localStorage.getItem("isAdmin") !== "true") {
      navigate("/admin");
      return;
    }
    fetchBookings()
      .then(setBookings)
      .catch(() => {});
    fetchEvents()
      .then(setEvents)
      .catch(() => {});
    fetchGallery()
      .then(setGallery)
      .catch(() => {});
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const pickImageFromDrive = async (onImagePicked) => {
    if (!pickerLoaded) return;
    try {
      const auth = await window.gapi.auth2.getAuthInstance().signIn();
      const token = auth.getAuthResponse().access_token;

      const view = new window.google.picker.DocsView(
        window.google.picker.ViewId.DOCS_IMAGES
      ).setMimeTypes("image/png,image/jpeg,image/jpg");

      const picker = new window.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(token)
        .setDeveloperKey(import.meta.env.VITE_GOOGLE_API_KEY)
        .setCallback((data) => {
          if (data.action === window.google.picker.Action.PICKED) {
            const id = data.docs[0].id;
            const link = `https://drive.google.com/uc?export=view&id=${id}`;
            onImagePicked(link);
          }
        })
        .build();

      picker.setVisible(true);
    } catch (err) {
      console.error(err);
      showToast("Errore Google Drive", "error");
    }
  };

  // 🔴 Per EVENTI
  const pickEventImageFromDrive = () => {
    pickImageFromDrive((link) => {
      setFormData((f) => ({ ...f, image: link }));
    });
  };

  // 🔵 Per GALLERY
  const pickFromDrive = () => {
    pickImageFromDrive((link) => {
      setGallerySrc(link);
    });
  };

  const handleGallerySubmit = async (e) => {
    e.preventDefault();
    if (!gallerySrc) return;
    try {
      await uploadGalleryImage(gallerySrc);
      fetchGallery()
        .then(setGallery)
        .catch(() => {});
      setGallerySrc("");
      showToast("Immagine caricata", "success");
    } catch (err) {
      showToast("Errore", "error");
    }
  };

  const handleDeleteImage = async (id) => {
    try {
      await deleteGalleryImage(id);
      setGallery(gallery.filter((g) => g.id !== id));
      showToast("Immagine eliminata", "success");
    } catch (err) {
      showToast("Errore", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, image: formData.image || heroImg };
      if (editingId) {
        await updateEvent(editingId, data);
        showToast("Evento aggiornato", "success");
      } else {
        await createEvent(data);
        showToast("Evento creato", "success");
      }
      fetchEvents()
        .then(setEvents)
        .catch(() => {});
      setFormData({
        name: "",
        dj: "",
        date: "",
        place: "",
        time: "",
        price: "",
        capacity: "",
        image: "",
        description: "",
        soldOut: false,
      });
      setEditingId(null);
    } catch (err) {
      showToast("Errore", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteEvent(id);
      setEvents(events.filter((ev) => ev.id !== id));
      showToast("Evento eliminato", "success");
    } catch (err) {
      showToast("Errore", "error");
    }
  };

  const handleEdit = (ev) => {
    setFormData({
      name: ev.name,
      dj: ev.dj,
      date: ev.date,
      place: ev.place,
      time: ev.time,
      price: ev.price,
      capacity: ev.capacity || "",
      image: ev.image,
      description: ev.description,
      soldOut: !!ev.soldOut,
    });
    setEditingId(ev.id);
    setSection("create");
  };

  const handleToggleSoldOut = async (id, value) => {
    try {
      await updateEvent(id, { soldOut: value });
      setEvents(
        events.map((e) => (e.id === id ? { ...e, soldOut: value } : e))
      );
      showToast("Aggiornato", "success");
    } catch (err) {
      showToast("Errore", "error");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
    setAuthToken(null);
    localStorage.removeItem("isAdmin");
    navigate("/admin");
  };

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        <ListItem
          button
          onClick={() => {
            setSection("bookings");
            setMobileOpen(false);
          }}
          selected={section === "bookings"}
        >
          <ListItemIcon>
            <ListAltIcon />
          </ListItemIcon>
          <ListItemText primary="Prenotazioni" />
        </ListItem>
        <ListItem
          button
          onClick={() => {
            setSection("events");
            setMobileOpen(false);
          }}
          selected={section === "events"}
        >
          <ListItemIcon>
            <CalendarIcon />
          </ListItemIcon>
          <ListItemText primary="Eventi" />
        </ListItem>
        <ListItem
          button
          onClick={() => {
            setSection("create");
            setMobileOpen(false);
          }}
          selected={section === "create"}
        >
          <ListItemIcon>
            <EventIcon />
          </ListItemIcon>
          <ListItemText primary="Crea Evento" />
        </ListItem>
        <ListItem
          button
          onClick={() => {
            setSection("gallery");
            setMobileOpen(false);
          }}
          selected={section === "gallery"}
        >
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
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar
          position="fixed"
          sx={{
            ...glass,
            zIndex: (theme) => theme.zIndex.drawer + 1,
            color: "var(--yellow)",
            backgroundImage: "linear-gradient(90deg, #141414, #333)",
          }}
        >
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {isMobile && (
                <IconButton color="inherit" onClick={() => setMobileOpen(true)}>
                  <MenuIcon />
                </IconButton>
              )}
              <Typography variant="h6" noWrap component="div">
                Admin Panel
              </Typography>
            </Box>
            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <Drawer
          variant={isMobile ? "temporary" : "permanent"}
          open={isMobile ? mobileOpen : true}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              ...glass,
              width: drawerWidth,
              boxSizing: "border-box",
              color: "var(--white)",
              borderRadius: "0 12px 12px 0",
              backgroundImage: "linear-gradient(180deg, #1c1c1c, #2a2a2a)",
            },
          }}
        >
          {drawer}
        </Drawer>
        <Box component="main" sx={{ flexGrow: 1, p: 3 }} className="container">
          <Toolbar />
          {section === "bookings" && (
            <Paper
              sx={{
                ...glass,
                p: 3,
                mb: 4,
                boxShadow: 4,
                borderRadius: 2,
                overflowX: "auto",
              }}
            >
              <Typography variant="h5" gutterBottom>
                Prenotazioni
              </Typography>
              <Box sx={{ overflowX: "auto" }}>
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
            </Paper>
          )}
          {section === "events" && (
            <Paper
              sx={{
                ...glass,
                p: 3,
                mb: 4,
                boxShadow: 4,
                borderRadius: 2,
                overflowX: "auto",
              }}
            >
              <Typography variant="h5" gutterBottom>
                Eventi
              </Typography>
              <Box sx={{ overflowX: "auto" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nome</TableCell>
                      <TableCell>DJ</TableCell>
                      <TableCell>Luogo</TableCell>
                      <TableCell>Data</TableCell>
                      <TableCell>Orario</TableCell>
                      <TableCell>Capienza</TableCell>
                      <TableCell>Sold Out</TableCell>
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
                        <TableCell>{ev.capacity || "-"}</TableCell>
                        <TableCell>
                          <Switch
                            checked={!!ev.soldOut}
                            onChange={(e) =>
                              handleToggleSoldOut(ev.id, e.target.checked)
                            }
                            color="warning"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => handleEdit(ev)}
                            sx={{ mr: 1 }}
                            color="primary"
                          >
                            Modifica
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() =>
                              setConfirm({
                                open: true,
                                id: ev.id,
                                type: "event",
                              })
                            }
                          >
                            <DeleteIcon />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Paper>
          )}
          {section === "create" && (
            <Paper
              sx={{
                ...glass,
                p: 3,
                mb: 4,
                boxShadow: 4,
                borderRadius: 2,
                maxWidth: 600,
                mx: "auto",
              }}
            >
              <Grid
                container
                direction="column"
                component="form"
                onSubmit={handleSubmit}
                spacing={2}
              >
                <Grid item xs={12}>
                  <Typography variant="h5" gutterBottom>
                    {editingId ? "Modifica Evento" : "Crea Evento"}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="name"
                    label="Nome Evento"
                    variant="outlined"
                    value={formData.name}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="dj"
                    label="DJ"
                    variant="outlined"
                    value={formData.dj}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    type="date"
                    name="date"
                    label="Data"
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                    value={formData.date}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <Autocomplete
                    freeSolo
                    options={placeOptions}
                    inputValue={formData.place}
                    onInputChange={(e, value) =>
                      setFormData({ ...formData, place: value })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Luogo"
                        variant="outlined"
                        fullWidth
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    type="time"
                    name="time"
                    label="Orario"
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                    value={formData.time}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="price"
                    label="Prezzo"
                    variant="outlined"
                    value={formData.price}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="capacity"
                    label="Capienza"
                    variant="outlined"
                    value={formData.capacity}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography
                    component="div"
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    Sold Out
                    <Switch
                      checked={formData.soldOut}
                      onChange={(e) =>
                        setFormData({ ...formData, soldOut: e.target.checked })
                      }
                      color="warning"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    onClick={pickEventImageFromDrive}
                    variant="outlined"
                    startIcon={<AddToDriveIcon />}
                    sx={{
                      color: "var(--yellow)",
                      borderColor: "var(--yellow)",
                    }}
                  >
                    Scegli da Drive
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="description"
                    label="Descrizione"
                    variant="outlined"
                    value={formData.description}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth={isMobile}
                    sx={{
                      backgroundColor: "var(--red)",
                      "&:hover": { backgroundColor: "#c62828" },
                    }}
                  >
                    {editingId ? "Salva" : "Crea"}
                  </Button>
                  {editingId && (
                    <Button
                      onClick={() => {
                        setEditingId(null);
                        setFormData({
                          name: "",
                          dj: "",
                          date: "",
                          place: "",
                          time: "",
                          price: "",
                          capacity: "",
                          image: "",
                          description: "",
                          soldOut: false,
                        });
                      }}
                      variant="text"
                      sx={{ ml: 2, color: "var(--yellow)" }}
                    >
                      Annulla
                    </Button>
                  )}
                </Grid>
              </Grid>
            </Paper>
          )}
          {section === "gallery" && (
            <Paper
              sx={{
                ...glass,
                p: 3,
                mb: 4,
                boxShadow: 4,
                borderRadius: 2,
                maxWidth: isMobile ? "100%" : 400,
                mx: "auto",
              }}
            >
              <Grid
                container
                direction="column"
                component="form"
                onSubmit={handleGallerySubmit}
                spacing={2}
              >
                <Grid item xs={12}>
                  <Typography variant="h5" gutterBottom>
                    Gallery
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    onClick={pickFromDrive}
                    fullWidth
                    startIcon={<AddToDriveIcon />}
                    sx={{
                      color: "var(--yellow)",
                      borderColor: "var(--yellow)",
                    }}
                  >
                    Scegli da Drive
                  </Button>
                </Grid>
                {driveFolderLink && (
                  <Grid item xs={12}>
                    <Button
                      variant="text"
                      component="a"
                      href={driveFolderLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      startIcon={<AddToDriveIcon />}
                      fullWidth
                      sx={{ color: "var(--yellow)" }}
                    >
                      Apri archivio Drive
                    </Button>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{
                      backgroundColor: "var(--red)",
                      "&:hover": { backgroundColor: "#c62828" },
                    }}
                  >
                    Aggiungi
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Grid container spacing={1}>
                    {gallery.map((img) => (
                      <Grid
                        item
                        key={img.id}
                        xs={4}
                        sm={3}
                        md={2}
                        sx={{ position: "relative" }}
                      >
                        <img
                          src={img.src}
                          alt="gallery"
                          style={{
                            width: "100%",
                            height: 100,
                            objectFit: "cover",
                          }}
                        />
                        <IconButton
                          size="small"
                          color="error"
                          sx={{ position: "absolute", top: 0, right: 0 }}
                          onClick={() =>
                            setConfirm({
                              open: true,
                              id: img.id,
                              type: "image",
                            })
                          }
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              </Grid>
            </Paper>
          )}
        </Box>
      </Box>
      <ConfirmDialog
        open={confirm.open}
        title="Conferma"
        message="Eliminare definitivamente?"
        onConfirm={() => {
          const id = confirm.id;
          setConfirm({ open: false, id: null, type: "" });
          if (confirm.type === "event") handleDelete(id);
          if (confirm.type === "image") handleDeleteImage(id);
        }}
        onClose={() => setConfirm({ open: false, id: null, type: "" })}
      />
    </MuiThemeProvider>
  );
};

export default AdminPanel;
