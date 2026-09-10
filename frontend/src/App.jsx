import { useState, useEffect, lazy, Suspense } from "react";
// Sayfalar tembel yükleniyor: recharts tek başına paketin büyük kısmıydı ve
// yalnızca Grafikler ile Para Dağılımı'nda kullanılıyor. Böylece ilk açılışta
// sadece görüntülenen sayfanın kodu iniyor — telefonda mobil veriyle fark ediyor.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Gelirler = lazy(() => import("./pages/Gelirler"));
const Harcamalar = lazy(() => import("./pages/Harcamalar"));
const Kartlar = lazy(() => import("./pages/Kartlar"));
const Yatirimlar = lazy(() => import("./pages/Yatirimlar"));
const Hedefler = lazy(() => import("./pages/Hedefler"));
const EkstreYukle = lazy(() => import("./pages/EkstreYukle"));
const KrediKartTakip = lazy(() => import("./pages/KrediKartTakip"));
const AiSohbet = lazy(() => import("./pages/AiSohbet"));
const Dagilim = lazy(() => import("./pages/Dagilim"));
const Grafikler = lazy(() => import("./pages/Grafikler"));
const Login = lazy(() => import("./pages/Login"));
import MobileNav from "./components/MobileNav";
import { ICONS, EK_ICONS, MENU_ITEMS } from "./utils/menu";
import { authAPI } from "./services/api";
import "./App.css";

function TamEkranYukleniyor() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)", color: "var(--text-primary)", fontFamily: "var(--font-family)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: "34px", fontWeight: 700, color: "var(--accent-primary)" }}>Bütçem</div>
        <div style={{ opacity: 0.5, marginTop: 8, fontSize: 13 }}>Yükleniyor…</div>
      </div>
    </div>
  );
}

function App() {
  const [aktifSayfa, setAktifSayfa] = useState("dashboard");
  const [kullanici, setKullanici] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [tema, setTema] = useState(() => localStorage.getItem("tema") || "dark");
  // Mobilde "Daha fazla" alt sayfasının açık/kapalı durumu
  const [mobilSayfaAcik, setMobilSayfaAcik] = useState(false);

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
    setMobilSayfaAcik(false);
  };

  if (yukleniyor) return <TamEkranYukleniyor />;

  if (!kullanici) {
    return (
      <Suspense fallback={<TamEkranYukleniyor />}>
        <Login onLogin={(k) => setKullanici(k)} />
      </Suspense>
    );
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
      {/* Masaüstü sidebar'ı — mobilde CSS ile gizlenir (styles/mobile.css) */}
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
            {tema === "dark" ? EK_ICONS.gunes : EK_ICONS.ay}
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
          {EK_ICONS.cikis}
          <span>Çıkış Yap</span>
        </button>
      </aside>

      {/* Mobil kabuk — masaüstünde CSS ile gizlenir */}
      <MobileNav
        aktifSayfa={aktifSayfa}
        setAktifSayfa={setAktifSayfa}
        tema={tema}
        setTema={setTema}
        cikisYap={cikisYap}
        kullanici={kullanici}
        sayfaAcik={mobilSayfaAcik}
        setSayfaAcik={setMobilSayfaAcik}
      />

      <main className="main-content" key={aktifSayfa}>
        {/* Sayfa parçası inerken içerik alanında hafif bir gösterge kalsın;
            kabuk (üst çubuk / sekmeler) yerinde durduğu için sıçrama olmuyor. */}
        <Suspense fallback={<div className="empty-state">Yükleniyor…</div>}>
          {renderPage()}
        </Suspense>
      </main>
    </div>
  );
}

export default App;
