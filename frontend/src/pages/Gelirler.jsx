import { useState, useEffect } from "react";
import { gelirAPI } from "../services/api";
import { getCategoryData } from "../utils/categories";

function Gelirler() {
  const [gelirler, setGelirler] = useState([]);
  const [filtrelenmis, setFiltrelenmis] = useState([]);
  const [secilenAy, setSecilenAy] = useState(new Date().toISOString().slice(0, 7));
  const [secili, setSecili] = useState([]);
  const [form, setForm] = useState({
    tarih: "",
    miktar: "",
    kategori: "Maaş",
    aciklama: "",
    tekrar_mi: false,
  });

  useEffect(() => {
    gelirAPI.getirAll().then((res) => setGelirler(res.data));
  }, []);

  useEffect(() => {
    setFiltrelenmis(gelirler.filter(g => g.tarih.startsWith(secilenAy)));
  }, [gelirler, secilenAy]);

  const handleSubmit = () => {
    if (!form.tarih || !form.miktar) {
      alert("Tarih ve miktar zorunludur!");
      return;
    }
    gelirAPI.ekle(form).then(() => {
      gelirAPI.getirAll().then((res) => setGelirler(res.data));
      setForm({ tarih: "", miktar: "", kategori: "Maaş", aciklama: "", tekrar_mi: false });
    });
  };

  const handleSil = (id) => {
    if (window.confirm("Bu geliri silmek istediğine emin misin?")) {
      gelirAPI.sil(id).then(() => {
        setGelirler(gelirler.filter((x) => x.id !== id));
        setSecili((prev) => prev.filter((x) => x !== id));
      });
    }
  };

  const toggleSecim = (id) => {
    setSecili((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const tumunuSec = () => {
    const hepsi = filtrelenmis.map((g) => g.id);
    const tumSecili = hepsi.length > 0 && hepsi.every((id) => secili.includes(id));
    setSecili(tumSecili ? [] : hepsi);
  };

  const handleTopluSil = () => {
    if (secili.length === 0) return;
    if (window.confirm(`${secili.length} gelir kaydı silinecek. Emin misin?`)) {
      gelirAPI.topluSil(secili).then(() => {
        setGelirler((prev) => prev.filter((x) => !secili.includes(x.id)));
        setSecili([]);
      });
    }
  };

  const toplamGelir = filtrelenmis.reduce((sum, g) => sum + g.miktar, 0);

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h2 className="page-title text-green">Gelirler</h2>
          <p className="page-subtitle">Aylık kazançlarınızı detaylı takip edin</p>
        </div>
        <input
          type="month"
          value={secilenAy}
          onChange={(e) => setSecilenAy(e.target.value)}
          className="input"
          style={{ width: "auto", background: "var(--green-soft)", borderColor: "var(--green-soft)", color: "var(--green)", fontWeight: 600 }}
        />
      </div>

      <div className="stat-grid mb-lg">
        <div className="stat-card green" style={{ background: "var(--bg-secondary)", borderBottom: "4px solid var(--green)" }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-label" style={{ color: "var(--text-muted)" }}>Toplam Kazanç</div>
              <div className="stat-value text-green">₺{toplamGelir.toLocaleString("tr-TR")}</div>
            </div>
            <div className="score-circle" style={{ background: "var(--green-soft)", color: "var(--green)" }}>
              💰
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-label">Toplam İşlem</div>
              <div className="stat-value">{filtrelenmis.length}</div>
            </div>
            <div className="score-circle" style={{ background: "var(--bg-tertiary)" }}>
              📝
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card mb-lg" style={{ borderLeft: "4px solid var(--green)" }}>
        <h3 className="card-title">Yeni Kazanç Ekle</h3>
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
            <option>Maaş</option>
            <option>Ek Gelir</option>
            <option>Kira</option>
            <option>Diğer</option>
            <option>Yatırım</option>
          </select>
          <input
            type="text"
            placeholder="Açıklama (opsiyonel)"
            value={form.aciklama}
            onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
            className="input"
            style={{ flex: 1, minWidth: "200px" }}
          />
          <button onClick={handleSubmit} className="btn btn-success" style={{ padding: "10px 24px" }}>
            + Ekle
          </button>
        </div>
      </div>

      {/* Liste */}
      <div>
        <div className="flex items-center justify-between" style={{ paddingLeft: "10px", paddingRight: "10px", marginBottom: "8px" }}>
          <h3 className="card-title" style={{ margin: 0 }}>Kazanç Geçmişi</h3>
          {filtrelenmis.length > 0 && (
            <div className="flex items-center gap-sm">
              <button onClick={tumunuSec} className="btn btn-sm" style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}>
                {filtrelenmis.length > 0 && filtrelenmis.every((g) => secili.includes(g.id)) ? "Seçimi Kaldır" : "Tümünü Seç"}
              </button>
              {secili.length > 0 && (
                <button onClick={handleTopluSil} className="btn btn-danger btn-sm">
                  🗑 Seçilenleri Sil ({secili.length})
                </button>
              )}
            </div>
          )}
        </div>
        {filtrelenmis.length === 0 ? (
          <div className="empty-state">Bu ay için gelir kaydı bulunamadı.</div>
        ) : (
          <div className="flex flex-col gap-sm">
            {filtrelenmis.map((g, i) => {
              const catData = getCategoryData(g.kategori);
              // Alternating backgrounds for distinct visibility
              const bgs = [
                "var(--bg-secondary)",
              ];
              const bgGradient = bgs[0];

              return (
                <div key={g.id} className="list-item" style={{ background: secili.includes(g.id) ? "var(--bg-tertiary)" : bgGradient, border: `1px solid ${secili.includes(g.id) ? "var(--green)" : catData.color + "40"}` }}>
                  <div className="list-item-info flex items-center gap-md">
                    <input
                      type="checkbox"
                      checked={secili.includes(g.id)}
                      onChange={() => toggleSecim(g.id)}
                      style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "var(--green)" }}
                    />
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: catData.bg, color: catData.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                      {catData.icon}
                    </div>
                    <div>
                      <strong className="text-primary">{g.kategori}</strong>
                      {g.aciklama && <span className="text-muted ml-sm">— {g.aciklama}</span>}
                      <p className="text-xs text-muted" style={{ marginTop: "4px" }}>📅 {g.tarih}</p>
                    </div>
                  </div>
                  <div className="list-item-actions">
                    <strong className="text-green" style={{ fontSize: "18px" }}>₺{g.miktar.toLocaleString("tr-TR")}</strong>
                    <button onClick={() => handleSil(g.id)} className="btn btn-danger btn-sm" style={{ opacity: 0.8 }}>✕</button>
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

export default Gelirler;