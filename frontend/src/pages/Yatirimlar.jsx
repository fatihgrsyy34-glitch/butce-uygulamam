import { useState, useEffect } from "react";
import { yatirimAPI } from "../services/api";

function Yatirimlar() {
  const [yatirimlar, setYatirimlar] = useState([]);
  const [form, setForm] = useState({
    tip: "Altın",
    miktar: "",
    alis_fiyati: "",
    tarih: "",
    aciklama: "",
  });

  useEffect(() => {
    yatirimAPI.getirAll().then((res) => setYatirimlar(res.data));
  }, []);

  const handleSubmit = () => {
    if (!form.miktar || !form.alis_fiyati || !form.tarih) {
      alert("Miktar, alış fiyatı ve tarih zorunludur!");
      return;
    }
    yatirimAPI.ekle(form).then(() => {
      yatirimAPI.getirAll().then((res) => setYatirimlar(res.data));
      setForm({ tip: "Altın", miktar: "", alis_fiyati: "", tarih: "", aciklama: "" });
    });
  };

  const handleSil = (id) => {
    if (window.confirm("Bu yatırımı silmek istediğine emin misin?")) {
      yatirimAPI.sil(id).then(() => {
        setYatirimlar(yatirimlar.filter((x) => x.id !== id));
      });
    }
  };

  const toplamMaliyet = yatirimlar.reduce((sum, y) => sum + y.miktar * y.alis_fiyati, 0);

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h2 className="page-title">Yatırımlar</h2>
          <p className="page-subtitle">Yatırım portföyünüzü takip edin</p>
        </div>
        <div className="card" style={{ padding: "10px 20px" }}>
          <p className="text-muted text-sm" style={{ marginBottom: "2px" }}>Toplam Yatırım Maliyeti</p>
          <h3 className="text-primary" style={{ fontSize: "20px" }}>₺{toplamMaliyet.toLocaleString("tr-TR")}</h3>
        </div>
      </div>

      {/* Form */}
      <div className="card mb-lg">
        <h3 className="card-title">Yeni Yatırım Ekle</h3>
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
          <button onClick={handleSubmit} className="btn btn-primary">
            + Ekle
          </button>
        </div>
      </div>

      {/* Liste */}
      <div>
        <h3 className="card-title" style={{ paddingLeft: "10px" }}>Yatırım Geçmişi</h3>
        {yatirimlar.length === 0 ? (
          <div className="empty-state">Henüz yatırım kaydı bulunamadı.</div>
        ) : (
          <div className="flex flex-col">
            {yatirimlar.map((y) => (
              <div key={y.id} className="list-item">
                <div className="list-item-info">
                  <div className="flex items-center gap-sm">
                    <span className="badge badge-purple">{y.tip}</span>
                    <strong>{y.aciklama}</strong>
                  </div>
                  <p>{y.tarih} · {y.miktar} adet/gram</p>
                </div>
                <div className="list-item-actions">
                  <div style={{ textAlign: "right" }}>
                    <strong>₺{y.alis_fiyati.toLocaleString("tr-TR")}</strong>
                    <div className="text-muted text-xs">Maliyet: ₺{(y.miktar * y.alis_fiyati).toLocaleString("tr-TR")}</div>
                  </div>
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