import axios from 'axios'

// Axios instance pointing to Java Spring Boot API
const client = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Analysis API — lang tells backend whether to translate freeText
export const analyzeRisk = ({ questionnaireScores, freeText, concerns = [], proxyMode = false, lang = 'en' }) =>
  client.post('/analysis', { questionnaireScores, freeText, concerns, proxyMode, lang }).then(r => r.data)

// Resources API
export const getFacilities = (lat, lng, insurance = 'UNKNOWN', limit = 200, radiusMeters = 16093, serviceType = 'mh') =>
  client.get('/resources/facilities', {
    params: { latitude: lat, longitude: lng, insurance, limit, radiusMeters, serviceType }
  }).then(r => r.data)

// Safety Plan API
export const saveSafetyPlan = (data) =>
  client.post('/safety-plan', data).then(r => r.data)

export const getSafetyPlan = (userCode, pin) =>
  client.get('/safety-plan', { params: { userCode, pin } }).then(r => r.data)

export const deleteSafetyPlan = (userCode, pin) =>
  client.delete('/safety-plan', { params: { userCode, pin } }).then(r => r.data)

// Auth API
export const registerUser = (pin, username) =>
  client.post('/auth/register', { pin, username }).then(r => r.data)

export const verifyUser = (username, pin) =>
  client.post('/auth/verify', { username, pin }).then(r => r.data)

export default client

export const deleteUser = (username, pin) =>
  client.delete('/auth/user', { data: { username, pin } }).then(r => r.data)
