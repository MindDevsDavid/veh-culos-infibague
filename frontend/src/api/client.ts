import axios from 'axios'

let _token: string | null = null

export function setAccessToken(token: string | null) { _token = token }

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  if (_token) config.headers.Authorization = `Bearer ${_token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    const url: string = original?.url ?? ''
    const isAuthCall = url.includes('/auth/refresh') || url.includes('/auth/login')

    // Token de acceso expirado: intentar refrescar una vez con la cookie y reintentar.
    // Solo si el refresh falla se cierra sesión. Evita patear al login en cada expiración.
    if (err.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true
      try {
        const { data } = await api.post('/auth/refresh')
        _token = data.accessToken
        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        _token = null
        window.location.href = '/login'
        return Promise.reject(err)
      }
    }

    return Promise.reject(err)
  }
)

export default api
