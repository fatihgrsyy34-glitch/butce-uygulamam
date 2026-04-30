import { useState, useEffect } from "react";
import { harcamaAPI, kartAPI } from "../services/api";
import { getCategoryData } from "../utils/categories";

function Harcamalar() {
  const [harcamalar, setHarcamalar] = useState([]);
  const [filtrelenmis, setFiltrelenmis] = useState([]);
  const [kartlar, setKartlar] = useState([]);
  const [secilenAy, setSecilenAy] = useState(new Date().toISOString().slice(0, 7));
  const [secilenKart, setSecilenKart] = useState("");
  const [form, setForm] = useState({
    tarih: "",
    miktar: "",
    kategori: "Market",
    kart_id: "",
    aciklama: "",
  });

  useEffect(() => {
    harcamaAPI.getirAll().then((res) => setHarcamalar(res.data));
    kartAPI.getirAll().then((res) => setKartlar(res.data));
  }, []);

  useEffect(() => {
    let filtered = harcamalar.filter(h => h.tarih.startsWith(secilenAy));
    if (secilenKart === "nakit") {
      filtered = filtered.filter(h => !h.kart_id);
    } else if (secilenKart) {
      filtered = filtered.filter(h => h.kart_id === parseInt(secilenKart));
    }
    setFiltrelenmis(filtered);
  }, [harcamalar, secilenAy, secilenKart]);

  const handleSubmit = () => {
    if (!form.tarih || !form.miktar || !form.kategori) {
      alert("Tarih, miktar ve kategori zorunludur!");
      return;
    }
    harcamaAPI.ekle(form).then(() => {
      harcamaAPI.getirAll().then((res) => setHarcamalar(res.data));
      setForm({ tarih: "", miktar: "", kategori: "Market", kart_id: "", aciklama: "" });
    });
  };

  const handleSil = (id) => {
    if (window.confirm("Bu harcamayı silmek istediğine emin misin?")) {
      harcamaAPI.sil(id).then(() => {
        setHarcamalar(harcamalar.filter((x) => x.id !== id));
      });
    }
  };

  const toplamHarcama = filtrelenmis.reduce((sum, h) => sum + h.miktar, 0);

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h2 className="page-title text-red">Harcamalar</h2>
          <p className="page-subtitle">Aylık giderlerinizi yönetin ve sınıflandırın</p>
        </div>
        <div className="flex gap-sm">
          <select
            value={secilenKart}
            onChange={(e) => setSecilenKart(e.target.value)}
            className="input"
            style={{ width: "auto", background: "var(--bg-secondary)", borderColor: "rgba(239, 68, 68, 0.3)", color: "var(--text-primary)", fontWeight: 600 }}
          >
            <option value="">💳 Tüm Kartlar</option>
            <option value="nakit">💵 Nakit / Hesaptan</option>
            {kartlar.map((k) => (
              <option key={k.id} value={k.id}>{k.isim}</option>
            ))}
          </select>
          <input
            type="month"
            value={secilenAy}
            onChange={(e) => setSecilenAy(e.target.value)}
            className="input"
            style={{ width: "auto", background: "var(--red-soft)", borderColor: "rgba(239, 68, 68, 0.3)", color: "var(--red)", fontWeight: 600 }}
          />
        </div>
      </div>

      <div className="stat-grid mb-lg">
        <div className="stat-card red" style={{ background: "var(--bg-secondary)", borderBottom: "4px solid var(--red)"}}>
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-label" style={{ color: "var(--text-muted)" }}>Toplam Harcama</div>
              <div className="stat-value text-red">₺{toplamHarcama.toLocaleString("tr-TR")}</div>
            </div>
            <div className="score-circle" style={{ background: "rgba(239, 68, 68, 0.2)", color: "var(--red)" }}>
              💸
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-label">İşlem Sayısı</div>
              <div className="stat-value">{filtrelenmis.length}</div>
            </div>
            <div className="score-circle" style={{ background: "var(--bg-tertiary)" }}>
              📉
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card mb-lg" style={{ borderLeft: "4px solid var(--red)" }}>
        <h3 className="card-title">Yeni Harcama Ekle</h3>
        <div className="input-group">
          <input
            type="date"
            value={form.tarih}
            onChange={(e) => setForm({ ...form, tarih: e.target.value })}
            className="input"
            style={{ width: "160px" }}
          />
          <input
            type="number"
            placeholder="Miktar (₺)"
            value={form.miktar}
            onChange={(e) => setForm({ ...form, miktar: e.target.value })}
            className="input"
            style={{ width: "160px" }}
          />
          <select
            value={form.kategori}
            onChange={(e) => setForm({ ...form, kategori: e.target.value })}
            className="input"
            style={{ width: "160px" }}
          >
            <option>Market</option>
            <option>Yemek & Restoran</option>
            <option>Ulaşım</option>
            <option>Giyim</option>
            <option>Sağlık</option>
            <option>Eğlence</option>
            <option>Faturalar</option>
            <option>Eğitim</option>
            <option>Diğer</option>
          </select>
          <select
            value={form.kart_id}
            onChange={(e) => setForm({ ...form, kart_id: e.target.value })}
            className="input"
            style={{ width: "160px" }}
          >
            <option value="">Nakit / Hesaptan</option>
            {kartlar.map((k) => (
              <option key={k.id} value={k.id}>{k.isim}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Açıklama"
            value={form.aciklama}
            onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
            className="input"
            style={{ flex: 1, minWidth: "200px" }}
          />
          <button onClick={handleSubmit} className="btn btn-danger" style={{ padding: "10px 24px" }}>
            + Ekle
          </button>
        </div>
      </div>

      {/* Liste */}
      <div>
        <h3 className="card-title" style={{ paddingLeft: "10px" }}>Harcama Geçmişi</h3>
        {filtrelenmis.length === 0 ? (
          <div className="empty-state">Bu ay harcama kaydı bulunamadı.</div>
        ) : (
          <div className="flex flex-col gap-sm">
            {filtrelenmis.map((h) => {
              const kartIsim = kartlar.find(k => k.id === h.kart_id)?.isim;
              const catData = getCategoryData(h.kategori);

              return (
                <div key={h.id} className="list-item" style={{ background: "var(--bg-secondary)", border: `1px solid ${catData.color}40` }}>
                  <div className="list-item-info flex items-center gap-md">
                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: catData.bg, color: catData.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                      {catData.icon}
                    </div>
                    <div>
                      <strong className="text-primary" style={{ fontSize: "15px" }}>{h.kategori}</strong>
                      {h.aciklama && <span className="text-muted ml-sm">— {h.aciklama}</span>}
                      <div className="flex gap-md" style={{ marginTop: "4px" }}>
                        <span className="text-xs text-muted">📅 {h.tarih}</span>
                        {kartIsim && <span className="text-xs" style={{ color: "#a855f7" }}>💳 {kartIsim}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="list-item-actions">
                    <strong style={{ color: catData.color, fontSize: "18px" }}>₺{h.miktar.toLocaleString("tr-TR")}</strong>
                    <button onClick={() => handleSil(h.id)} className="btn btn-danger btn-sm" style={{ opacity: 0.7 }}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Harcamalar;