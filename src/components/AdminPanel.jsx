import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { fetchBookings, createEvent } from '../api';

const Wrapper = styled.section`
  text-align: center;
  padding: 2rem 0;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 2rem;
  th, td {
    padding: 0.5rem;
    border: 1px solid var(--gray);
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
  margin: 0 auto;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid var(--gray);
  border-radius: 4px;
  background-color: #111;
  color: var(--white);
`;

const Button = styled.button`
  padding: 0.75rem;
  background-color: var(--red);
  color: var(--white);
`;

const AdminPanel = () => {
  const [bookings, setBookings] = useState([]);
  const [formData, setFormData] = useState({
    date: '',
    place: '',
    time: '',
    price: '',
    image: '',
    description: '',
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('isAdmin') !== 'true') {
      navigate('/admin');
      return;
    }
    fetchBookings().then(setBookings).catch(() => {});
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createEvent(formData);
      setMessage('Evento creato');
      setFormData({ date: '', place: '', time: '', price: '', image: '', description: '' });
    } catch (err) {
      setMessage('Errore');
    }
  };

  return (
    <Wrapper>
      <div className="container">
        <h2>Admin Panel</h2>
        <h3>Prenotazioni</h3>
        <Table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Cognome</th>
              <th>Email</th>
              <th>Telefono</th>
              <th>Biglietti</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td>{b.nome}</td>
                <td>{b.cognome}</td>
                <td>{b.email}</td>
                <td>{b.telefono}</td>
                <td>{b.quantity || 1}</td>
              </tr>
            ))}
          </tbody>
        </Table>

        <h3>Crea Evento</h3>
        <Form onSubmit={handleSubmit}>
          <Input name="date" placeholder="Data" value={formData.date} onChange={handleChange} />
          <Input name="place" placeholder="Luogo" value={formData.place} onChange={handleChange} />
          <Input name="time" placeholder="Orario" value={formData.time} onChange={handleChange} />
          <Input name="price" placeholder="Prezzo" value={formData.price} onChange={handleChange} />
          <Input name="image" placeholder="URL immagine" value={formData.image} onChange={handleChange} />
          <Input name="description" placeholder="Descrizione" value={formData.description} onChange={handleChange} />
          <Button type="submit">Crea</Button>
        </Form>
        {message && <p>{message}</p>}
      </div>
    </Wrapper>
  );
};

export default AdminPanel;
