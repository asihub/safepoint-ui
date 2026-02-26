import axios from 'axios'

// Axios instance pointing to Java Spring Boot API
const client = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Analysis API — lang tells backend whether to translate freeText
export const analyzeRisk = (payload) =>
  client.post('/analysis', payload).then(r => r.data)

// Resources API
export const getFacilities = (lat, lng, insurance = 'UNKNOWN', limit = 25, radiusMeters = 16093) =>
  client.get('/resources/facilities', {
    params: { latitude: lat, longitude: lng, insurance, limit, radiusMeters }
  }).then(r => r.data)

// Safety Plan API
export const saveSafetyPlan = (data) =>
  client.post('/safety-plan', data).then(r => r.data)

export const getSafetyPlan = (userCode, pin) =>
  client.get('/safety-plan', { params: { userCode, pin } }).then(r => r.data)

export const deleteSafetyPlan = (userCode, pin) =>
  client.delete('/safety-plan', { params: { userCode, pin } }).then(r => r.data)

// Auth API
export const registerUser = (pin) =>
  client.post('/auth/register', { pin }).then(r => r.data)

export const verifyUser = (userCode, pin) =>
  client.post('/auth/verify', { userCode, pin }).then(r => r.data)

export default client
