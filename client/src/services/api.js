const BASE_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('applypilot_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ════════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════════

export const registerRequest = async (name, email, password) => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Registration failed');
  return data;
};

export const loginRequest = async (email, password) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Login failed');
  return data;
};

export const getMeRequest = async (token) => {
  const response = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Could not verify session');
  return data;
};

// NEW: save/update the user's resume
export const updateResumeRequest = async (resume) => {
  const response = await fetch(`${BASE_URL}/auth/resume`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ resume }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Could not save resume');
  return data;
};

// ════════════════════════════════════════════════════════════════
// APPLICATIONS
// ════════════════════════════════════════════════════════════════

export const analyzeApplication = async (formData) => {
  const response = await fetch(`${BASE_URL}/applications/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(formData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Something went wrong');
  return data;
};

export const getApplications = async () => {
  const response = await fetch(`${BASE_URL}/applications`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Could not fetch applications');
  return data;
};

export const getApplicationById = async (id) => {
  const response = await fetch(`${BASE_URL}/applications/${id}`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Could not fetch this application');
  return data;
};

export const researchApplication = async (id) => {
  const response = await fetch(`${BASE_URL}/applications/${id}/research`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Research failed');
  return data;
};

export const updateApplicationStatus = async (id, status) => {
  const response = await fetch(`${BASE_URL}/applications/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ status }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Could not update status');
  return data;
};

// NEW: edit the AI-generated bullets/cover letter after the fact
export const updateApplicationContent = async (id, updates) => {
  const response = await fetch(`${BASE_URL}/applications/${id}/content`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(updates),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Could not save changes');
  return data;
};

export const deleteApplication = async (id) => {
  const response = await fetch(`${BASE_URL}/applications/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Could not delete application');
  return data;
};