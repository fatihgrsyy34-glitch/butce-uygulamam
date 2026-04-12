// src/utils/categories.js

export const CATEGORY_COLORS = {
  // Harcamalar
  "Market": { color: "#f97316", icon: "🛒", bg: "rgba(249, 115, 22, 0.15)" },
  "Yemek & Restoran": { color: "#ef4444", icon: "🍔", bg: "rgba(239, 68, 68, 0.15)" },
  "Ulaşım": { color: "#3b82f6", icon: "🚌", bg: "rgba(59, 130, 246, 0.15)" },
  "Giyim": { color: "#ec4899", icon: "👚", bg: "rgba(236, 72, 153, 0.15)" },
  "Sağlık": { color: "#10b981", icon: "💊", bg: "rgba(16, 185, 129, 0.15)" },
  "Eğlence": { color: "#8b5cf6", icon: "🍿", bg: "rgba(139, 92, 246, 0.15)" },
  "Faturalar": { color: "#eab308", icon: "💡", bg: "rgba(234, 179, 8, 0.15)" },
  "Eğitim": { color: "#06b6d4", icon: "🎓", bg: "rgba(6, 182, 212, 0.15)" },
  // Gelirler
  "Maaş": { color: "#22c55e", icon: "💵", bg: "rgba(34, 197, 94, 0.15)" },
  "Ek Gelir": { color: "#10b981", icon: "💰", bg: "rgba(16, 185, 129, 0.15)" },
  "Kira": { color: "#14b8a6", icon: "🏠", bg: "rgba(20, 184, 166, 0.15)" },
  // Ortak/Diğer
  "Diğer": { color: "#94a3b8", icon: "📦", bg: "rgba(148, 163, 184, 0.15)" },
};

export const getCategoryData = (kategoriAd) => {
  return CATEGORY_COLORS[kategoriAd] || CATEGORY_COLORS["Diğer"];
};
