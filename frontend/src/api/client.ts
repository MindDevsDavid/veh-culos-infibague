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
  (err) => {
    if (err.response?.status === 401) {
      _token = null
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
