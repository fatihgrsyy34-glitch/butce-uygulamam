import { useEffect } from "react";
import {
  ICONS,
  EK_ICONS,
  MENU_ITEMS,
  MOBIL_ANA_SEKMELER,
  MOBIL_KISA_ETIKET,
} from "../utils/menu";

// Telefon/tablet düzeni: üstte ince marka çubuğu, altta başparmakla erişilen
// sekme çubuğu. Sekmeye sığmayan sayfalar "Daha fazla" sayfasında.
// Masaüstündeki sidebar'a dokunulmuyor — bu bileşen CSS ile yalnızca
// dar ekranlarda görünür (styles/mobile.css).
export default function MobileNav({
  aktifSayfa,
  setAktifSayfa,
  tema,
  setTema,
  cikisYap,
  kullanici,
  sayfaAcik,
  setSayfaAcik,
}) {
  const anaSekmeler = MOBIL_ANA_SEKMELER.map((id) =>
    MENU_ITEMS.find((m) => m.id === id)
  ).filter(Boolean);
  const digerSayfalar = MENU_ITEMS.filter(
    (m) => !MOBIL_ANA_SEKMELER.includes(m.id)
  );

  // "Daha fazla" içindeki bir sayfadayken sekme çubuğunda o düğme işaretli kalsın
  const dahaFazlaAktif = !MOBIL_ANA_SEKMELER.includes(aktifSayfa);

  // Alt sayfa açıkken arkadaki sayfa kaymasın
  useEffect(() => {
    if (!sayfaAcik) return;
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = eski;
    };
  }, [sayfaAcik]);

  const gitVeKapat = (id) => {
    setAktifSayfa(id);
    setSayfaAcik(false);
  };

  const basHarfi = (kullanici?.isim || "?").trim().charAt(0).toLocaleUpperCase("tr-TR");

  return (
    <>
      <header className="mobil-ust-cubuk">
        <div className="mobil-marka">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="20" height="20" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5c-1.6 0-2.6.8-2.6 2s1 1.7 2.6 2 2.6.8 2.6 2-1 2-2.6 2m0-10.5c1.3 0 2.2.5 2.5 1.4M12 7.5V6m0 12v-1.5m0 0c-1.3 0-2.2-.5-2.5-1.4" />
          </svg>
          <span>Bütçem</span>
        </div>
        <button
          className="mobil-ikon-btn"
          onClick={() => setTema(tema === "dark" ? "light" : "dark")}
          aria-label={tema === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
        >
          {tema === "dark" ? EK_ICONS.gunes : EK_ICONS.ay}
        </button>
      </header>

      <nav className="mobil-sekme-cubugu" aria-label="Ana gezinme">
        {anaSekmeler.map((item) => (
          <button
            key={item.id}
            onClick={() => gitVeKapat(item.id)}
            className={`mobil-sekme ${aktifSayfa === item.id && !sayfaAcik ? "active" : ""}`}
            aria-current={aktifSayfa === item.id ? "page" : undefined}
          >
            <span className="mobil-sekme-ikon">{ICONS[item.id]}</span>
            <span className="mobil-sekme-etiket">
              {MOBIL_KISA_ETIKET[item.id] || item.label}
            </span>
          </button>
        ))}
        <button
          onClick={() => setSayfaAcik(!sayfaAcik)}
          className={`mobil-sekme ${sayfaAcik || dahaFazlaAktif ? "active" : ""}`}
          aria-expanded={sayfaAcik}
        >
          <span className="mobil-sekme-ikon">
            {sayfaAcik ? EK_ICONS.kapat : EK_ICONS.dahaFazla}
          </span>
          <span className="mobil-sekme-etiket">Daha fazla</span>
        </button>
      </nav>

      <div
        className={`mobil-perde ${sayfaAcik ? "acik" : ""}`}
        onClick={() => setSayfaAcik(false)}
        aria-hidden="true"
      />

      <div className={`mobil-sayfa ${sayfaAcik ? "acik" : ""}`} role="dialog" aria-label="Diğer sayfalar">
        <div className="mobil-sayfa-tutamac" />

        <div className="mobil-sayfa-kullanici">
          <div className="mobil-avatar">{basHarfi}</div>
          <div style={{ minWidth: 0 }}>
            <div className="mobil-kullanici-isim">{kullanici?.isim}</div>
            <div className="mobil-kullanici-alt">Kişisel Defter</div>
          </div>
        </div>

        <div className="mobil-sayfa-izgara">
          {digerSayfalar.map((item) => (
            <button
              key={item.id}
              onClick={() => gitVeKapat(item.id)}
              className={`mobil-sayfa-btn ${aktifSayfa === item.id ? "active" : ""}`}
            >
              <span className="mobil-sayfa-ikon">{ICONS[item.id]}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <button onClick={cikisYap} className="mobil-cikis-btn">
          {EK_ICONS.cikis}
          <span>Çıkış Yap</span>
        </button>
      </div>
    </>
  );
}
