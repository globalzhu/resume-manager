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

  // Stats & Tags
  getStats: () => request('/stats'),
  getTags: () => request('/tags'),
  addTag: (id, tag) => request(`/resumes/${id}/tags`, { method: 'POST', body: JSON.stringify({ tag }) }),

  // Duplicates
  getDuplicates: () => request('/duplicates'),
}
