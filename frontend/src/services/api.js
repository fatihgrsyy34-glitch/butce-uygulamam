import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Her istekte token'ı otomatik ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 hatalarında otomatik logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  giris: (email, sifre) => api.post("/giris", { email, sifre }),
  kayit: (isim, email, sifre) => api.post("/kayit", { isim, email, sifre }),
  beniGetir: () => api.get("/beni-getir"),
};

export const gelirAPI = {
  getirAll: () => api.get("/gelirler"),
  ekle: (veri) => api.post("/gelirler", veri),
  sil: (id) => api.delete(`/gelirler/${id}`),
};

export const harcamaAPI = {
  getirAll: () => api.get("/harcamalar"),
  ekle: (veri) => api.post("/harcamalar", veri),
  sil: (id) => api.delete(`/harcamalar/${id}`),
};

export const kartAPI = {
  getirAll: () => api.get("/kartlar"),
  ekle: (veri) => api.post("/kartlar", veri),
  sil: (id) => api.delete(`/kartlar/${id}`),
};

export const yatirimAPI = {
  getirAll: () => api.get("/yatirimlar"),
  ekle: (veri) => api.post("/yatirimlar", veri),
  sil: (id) => api.delete(`/yatirimlar/${id}`),
};

export const hedefAPI = {
  getirAll: () => api.get("/hedefler"),
  ekle: (veri) => api.post("/hedefler", veri),
  sil: (id) => api.delete(`/hedefler/${id}`),
};

export const dashboardAPI = {
  getir: (ay) => api.get("/dashboard", { params: { ay } }),
};

export const aiAPI = {
  sohbet: (soru, gecmis) => api.post("/ai-sohbet", { soru, gecmis }),
};

export const dagilimAPI = {
  hesapla: (gelir, profilAdi) => api.post("/dagilim-hesapla", { gelir, profilAdi }),
};

export const ekstreAPI = {
  getirAll: () => api.get("/ekstreler"),
  harcamalariGetir: (id) => api.get(`/ekstreler/${id}/harcamalar`),
  sil: (id) => api.delete(`/ekstreler/${id}`),
};

export const kuralAPI = {
  getirAll: () => api.get("/kurallar"),
  guncelle: (kurallar) => api.put("/kurallar", { kurallar }),
  profilEkle: (profilAdi) => api.post("/kurallar/profil", { profilAdi }),
  profilSil: (profilAdi) => api.delete(`/kurallar/profil/${encodeURIComponent(profilAdi)}`),
};























export default api;