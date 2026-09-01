import client from './client';

export function login(email, password) {
  return client.post('/auth/login', { email, password }).then((r) => r.data);
}

export function register({ name, email, password, phone, role }) {
  return client.post('/auth/register', { name, email, password, phone, role }).then((r) => r.data);
}

export function registerBusiness({ name, email, password, phone, role }) {
  return client.post('/auth/register-business', { name, email, password, phone, role }).then((r) => r.data);
}
