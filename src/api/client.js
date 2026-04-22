import axios from 'axios'

// Axios instance pointing to Java Spring Boot API
const client = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
})

// Analysis API — lang tells backend whether to translate freeText
export const analyzeRisk = ({ questionnaireScores, freeText, proxyMode = false, lang = 'en' }) =>
  client.post('/analysis', { questionnaireScores, freeText, proxyMode, lang }).then(r => r.data)

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

export const checkSafetyPlanExists = (userCode, pin) =>
  client.get('/safety-plan', { params: { userCode, pin } })
    .then(() => true)
    .catch(err => err?.response?.status === 404 ? false : Promise.reject(err))

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

export const getWellbeingResources = () =>
  client.get('/wellbeing').then(r => r.data)

// ── Progress backup ──────────────────────────────────────────────────────────

export const saveProgressBackup = (data) =>
  client.post('/progress-backup', data).then(r => r.data)

export const getProgressBackup = (userCode, pin) =>
  client.get('/progress-backup', { params: { userCode, pin } }).then(r => r.data)

export const checkProgressBackupExists = (userCode, pin) =>
  client.get('/progress-backup/exists', { params: { userCode, pin } }).then(r => r.data.exists)

export const deleteProgressBackup = (userCode, pin) =>
  client.delete('/progress-backup', { params: { userCode, pin } }).then(r => r.data)
