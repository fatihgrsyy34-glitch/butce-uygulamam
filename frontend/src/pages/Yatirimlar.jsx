import { useState, useEffect } from "react";
import { yatirimAPI } from "../services/api";

const BOŞ_FORM = { tip: "Altın", miktar: "", alis_fiyati: "", tarih: "", aciklama: "", yatirim_disi: false };

const SEKMELER = [
  { id: "tumu", label: "Tüm Yatırımlar" },
  { id: "benim", label: "Benim Yatırımlarım" },
  { id: "disi", label: "Yatırım Dışı" },
];

function Yatirimlar() {
  const [yatirimlar, setYatirimlar] = useState([]);
  const [form, setForm] = useState(BOŞ_FORM);
  const [duzenleId, setDuzenleId] = useState(null);
  const [aktifSekme, setAktifSekme] = useState("tumu");

  useEffect(() => {
    yatirimAPI.getirAll().then((res) => setYatirimlar(res.data));
  }, []);

  const handleSubmit = () => {
    if (!form.miktar || !form.alis_fiyati || !form.tarih) {
      alert("Miktar, alış fiyatı ve tarih zorunludur!");
      return;
    }
    if (duzenleId) {
      yatirimAPI.guncelle(duzenleId, form).then(() => {
        yatirimAPI.getirAll().then((res) => setYatirimlar(res.data));
        setForm(BOŞ_FORM);
        setDuzenleId(null);
      });
    } else {
      yatirimAPI.ekle(form).then(() => {
        yatirimAPI.getirAll().then((res) => setYatirimlar(res.data));
        setForm(BOŞ_FORM);
      });
    }
  };

  const handleDuzenle = (y) => {
    setForm({
      tip: y.tip,
      miktar: y.miktar,
      alis_fiyati: y.alis_fiyati,
      tarih: y.tarih,
      aciklama: y.aciklama || "",
      yatirim_disi: y.yatirim_disi === 1,
    });
    setDuzenleId(y.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleIptal = () => {
    setForm(BOŞ_FORM);
    setDuzenleId(null);
  };

  const handleSil = (id) => {
    if (window.confirm("Bu yatırımı silmek istediğine emin misin?")) {
      yatirimAPI.sil(id).then(() => {
        setYatirimlar(yatirimlar.filter((x) => x.id !== id));
        if (duzenleId === id) handleIptal();
      });
    }
  };

  const benimYatirimlar = yatirimlar.filter((y) => !y.yatirim_disi);
  const disiYatirimlar = yatirimlar.filter((y) => y.yatirim_disi);

  const gosterilenListe =
    aktifSekme === "benim" ? benimYatirimlar :
    aktifSekme === "disi" ? disiYatirimlar :
    yatirimlar;

  const aktifMaliyet = gosterilenListe.reduce((sum, y) => sum + y.miktar * y.alis_fiyati, 0);
  const benimMaliyet = benimYatirimlar.reduce((sum, y) => sum + y.miktar * y.alis_fiyati, 0);
  const disiMaliyet = disiYatirimlar.reduce((sum, y) => sum + y.miktar * y.alis_fiyati, 0);

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h2 className="page-title">Yatırımlar</h2>
          <p className="page-subtitle">Yatırım portföyünüzü takip edin</p>
        </div>
        <div className="flex gap-md">
          <div className="card" style={{ padding: "10px 20px" }}>
            <p className="text-muted text-sm" style={{ marginBottom: "2px" }}>Benim Yatırımlarım</p>
            <h3 className="text-primary" style={{ fontSize: "20px", color: "var(--accent-primary)" }}>
              ₺{benimMaliyet.toLocaleString("tr-TR")}
            </h3>
          </div>
          {disiMaliyet > 0 && (
            <div className="card" style={{ padding: "10px 20px", borderLeft: "3px solid var(--yellow)" }}>
              <p className="text-muted text-sm" style={{ marginBottom: "2px" }}>Yatırım Dışı</p>
              <h3 style={{ fontSize: "20px", color: "var(--yellow)" }}>
                ₺{disiMaliyet.toLocaleString("tr-TR")}
              </h3>
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="card mb-lg" style={duzenleId ? { border: "2px solid var(--accent-primary)" } : {}}>
        <h3 className="card-title">
          {duzenleId ? "✏️ Yatırımı Düzenle" : "Yeni Yatırım Ekle"}
        </h3>
        <div className="input-group">
          <select
            value={form.tip}
            onChange={(e) => setForm({ ...form, tip: e.target.value })}
            className="input"
            style={{ width: "160px" }}
          >
            <option>Altın</option>
            <option>Dolar</option>
            <option>Euro</option>
            <option>BIST Hisse</option>
            <option>Kripto</option>
            <option>Diğer</option>
          </select>
          <input
            type="number"
            placeholder="Miktar (adet/gram)"
            value={form.miktar}
            onChange={(e) => setForm({ ...form, miktar: e.target.value })}
            className="input"
            style={{ width: "160px" }}
          />
          <input
            type="number"
            placeholder="Alış Fiyatı (₺)"
            value={form.alis_fiyati}
            onChange={(e) => setForm({ ...form, alis_fiyati: e.target.value })}
            className="input"
            style={{ width: "160px" }}
          />
          <input
            type="date"
            value={form.tarih}
            onChange={(e) => setForm({ ...form, tarih: e.target.value })}
            className="input"
            style={{ width: "160px" }}
          />
          <input
            type="text"
            placeholder="Açıklama (örn: THYAO)"
            value={form.aciklama}
            onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
            className="input"
            style={{ flex: 1, minWidth: "200px" }}
          />
        </div>

        <div className="flex items-center justify-between mt-md">
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", color: "var(--text-secondary)" }}>
            <input
              type="checkbox"
              checked={form.yatirim_disi}
              onChange={(e) => setForm({ ...form, yatirim_disi: e.target.checked })}
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
            Yatırım Dışı (toplam maliyete ve dashboard'a dahil edilmez)
          </label>
          <div className="flex gap-sm">
            {duzenleId && (
              <button onClick={handleIptal} className="btn btn-secondary">
                İptal
              </button>
            )}
            <button onClick={handleSubmit} className="btn btn-primary">
              {duzenleId ? "💾 Kaydet" : "+ Ekle"}
            </button>
          </div>
        </div>
      </div>

      {/* Sekmeler */}
      <div className="tab-bar mb-md">
        {SEKMELER.map((s) => {
          const sayi = s.id === "tumu" ? yatirimlar.length : s.id === "benim" ? benimYatirimlar.length : disiYatirimlar.length;
          return (
            <button
              key={s.id}
              onClick={() => setAktifSekme(s.id)}
              className={`tab-btn ${aktifSekme === s.id ? "active" : ""}`}
            >
              {s.label}
              <span style={{
                marginLeft: "6px", fontSize: "11px", fontWeight: "700",
                background: aktifSekme === s.id ? "var(--accent-primary)" : "#e2e8f0",
                color: aktifSekme === s.id ? "white" : "var(--text-muted)",
                padding: "1px 6px", borderRadius: "10px"
              }}>{sayi}</span>
            </button>
          );
        })}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", fontSize: "13px", color: "var(--text-muted)", paddingRight: "4px" }}>
          Toplam: <strong style={{ marginLeft: "6px", color: "var(--text-primary)" }}>₺{aktifMaliyet.toLocaleString("tr-TR")}</strong>
        </div>
      </div>

      {/* Liste */}
      <div>
        {gosterilenListe.length === 0 ? (
          <div className="empty-state">Bu kategoride kayıt bulunamadı.</div>
        ) : (
          <div className="flex flex-col">
            {gosterilenListe.map((y) => (
              <div key={y.id} className="list-item" style={y.yatirim_disi ? { borderLeft: "3px solid var(--yellow)" } : {}}>
                <div className="list-item-info">
                  <div className="flex items-center gap-sm">
                    <span className="badge badge-purple">{y.tip}</span>
                    {y.yatirim_disi ? (
                      <span className="badge" style={{ background: "var(--yellow-soft)", color: "var(--yellow)" }}>Yatırım Dışı</span>
                    ) : null}
                    <strong>{y.aciklama}</strong>
                  </div>
                  <p>{y.tarih} · {y.miktar} adet/gram</p>
                </div>
                <div className="list-item-actions">
                  <div style={{ textAlign: "right" }}>
                    <strong>₺{y.alis_fiyati.toLocaleString("tr-TR")}</strong>
                    <div className="text-muted text-xs">
                      Maliyet: ₺{(y.miktar * y.alis_fiyati).toLocaleString("tr-TR")}
                      {y.yatirim_disi ? " · sayılmıyor" : ""}
                    </div>
                  </div>
                  <button onClick={() => handleDuzenle(y)} className="btn btn-secondary btn-sm">
                    ✏️ Düzenle
                  </button>
                  <button onClick={() => handleSil(y.id)} className="btn btn-danger btn-sm">
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Yatirimlar;
