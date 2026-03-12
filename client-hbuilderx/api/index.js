import { get, post, put, del } from '../utils/request';

export const authApi = {
  login: (data) => post('/auth/login', data),
  register: (data) => post('/auth/register', data),
  getProfile: () => get('/auth/profile'),
  updateProfile: (data) => put('/auth/profile', data),
  getMyClubs: () => get('/auth/my-clubs'),
  getMyActivities: () => get('/auth/my-activities'),
  getMyRegistrations: () => get('/auth/my-registrations'),
  getMyCheckins: () => get('/auth/my-checkins')
};

export const clubApi = {
  getList: (params) => get('/clubs', params),
  getDetail: (id) => get(`/clubs/${id}`),
  create: (data) => post('/clubs', data),
  update: (id, data) => put(`/clubs/${id}`, data),
  getActivities: (id) => get(`/clubs/${id}/activities`),
  getPending: () => get('/clubs/admin/pending'),
  approve: (id) => put(`/clubs/${id}/approve`),
  reject: (id) => put(`/clubs/${id}/reject`)
};

export const memberApi = {
  join: (clubId) => post(`/members/${clubId}/join`),
  leave: (clubId) => post(`/members/${clubId}/leave`),
  getMembers: (clubId) => get(`/members/${clubId}/members`),
  updateRole: (clubId, userId, data) => put(`/members/${clubId}/members/${userId}/role`, data),
  remove: (clubId, userId) => del(`/members/${clubId}/members/${userId}`)
};

export const activityApi = {
  getList: (params) => get('/activities', params),
  getDetail: (id) => get(`/activities/${id}`),
  create: (data) => post('/activities', data),
  update: (id, data) => put(`/activities/${id}`, data),
  remove: (id) => del(`/activities/${id}`),
  register: (id, data) => post(`/activities/${id}/register`, data),
  reviewRegistration: (activityId, regId, data) => put(`/activities/${activityId}/registrations/${regId}`, data),
  generateCheckinCode: (id) => post(`/activities/${id}/checkin-code`),
  disableCheckinCode: (id) => post(`/activities/${id}/checkin-code/disable`)
};

export const checkinApi = {
  checkIn: (activityId, data) => post(`/checkin/${activityId}`, data),
  getList: (activityId) => get(`/checkin/${activityId}`),
  getStatus: (activityId) => get(`/checkin/${activityId}/status`)
};

export const feedbackApi = {
  submit: (activityId, data) => post(`/feedback/${activityId}`, data),
  getList: (activityId, params) => get(`/feedback/${activityId}`, params)
};
