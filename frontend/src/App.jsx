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

const MENU_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "ekstre", label: "Ekstre Yükle", icon: "📄" },
  { id: "gelirler", label: "Gelirler", icon: "💵" },
  { id: "harcamalar", label: "Harcamalar", icon: "💸" },
  { id: "kartlar", label: "Kartlar", icon: "💳" },
  { id: "kart-takip", label: "Kredi Kart Takip", icon: "🧾" },
  { id: "yatirimlar", label: "Yatırımlar", icon: "📈" },
  { id: "hedefler", label: "Hedefler", icon: "🎯" },
  { id: "dagilim", label: "Para Dağılımı", icon: "💡" },
  { id: "grafikler", label: "Grafikler", icon: "📉" },
  { id: "ai", label: "AI Asistan", icon: "🤖" },
];

function App() {
  const [aktifSayfa, setAktifSayfa] = useState("dashboard");
  const [kullanici, setKullanici] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);

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
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary)",
          color: "var(--text-primary)",
          fontSize: "16px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>💰</div>
          <div style={{ opacity: 0.6 }}>Yükleniyor...</div>
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

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">💰 Bütçem</div>
        <div className="sidebar-user">Hoş geldin, {kullanici.isim} 👋</div>

        <nav className="sidebar-nav">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setAktifSayfa(item.id)}
              className={`nav-btn ${aktifSayfa === item.id ? "active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button onClick={cikisYap} className="logout-btn">
          🚪 Çıkış Yap
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content" key={aktifSayfa}>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;