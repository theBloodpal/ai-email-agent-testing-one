import axios from 'axios';

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000") + "/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Auth
export const register = async (data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  app_password?: string;
}) => api.post('/register', data);

export const login = async (data: { email: string; password: string }) =>
  api.post('/login', data);

// Senders
export const addSender = async (data: {
  user_id: number;
  name: string;
  organization_name: string;
  email: string;
  password: string;
}) => api.post('/senders/add', data);

export const getSenders = async (userId: number) =>
  api.get(`/senders/${userId}`);

export const selectSender = async (senderId: number) =>
  api.post('/senders/select', { sender_id: senderId });

// Excel Upload
export const uploadExcel = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload-excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const uploadAttachments = async (files: File[]) => {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));
  return api.post('/upload-attachments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// Message
export const generateMessage = async (objective: string) =>
  api.post('/generate-message', { objective });

export const enhanceMessage = async (message: string) =>
  api.post('/enhance-message', { message });

export const previewMessages = async (
  messageTemplate: string,
  limit: number = 5
) =>
  api.post('/preview', { message_template: messageTemplate, limit });

// Send
export const sendMessages = async (
  subject: string,
  messageTemplate: string
) => api.post('/send', { subject, message_template: messageTemplate });

export const stopSend = async (jobId?: string) =>
  api.post('/stop', jobId ? { job_id: jobId } : {});

export const resetStop = async () => api.post('/stop/reset');

export const getSendStatus = async () => api.get('/send-status');

// Manual Mode
export const initManual = async (subject: string, messageTemplate: string) =>
  api.post('/manual/init', { subject, message_template: messageTemplate });

export const previewManual = async () => api.post('/manual/preview');

export const sendManual = async (subject: string, messageTemplate: string) =>
  api.post('/manual/send', { subject, message_template: messageTemplate });

export const skipManual = async () => api.post('/manual/skip');

export const getManualStatus = async () => api.get('/manual/status');

export const peekManual = async (index?: number) =>
  api.get('/manual/peek', { params: index !== undefined ? { index } : {} });

export const prevManual = async () => api.post('/manual/go-prev');

export const nextManual = async () => api.post('/manual/go-next');

export const listManual = async () => api.get('/manual/list');

// Email Insights
export const queryEmailInsights = async (
  question: string,
  maxEmails: number = 0,
  useMemory: boolean = false
) =>
  api.post('/email-insights/query', {
    question,
    max_emails: maxEmails,
    use_memory: useMemory,
    history: [],
  });

export const indexEmails = async (limit?: number, mode?: string) =>
  api.post('/email-insights/index', null, { params: { limit, mode } });

export const searchEmails = async (query: string, topK?: number) =>
  api.get('/email-insights/search', { params: { q: query, top_k: topK } });

export const getRecentEmails = async (limit?: number) =>
  api.get('/email-insights/recent', { params: { limit } });

export const getEmailByUid = async (uid: string) =>
  api.get(`/email/uid/${uid}`);

// Email Actions
export const emailAction = async (action: string, uid: string) =>
  api.post('/email-insights/action', { action, uid });

export const emailBulkAction = async (action: string, uids: string[]) =>
  api.post('/email-insights/action-bulk', { action, uids });

// Chat History
export const getChatHistory = async (userId: number, limit?: number) =>
  api.get('/chat/history', { params: { user_id: userId, limit } });

export const addChatTurn = async (
  userId: number,
  role: 'user' | 'assistant',
  content: string
) => api.post('/chat/turn', { user_id: userId, role, content });

// Bounces
export const getBounces = async () => api.get('/bounces');

export default api;