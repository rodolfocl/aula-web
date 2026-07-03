import api from './api'

function decodeJwtPayload(token) {
  const payload = token.split('.')[1]
  return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
}

export default {
  async login(email, password) {
    const { data: { token } } = await api.post('/auth/login', { email, password })
    const { sub } = decodeJwtPayload(token)
    const { data: userData } = await api.get(`/users/${sub}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const user = {
      id: userData.id,
      nombre: userData.full_name,
      email: userData.email,
      roles: userData.roles ?? ['alumno'],
      avatar: userData.avatar ?? null,
    }
    return { token, user }
  },

  register: (nombre, email, password) =>
    api.post('/auth/register', { full_name: nombre, email, password }),

  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token, new_password) =>
    api.post('/auth/reset-password', { token, new_password }),
}