import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { kuralAPI, dagilimAPI, gelirAPI } from "../services/api";

const RENKLER = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

function Dagilim() {
  const [profiller, setProfiller] = useState([]);
  const [aktifProfil, setAktifProfil] = useState(null);
  const [duzenlemeModu, setDuzenlemeModu] = useState(false);
  const [kurallarAcik, setKurallarAcik] = useState(false);
  const [yeniProfilAdi, setYeniProfilAdi] = useState("");
  const [kurallar, setKurallar] = useState([]);
  const [gelir, setGelir] = useState(0);
  const [manuelGelir, setManuelGelir] = useState("");
  const [sonuc, setSonuc] = useState(null);
  const [manuelSonuc, setManuelSonuc] = useState(null);
  const [kaydetMesaj, setKaydetMesaj] = useState("");

  useEffect(() => {
    profillerYukle();
    gelirAPI.getirAll().then((res) => {
      const buAy = new Date().toISOString().slice(0, 7);
      const toplamGelir = res.data
        .filter(g => g.tarih.startsWith(buAy))
        .reduce((sum, g) => sum + g.miktar, 0);
      setGelir(toplamGelir);
    });
  }, []);

  useEffect(() => {
    if (gelir > 0 && aktifProfil) {
      dagilimAPI.hesapla(gelir, aktifProfil).then((res) => setSonuc(res.data));
    }
  }, [gelir, aktifProfil]);

  const profillerYukle = () => {
    kuralAPI.getirAll().then((res) => {
      const data = res.data;
      const profilMap = {};
      data.forEach(k => {
        if (!profilMap[k.profil_adi]) profilMap[k.profil_adi] = [];
        profilMap[k.profil_adi].push(k);
      });
      const profilListesi = Object.keys(profilMap).map(ad => ({
        ad,
        kurallar: profilMap[ad],
        aktif: profilMap[ad][0]?.aktif === 1
      }));
      setProfiller(profilListesi);
      const aktif = profilListesi.find(p => p.aktif) || profilListesi[0];
      if (aktif) {
        setAktifProfil(aktif.ad);
        setKurallar(aktif.kurallar);
      }
    });
  };

  const handleProfilSec = (profilAdi) => {
    const profil = profiller.find(p => p.ad === profilAdi);
    setAktifProfil(profilAdi);
    setKurallar(profil.kurallar);
    setSonuc(null);
    setManuelSonuc(null);
    setDuzenlemeModu(false);
  };

  const handleProfilSil = (profilAdi) => {
    if (profiller.length === 1) {
      alert("En az bir profil olmalı, silemezsin!");
      return;
    }
    if (window.confirm(`"${profilAdi}" profilini silmek istediğine emin misin?`)) {
      kuralAPI.profilSil(profilAdi).then(() => {
        const yeniProfiller = profiller.filter(p => p.ad !== profilAdi);
        setProfiller(yeniProfiller);
        if (aktifProfil === profilAdi) {
          setAktifProfil(yeniProfiller[0].ad);
          setKurallar(yeniProfiller[0].kurallar);
        }
        setSonuc(null);
      });
    }
  };

  const handleYuzdeGuncelle = (index, deger) => {
    const yeni = [...kurallar];
    yeni[index] = { ...yeni[index], yuzde: parseFloat(deger) || 0 };
    setKurallar(yeni);
  };

  const toplamYuzde = kurallar.reduce((sum, k) => sum + (parseFloat(k.yuzde) || 0), 0);

  const handleKaydet = () => {
    if (Math.abs(toplamYuzde - 100) > 0.01) {
      alert(`Yüzdeler toplamı 100 olmalı! Şu an: ${toplamYuzde}`);
      return;
    }
    kuralAPI.guncelle(kurallar).then(() => {
      setKaydetMesaj("✅ Kaydedildi!");
      setDuzenlemeModu(false);
      setTimeout(() => setKaydetMesaj(""), 3000);
    });
  };

  const handleYeniProfil = () => {
    if (!yeniProfilAdi.trim()) return;
    kuralAPI.profilEkle(yeniProfilAdi).then((res) => {
      const yeniKurallar = res.data;
      setProfiller([...profiller, { ad: yeniProfilAdi, kurallar: yeniKurallar, aktif: false }]);
      setAktifProfil(yeniProfilAdi);
      setKurallar(yeniKurallar);
      setYeniProfilAdi("");
      setDuzenlemeModu(true);
    });
  };

  const handleHesapla = () => {
    if (!gelir || gelir <= 0) return;
    dagilimAPI.hesapla(parseFloat(gelir), aktifProfil).then((res) => setSonuc(res.data));
  };

  const handleManuelHesapla = () => {
    const miktar = parseFloat(manuelGelir);
    if (!miktar || miktar <= 0) return;
    dagilimAPI.hesapla(miktar, aktifProfil).then((res) => setManuelSonuc(res.data));
  };

  const DagilimListesi = ({ dagilim }) => (
    <div className="flex items-center gap-lg flex-wrap mt-lg">
      <div className="flex-1" style={{ minWidth: "250px" }}>
        <div className="flex flex-col gap-sm">
          {dagilim.map((d, i) => (
            <div key={i} className="list-item" style={{ padding: "12px 16px", background: "var(--bg-secondary)" }}>
              <div className="flex items-center gap-sm">
                <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: RENKLER[i % RENKLER.length], display: "inline-block" }} />
                <strong className="text-primary">{d.kategori} <span className="text-muted text-sm">(%{d.yuzde})</span></strong>
              </div>
              <strong style={{ color: RENKLER[i % RENKLER.length] }}>₺{d.miktar.toLocaleString("tr-TR")}</strong>
            </div>
          ))}
        </div>
      </div>
      <PieChart width={300} height={300}>
        <Pie data={dagilim.filter(d => d.miktar > 0)} dataKey="miktar" nameKey="kategori" cx="50%" cy="50%" innerRadius={70} outerRadius={110} stroke="none">
          {dagilim.filter(d => d.miktar > 0).map((_, i) => (
            <Cell key={i} fill={RENKLER[i % RENKLER.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(val) => `₺${val.toLocaleString("tr-TR")}`} cursor={{fill: 'transparent'}} />
        <Legend iconType="circle" />
      </PieChart>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Akıllı Para Dağılımı</h2>
        <p className="page-subtitle">Gelirinizi kurallarınıza göre otomatik paylaştırın</p>
      </div>

      {/* Profil Seçici */}
      <div className="card mb-lg">
        <div className="flex items-center gap-sm flex-wrap">
          <div className="tab-bar">
            {profiller.map(p => (
              <div key={p.ad} className="flex items-center">
                <button
                  onClick={() => handleProfilSec(p.ad)}
                  className={`tab-btn ${aktifProfil === p.ad ? "active" : ""}`}
                  style={{ borderRadius: "var(--radius-sm) 0 0 var(--radius-sm)" }}
                >
                  {p.ad}
                </button>
                <button
                  onClick={() => handleProfilSil(p.ad)}
                  className="tab-btn"
                  style={{
                    padding: "8px",
                    color: "var(--red)",
                    borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
                    background: aktifProfil === p.ad ? "var(--bg-card)" : "transparent"
                  }}
                  title="Profili Sil"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-sm ml-auto">
            <input
              type="text"
              placeholder="Yeni profil adı..."
              value={yeniProfilAdi}
              onChange={(e) => setYeniProfilAdi(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleYeniProfil()}
              className="input"
              style={{ width: "160px" }}
            />
            <button onClick={handleYeniProfil} className="btn btn-success">
              + Ekle
            </button>
          </div>
        </div>
      </div>

      {/* Kurallar — Düzenleme Modu */}
      {aktifProfil && (
        <div className="card mb-lg">
          <div className="flex justify-between items-center" style={{ marginBottom: kurallarAcik ? "var(--space-md)" : 0 }}>
            <h3 className="card-title" style={{ marginBottom: 0 }}>{aktifProfil} Profili Kuralları</h3>
            <div className="flex gap-sm">
              <button onClick={() => { setKurallarAcik(!kurallarAcik); if (kurallarAcik) setDuzenlemeModu(false); }} className="btn btn-secondary">
                {kurallarAcik ? "Gözü Yorma (Gizle)" : "👀 Kuralları Göster"}
              </button>
              {kurallarAcik && (
                <button onClick={() => setDuzenlemeModu(!duzenlemeModu)} className="btn btn-secondary">
                  {duzenlemeModu ? "İptal" : "✏️ Düzenle"}
                </button>
              )}
            </div>
          </div>
          
          {kurallarAcik && (
            <>
              <div className="flex flex-col gap-sm">
                {kurallar.map((k, i) => (
                  <div key={k.id} className="flex items-center justify-between">
                    <span style={{ width: "200px" }}>{k.kategori}</span>
                    {duzenlemeModu ? (
                      <div className="flex items-center gap-sm">
                        <input
                          type="number"
                          value={k.yuzde}
                          onChange={(e) => handleYuzdeGuncelle(i, e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="input"
                          style={{ width: "80px", textAlign: "right" }}
                        />
                        <span className="text-muted">%</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-lg flex-1">
                         <div className="progress-bar flex-1" style={{ height: "6px" }}>
                           <div className="progress-fill" style={{ width: `${k.yuzde}%`, background: RENKLER[i % RENKLER.length], animation: "none" }} />
                         </div>
                         <span className="text-muted" style={{ width: "40px", textAlign: "right" }}>%{k.yuzde}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {duzenlemeModu && (
                <div className="flex items-center gap-lg mt-lg" style={{ borderTop: "1px solid var(--bg-card-border)", paddingTop: "16px" }}>
                  <span className={`font-bold ${toplamYuzde === 100 ? 'text-green' : 'text-red'}`}>
                    Toplam: %{toplamYuzde}
                  </span>
                  <button onClick={handleKaydet} className="btn btn-primary ml-auto">
                    Değişiklikleri Kaydet
                  </button>
                  {kaydetMesaj && <span className="text-green text-sm">{kaydetMesaj}</span>}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="flex gap-lg flex-wrap">
        {/* Bu Aya Göre Dağılım */}
        <div className="card flex-1">
          <h3 className="card-title">Bu Aya Göre Dağılım</h3>
          <div className="flex gap-sm items-center mb-md">
            <div className="stat-card green" style={{ padding: "10px 20px" }}>
              <div className="stat-label">Bu Ayın Geliri</div>
              <div className="stat-value green">₺{gelir.toLocaleString("tr-TR")}</div>
            </div>
            <button onClick={handleHesapla} className="btn btn-primary" style={{ height: "40px" }}>
              Yeniden Hesapla
            </button>
          </div>
          {sonuc && <DagilimListesi dagilim={sonuc.dagilim} />}
        </div>

        {/* Manuel Hesapla */}
        <div className="card flex-1">
          <h3 className="card-title">Farklı Tutarla Hesapla</h3>
          <div className="input-group mb-md">
            <input
              type="number"
              placeholder="Tutar girin (₺)"
              value={manuelGelir}
              onChange={(e) => setManuelGelir(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="input"
              style={{ width: "200px" }}
            />
            <button onClick={handleManuelHesapla} className="btn btn-primary">
              Hesapla
            </button>
          </div>
          {manuelSonuc ? <DagilimListesi dagilim={manuelSonuc.dagilim} /> : <div className="empty-state">Hesaplamak için bir tutar girin.</div>}
        </div>
      </div>
    </div>
  );
}

export default Dagilim;