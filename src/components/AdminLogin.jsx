import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const Wrapper = styled.section`
  text-align: center;
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: rgba(0,0,0,0.3);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
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

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const expected = import.meta.env.VITE_ADMIN_PASSWORD || 'admin';
    if (password === expected) {
      localStorage.setItem('isAdmin', 'true');
      navigate('/admin/panel');
    } else {
      setError('Password errata');
    }
  };

  return (
    <Wrapper>
      <Form onSubmit={handleSubmit}>
        <h2>Admin Login</h2>
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit">Login</Button>
        {error && <p>{error}</p>}
      </Form>
    </Wrapper>
  );
};

export default AdminLogin;
