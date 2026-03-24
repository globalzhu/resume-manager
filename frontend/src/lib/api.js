const BASE = '/api'

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status}: ${text}`)
  }
  return res.json()
}

export const api = {
  // Resumes
  listResumes: (params) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/resumes?${qs}`)
  },
  getResumes: (params) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/resumes?${qs}`)
  },
  getResume: (id) => request(`/resumes/${id}`),
  updateResume: (id, data) => request(`/resumes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteResume: (id) => request(`/resumes/${id}`, { method: 'DELETE' }),
  bulkAction: (data) => request('/resumes/bulk', { method: 'POST', body: JSON.stringify(data) }),

  // Import & Upload
  importResumes: () => request('/resumes/import', { method: 'POST' }),
  uploadResume: (file) => {
    const form = new FormData()
    form.append('file', file)
    return fetch(`${BASE}/resumes/upload`, { method: 'POST', body: form }).then(r => r.json())
  },

  // Parse
  parseResume: (id) => request(`/resumes/${id}/parse`, { method: 'POST' }),
  parseBatch: (ids) => request('/resumes/parse-batch', { method: 'POST', body: JSON.stringify(ids) }),

  // File
  getFileUrl: (id) => `${BASE}/resumes/${id}/file`,
  getResumeFileUrl: (id) => `${BASE}/resumes/${id}/file`,

  // Stats & Tags
  getStats: () => request('/stats'),
  getTags: () => request('/tags'),
  addTag: (id, tag) => request(`/resumes/${id}/tags`, { method: 'POST', body: JSON.stringify({ tag }) }),

  // Duplicates
  getDuplicates: () => request('/duplicates'),

  // Positions
  listPositions: (params) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/positions?${qs}`)
  },
  getPosition: (id) => request(`/positions/${id}`),
  createPosition: (data) => request('/positions', { method: 'POST', body: JSON.stringify(data) }),
  updatePosition: (id, data) => request(`/positions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePosition: (id) => request(`/positions/${id}`, { method: 'DELETE' }),

  // Position-Profile linking
  linkProfile: (posId, profileId) => request(`/positions/${posId}/profiles`, { method: 'POST', body: JSON.stringify({ profile_id: profileId }) }),
  unlinkProfile: (posId, profileId) => request(`/positions/${posId}/profiles/${profileId}`, { method: 'DELETE' }),

  // Candidate Profiles
  listProfiles: (params) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/profiles?${qs}`)
  },
  getProfile: (id) => request(`/profiles/${id}`),
  createProfile: (data) => request('/profiles', { method: 'POST', body: JSON.stringify(data) }),
  updateProfile: (id, data) => request(`/profiles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProfile: (id) => request(`/profiles/${id}`, { method: 'DELETE' }),

  // Matching
  matchResumes: (posId, limit = 20) => request(`/positions/${posId}/match?limit=${limit}`),

  // Speech to text
  speechToText: (file) => {
    const form = new FormData()
    form.append('file', file)
    return fetch(`${BASE}/speech-to-text`, { method: 'POST', body: form }).then(r => r.json())
  },
}
