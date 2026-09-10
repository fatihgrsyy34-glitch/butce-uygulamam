// Menü tanımları — masaüstü sidebar'ı (App.jsx) ve mobil alt sekme çubuğu
// (components/MobileNav.jsx) aynı kaynağı kullanır ki ikisi ayrışmasın.

const ikon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" width="18" height="18">{p}</svg>
);

export const ICONS = {
  dashboard: ikon(<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>),
  ekstre: ikon(<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M12 18v-6m0 0-2.2 2.2M12 12l2.2 2.2" /></>),
  gelirler: ikon(<><path d="M4 17 10 11l4 4 6-7" /><path d="M20 8v4m0-4h-4" /></>),
  harcamalar: ikon(<><path d="M4 7 10 13l4-4 6 7" /><path d="M20 16v-4m0 4h-4" /></>),
  kartlar: ikon(<><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M3 10h18M7 15h4" /></>),
  "kart-takip": ikon(<><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></>),
  yatirimlar: ikon(<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>),
  hedefler: ikon(<><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r=".6" fill="currentColor" /></>),
  dagilim: ikon(<><path d="M12 3a9 9 0 1 0 9 9h-9z" /><path d="M12 3v9h9A9 9 0 0 0 12 3z" opacity=".5" /></>),
  grafikler: ikon(<><path d="M4 19V5M4 19h16" /><path d="m7 15 4-4 3 3 5-6" /></>),
  ai: ikon(<><path d="M12 3v3M6 8h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" /><circle cx="9" cy="13" r="1.1" fill="currentColor" /><circle cx="15" cy="13" r="1.1" fill="currentColor" /></>),
};

// Mobil'e özel ek ikonlar
export const EK_ICONS = {
  dahaFazla: ikon(<><circle cx="5" cy="12" r="1.6" fill="currentColor" /><circle cx="12" cy="12" r="1.6" fill="currentColor" /><circle cx="19" cy="12" r="1.6" fill="currentColor" /></>),
  kapat: ikon(<path d="M18 6 6 18M6 6l12 12" />),
  gunes: ikon(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>),
  ay: ikon(<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />),
  cikis: ikon(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>),
};

export const MENU_ITEMS = [
  { id: "dashboard", label: "Genel Bakış" },
  { id: "ekstre", label: "Ekstre Yükle" },
  { id: "gelirler", label: "Gelirler" },
  { id: "harcamalar", label: "Harcamalar" },
  { id: "kartlar", label: "Kartlar" },
  { id: "kart-takip", label: "Kredi Kart Takip" },
  { id: "yatirimlar", label: "Yatırımlar" },
  { id: "hedefler", label: "Hedefler" },
  { id: "dagilim", label: "Para Dağılımı" },
  { id: "grafikler", label: "Grafikler" },
  { id: "ai", label: "AI Asistan" },
];

// Alt sekme çubuğunda doğrudan görünen sayfalar. Beşinci slotu "Daha fazla"
// aldığı için dört tane: telefonda en sık dokunulacaklar önde.
// Sıralamayı değiştirmek istersen tek yapman gereken bu diziyi düzenlemek —
// kalan sayfalar otomatik olarak "Daha fazla" sayfasına düşer.
export const MOBIL_ANA_SEKMELER = ["dashboard", "harcamalar", "gelirler", "ai"];

// Alt sekmelerde uzun etiketler sığmıyor, kısaltılmış hallerini kullanıyoruz.
export const MOBIL_KISA_ETIKET = {
  dashboard: "Özet",
  harcamalar: "Harcama",
  gelirler: "Gelir",
  ai: "Asistan",
};
