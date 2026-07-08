import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import Gelirler from "./pages/Gelirler";
import Harcamalar from "./pages/Harcamalar";
import Kartlar from "./pages/Kartlar";
import Yatirimlar from "./pages/Yatirimlar";
import Hedefler from "./pages/Hedefler";
import EkstreYukle from "./pages/EkstreYukle";
import KrediKartTakip from "./pages/KrediKartTakip";
import AiSohbet from "./pages/AiSohbet";
import Dagilim from "./pages/Dagilim";
import Grafikler from "./pages/Grafikler";
import Login from "./pages/Login";
import { authAPI } from "./services/api";
import "./App.css";

const I = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" width="18" height="18">{p}</svg>
);

const ICONS = {
  dashboard: I(<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>),
  ekstre: I(<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M12 18v-6m0 0-2.2 2.2M12 12l2.2 2.2" /></>),
  gelirler: I(<><path d="M4 17 10 11l4 4 6-7" /><path d="M20 8v4m0-4h-4" /></>),
  harcamalar: I(<><path d="M4 7 10 13l4-4 6 7" /><path d="M20 16v-4m0 4h-4" /></>),
  kartlar: I(<><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M3 10h18M7 15h4" /></>),
  "kart-takip": I(<><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></>),
  yatirimlar: I(<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>),
  hedefler: I(<><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r=".6" fill="currentColor" /></>),
  dagilim: I(<><path d="M12 3a9 9 0 1 0 9 9h-9z" /><path d="M12 3v9h9A9 9 0 0 0 12 3z" opacity=".5" /></>),
  grafikler: I(<><path d="M4 19V5M4 19h16" /><path d="m7 15 4-4 3 3 5-6" /></>),
  ai: I(<><path d="M12 3v3M6 8h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" /><circle cx="9" cy="13" r="1.1" fill="currentColor" /><circle cx="15" cy="13" r="1.1" fill="currentColor" /></>),
};

const MENU_ITEMS = [
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

function App() {
  const [aktifSayfa, setAktifSayfa] = useState("dashboard");
  const [kullanici, setKullanici] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [tema, setTema] = useState(() => localStorage.getItem("tema") || "dark");

  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    localStorage.setItem("tema", tema);
  }, [tema]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      authAPI
        .beniGetir()
        .then(({ data }) => setKullanici(data))
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setYukleniyor(false));
    } else {
      setYukleniyor(false);
    }
  }, []);

  const cikisYap = () => {
    localStorage.removeItem("token");
    setKullanici(null);
  };

  if (yukleniyor) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)", color: "var(--text-primary)", fontFamily: "var(--font-family)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: "34px", fontWeight: 700, color: "var(--accent-primary)" }}>Bütçem</div>
          <div style={{ opacity: 0.5, marginTop: 8, fontSize: 13 }}>Yükleniyor…</div>
        </div>
      </div>
    );
  }

  if (!kullanici) {
    return <Login onLogin={(k) => setKullanici(k)} />;
  }

  const renderPage = () => {
    switch (aktifSayfa) {
      case "dashboard": return <Dashboard />;
      case "gelirler": return <Gelirler />;
      case "harcamalar": return <Harcamalar />;
      case "kartlar": return <Kartlar />;
      case "kart-takip": return <KrediKartTakip />;
      case "yatirimlar": return <Yatirimlar />;
      case "hedefler": return <Hedefler />;
      case "ekstre": return <EkstreYukle />;
      case "ai": return <AiSohbet />;
      case "dagilim": return <Dagilim />;
      case "grafikler": return <Grafikler />;
      default: return <Dashboard />;
    }
  };

  const basHarfi = (kullanici.isim || "?").trim().charAt(0).toLocaleUpperCase("tr-TR");

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22" style={{ color: "var(--accent-primary)" }}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5c-1.6 0-2.6.8-2.6 2s1 1.7 2.6 2 2.6.8 2.6 2-1 2-2.6 2m0-10.5c1.3 0 2.2.5 2.5 1.4M12 7.5V6m0 12v-1.5m0 0c-1.3 0-2.2-.5-2.5-1.4" />
          </svg>
          <span>Bütçem</span>
        </div>
        <div className="sidebar-user">Kişisel Defter</div>

        <nav className="sidebar-nav">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setAktifSayfa(item.id)}
              className={`nav-btn ${aktifSayfa === item.id ? "active" : ""}`}
            >
              <span className="nav-icon" style={{ display: "inline-flex" }}>{ICONS[item.id]}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button onClick={() => setTema(tema === "dark" ? "light" : "dark")} className="theme-toggle">
          <span className="nav-icon" style={{ display: "inline-flex" }}>
            {tema === "dark"
              ? I(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>)
              : I(<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />)}
          </span>
          <span>{tema === "dark" ? "Açık tema" : "Koyu tema"}</span>
        </button>

        <div className="flex items-center gap-sm" style={{ marginTop: "8px", paddingTop: "14px", borderTop: "1px solid var(--bg-card-border)" }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--accent-soft)", color: "var(--accent-primary)", fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 15 }}>{basHarfi}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{kullanici.isim}</div>
          </div>
        </div>

        <button onClick={cikisYap} className="logout-btn">
          {I(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>)}
          <span>Çıkış Yap</span>
        </button>
      </aside>

      <main className="main-content" key={aktifSayfa}>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
