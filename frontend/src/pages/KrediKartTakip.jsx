import { useState, useEffect } from "react";
import { ekstreAPI, kartAPI } from "../services/api";
import api from "../services/api";
import { getCategoryData } from "../utils/categories";

const AY_ISIMLERI = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

function KrediKartTakip() {
  const bugun = new Date();
  const guncelYil = bugun.getFullYear();

  const [ekstreler, setEkstreler] = useState([]);
  const [kartlar, setKartlar] = useState([]);
  const [acikEkstre, setAcikEkstre] = useState(null);
  const [harcamalar, setHarcamalar] = useState({});
  const [secilenKart, setSecilenKart] = useState("");
  const [secilenAyFiltre, setSecilenAyFiltre] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yukleAcik, setYukleAcik] = useState(false);

  // Yükleme formu state
  const [formKart, setFormKart] = useState("");
  const [formAy, setFormAy] = useState(AY_ISIMLERI[bugun.getMonth()]);
  const [formDosya, setFormDosya] = useState(null);
  const [formYukleniyor, setFormYukleniyor] = useState(false);
  const [formHata, setFormHata] = useState(null);
  const [formIsDragging, setFormIsDragging] = useState(false);

  useEffect(() => {
    Promise.all([ekstreAPI.getirAll(), kartAPI.getirAll()]).then(([eRes, kRes]) => {
      setEkstreler(eRes.data);
      setKartlar(kRes.data);
      setYukleniyor(false);
    });
  }, []);

  const toggleEkstre = async (id) => {
    if (acikEkstre === id) { setAcikEkstre(null); return; }
    setAcikEkstre(id);
    if (!harcamalar[id]) {
      const res = await ekstreAPI.harcamalariGetir(id);
      setHarcamalar((prev) => ({ ...prev, [id]: res.data }));
    }
  };

  const handleSil = async (id) => {
    if (!window.confirm("Bu ekstre ve tüm harcamaları silinecek. Emin misin?")) return;
    await ekstreAPI.sil(id);
    setEkstreler((prev) => prev.filter((e) => e.id !== id));
    setHarcamalar((prev) => { const k = { ...prev }; delete k[id]; return k; });
    if (acikEkstre === id) setAcikEkstre(null);
  };

  const handleYukle = async () => {
    if (!formDosya) { alert("Lütfen bir PDF dosyası seçin!"); return; }
    setFormYukleniyor(true);
    setFormHata(null);
    const formData = new FormData();
    formData.append("pdf", formDosya);
    formData.append("donem_adi", `${formAy} ${guncelYil}`);
    formData.append("sadece_takip", "1");
    if (formKart) formData.append("kart_id", formKart);
    try {
      await api.post("/ekstre-yukle", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });
      const res = await ekstreAPI.getirAll();
      setEkstreler(res.data);
      setFormDosya(null);
      setYukleAcik(false);
    } catch (err) {
      setFormHata(err.response?.data?.hata || err.message || "Bir hata oluştu");
    } finally {
      setFormYukleniyor(false);
    }
  };

  const kartListesi = [...new Map(ekstreler.filter(e => e.kart_id).map(e => [e.kart_id, { id: e.kart_id, isim: e.kart_isim, renk: e.kart_renk }])).values()];

  const filtrelenmis = ekstreler.filter((e) => {
    const kartEslesen = secilenKart ? String(e.kart_id) === secilenKart : true;
    const ayEslesen = secilenAyFiltre ? e.donem_adi.startsWith(secilenAyFiltre) : true;
    return kartEslesen && ayEslesen;
  });

  const toplamTutar = filtrelenmis.reduce((sum, e) => sum + e.toplam_tutar, 0);
  const toplamIslem = filtrelenmis.reduce((sum, e) => sum + e.harcama_sayisi, 0);

  if (yukleniyor) return <div className="empty-state">Yükleniyor...</div>;

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h2 className="page-title" style={{ color: "#a855f7" }}>Kredi Kart Takip</h2>
          <p className="page-subtitle">Ekstre bazında harcama takibi</p>
        </div>
        <button
          onClick={() => setYukleAcik(!yukleAcik)}
          className="btn"
          style={{ background: yukleAcik ? "rgba(168,85,247,0.15)" : "linear-gradient(135deg,#a855f7,#6366f1)", color: yukleAcik ? "#a855f7" : "#fff", border: "1px solid rgba(168,85,247,0.4)" }}
        >
          {yukleAcik ? "✕ Kapat" : "📤 Ekstre Yükle"}
        </button>
      </div>

      {/* Yükleme Paneli */}
      {yukleAcik && (
        <div className="card mb-lg" style={{ borderColor: "rgba(168,85,247,0.3)", background: "var(--bg-secondary)" }}>
          <h3 className="card-title" style={{ color: "#a855f7" }}>Sadece Takip İçin Ekstre Yükle</h3>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>Bu ekstreler yalnızca burada görünür, Harcamalar sekmesine yansımaz.</p>
          <div className="flex gap-md mb-md" style={{ flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "180px" }}>
              <label className="form-label">Dönem</label>
              <select value={formAy} onChange={(e) => setFormAy(e.target.value)} className="input" style={{ borderColor: "rgba(168,85,247,0.3)", background: "var(--bg-tertiary)" }}>
                {AY_ISIMLERI.map((ay) => (
                  <option key={ay} value={ay}>{ay} {guncelYil}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: "180px" }}>
              <label className="form-label">Kart (Opsiyonel)</label>
              <select value={formKart} onChange={(e) => setFormKart(e.target.value)} className="input" style={{ borderColor: "rgba(168,85,247,0.3)", background: "var(--bg-tertiary)" }}>
                <option value="">Kart seçin</option>
                {kartlar.map((k) => <option key={k.id} value={k.id}>{k.isim}</option>)}
              </select>
            </div>
          </div>
          <div
            onClick={() => document.getElementById("kktFileRef").click()}
            onDragOver={(e) => { e.preventDefault(); setFormIsDragging(true); }}
            onDragLeave={() => setFormIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setFormIsDragging(false); if (e.dataTransfer.files[0]) setFormDosya(e.dataTransfer.files[0]); }}
            className="upload-zone"
            style={{ borderColor: formIsDragging || formDosya ? "#a855f7" : "var(--bg-card-border)", background: formIsDragging || formDosya ? "rgba(168,85,247,0.08)" : "var(--bg-tertiary)", cursor: "pointer", marginBottom: "16px" }}
          >
            <input type="file" id="kktFileRef" accept=".pdf" onChange={(e) => setFormDosya(e.target.files[0])} style={{ display: "none" }} />
            {formDosya ? (
              <div><div style={{ fontSize: "36px", marginBottom: "8px" }}>📄</div><strong style={{ color: "#a855f7" }}>{formDosya.name}</strong></div>
            ) : (
              <div><div style={{ fontSize: "36px", marginBottom: "8px" }}>📥</div><strong style={{ color: "var(--text-primary)" }}>PDF Sürükle veya Tıkla</strong></div>
            )}
          </div>
          {formHata && <div style={{ color: "var(--red)", fontSize: "13px", marginBottom: "12px" }}>❌ {formHata}</div>}
          <button onClick={handleYukle} disabled={formYukleniyor || !formDosya} className="btn"
            style={{ background: formYukleniyor || !formDosya ? "rgba(168,85,247,0.2)" : "linear-gradient(135deg,#a855f7,#6366f1)", color: "#fff", width: "220px", justifyContent: "center" }}>
            {formYukleniyor ? "⏳ Analiz ediliyor..." : "🚀 Yükle & Kaydet"}
          </button>
        </div>
      )}

      {/* Filtreler */}
      <div className="flex gap-sm mb-lg" style={{ flexWrap: "wrap" }}>
        <select value={secilenAyFiltre} onChange={(e) => setSecilenAyFiltre(e.target.value)} className="input"
          style={{ width: "auto", background: "var(--bg-secondary)", borderColor: "rgba(168,85,247,0.3)", color: "var(--text-primary)", fontWeight: 600 }}>
          <option value="">Tüm Aylar</option>
          {AY_ISIMLERI.map((ay) => <option key={ay} value={ay}>{ay}</option>)}
        </select>
        {kartListesi.length > 0 && (
          <select value={secilenKart} onChange={(e) => setSecilenKart(e.target.value)} className="input"
            style={{ width: "auto", background: "var(--bg-secondary)", borderColor: "rgba(168,85,247,0.3)", color: "var(--text-primary)", fontWeight: 600 }}>
            <option value="">Tüm Kartlar</option>
            {kartListesi.map((k) => <option key={k.id} value={k.id}>{k.isim}</option>)}
          </select>
        )}
      </div>

      {/* İstatistikler */}
      <div className="stat-grid mb-lg">
        <div className="stat-card" style={{ background: "var(--bg-secondary)", borderBottom: "4px solid #a855f7" }}>
          <div className="flex items-center justify-between">
            <div><div className="stat-label">Ekstre Sayısı</div><div className="stat-value" style={{ color: "#a855f7" }}>{filtrelenmis.length}</div></div>
            <div className="score-circle" style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7" }}>📄</div>
          </div>
        </div>
        <div className="stat-card" style={{ background: "var(--bg-secondary)", borderBottom: "4px solid var(--red)" }}>
          <div className="flex items-center justify-between">
            <div><div className="stat-label">Toplam Tutar</div><div className="stat-value text-red">₺{toplamTutar.toLocaleString("tr-TR")}</div></div>
            <div className="score-circle" style={{ background: "rgba(239,68,68,0.15)", color: "var(--red)" }}>💸</div>
          </div>
        </div>
        <div className="stat-card" style={{ background: "var(--bg-secondary)", borderBottom: "4px solid var(--green)" }}>
          <div className="flex items-center justify-between">
            <div><div className="stat-label">Toplam İşlem</div><div className="stat-value text-green">{toplamIslem}</div></div>
            <div className="score-circle" style={{ background: "rgba(16,185,129,0.15)", color: "var(--green)" }}>🧾</div>
          </div>
        </div>
      </div>

      {/* Ekstre Listesi */}
      {filtrelenmis.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
          <p>{ekstreler.length === 0 ? "Henüz ekstre yüklenmemiş." : "Bu filtreye uygun ekstre bulunamadı."}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-sm">
          {filtrelenmis.map((ekstre) => {
            const renk = ekstre.kart_renk || "#a855f7";
            const acik = acikEkstre === ekstre.id;
            const eksreHarcamalar = harcamalar[ekstre.id] || [];
            return (
              <div key={ekstre.id} className="card" style={{ padding: 0, overflow: "hidden", border: `1px solid ${renk}40` }}>
                <div className="flex items-center justify-between" style={{ padding: "16px 20px", cursor: "pointer", borderLeft: `4px solid ${renk}` }} onClick={() => toggleEkstre(ekstre.id)}>
                  <div className="flex items-center gap-md">
                    <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: `${renk}20`, color: renk, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>💳</div>
                    <div>
                      <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "15px" }}>
                        {ekstre.donem_adi}
                        {ekstre.kart_isim && <span style={{ color: renk, marginLeft: "8px", fontSize: "13px" }}>• {ekstre.kart_isim}</span>}
                        {ekstre.sadece_takip === 1 && <span style={{ marginLeft: "8px", fontSize: "11px", background: "rgba(168,85,247,0.15)", color: "#a855f7", padding: "2px 6px", borderRadius: "4px" }}>Takip</span>}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                        {ekstre.harcama_sayisi} işlem • {new Date(ekstre.yukleme_tarihi).toLocaleDateString("tr-TR")} yüklendi
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-md">
                    <strong style={{ color: "var(--red)", fontSize: "17px" }}>₺{ekstre.toplam_tutar.toLocaleString("tr-TR")}</strong>
                    <button onClick={(e) => { e.stopPropagation(); handleSil(ekstre.id); }} className="btn btn-danger btn-sm" style={{ opacity: 0.7 }}>✕</button>
                    <span style={{ color: "var(--text-muted)", fontSize: "18px" }}>{acik ? "▲" : "▼"}</span>
                  </div>
                </div>
                {acik && (
                  <div style={{ borderTop: `1px solid ${renk}30`, background: "var(--bg-tertiary)" }}>
                    {eksreHarcamalar.length === 0 ? (
                      <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>Harcama bulunamadı</div>
                    ) : (
                      eksreHarcamalar.map((h) => {
                        const catData = getCategoryData(h.kategori);
                        return (
                          <div key={h.id} className="flex items-center justify-between" style={{ padding: "12px 20px", borderBottom: "1px solid var(--bg-card-border)" }}>
                            <div className="flex items-center gap-md">
                              <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: catData.bg, color: catData.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>{catData.icon}</div>
                              <div>
                                <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "14px" }}>{h.aciklama || h.kategori}</div>
                                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{h.kategori} • 📅 {h.tarih}</div>
                              </div>
                            </div>
                            <strong style={{ color: catData.color, fontSize: "15px" }}>₺{h.miktar.toLocaleString("tr-TR")}</strong>
                          </div>
                        );
                      })
                    )}
                    <div style={{ padding: "12px 20px", display: "flex", justifyContent: "flex-end", borderTop: `1px solid ${renk}30` }}>
                      <strong style={{ color: "var(--red)" }}>Toplam: ₺{ekstre.toplam_tutar.toLocaleString("tr-TR")}</strong>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default KrediKartTakip;
