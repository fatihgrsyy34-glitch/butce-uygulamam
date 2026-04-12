import { useState, useEffect } from "react";
import { hedefAPI } from "../services/api";

function Hedefler() {
  const [hedefler, setHedefler] = useState([]);
  const [form, setForm] = useState({
    isim: "",
    hedef_miktar: "",
    mevcut_miktar: "",
    bitis_tarihi: "",
  });

  useEffect(() => {
    hedefAPI.getirAll().then((res) => setHedefler(res.data));
  }, []);

  const handleSubmit = () => {
    if (!form.isim || !form.hedef_miktar) {
      alert("İsim ve hedef miktar zorunludur!");
      return;
    }
    hedefAPI.ekle(form).then(() => {
      hedefAPI.getirAll().then((res) => setHedefler(res.data));
      setForm({ isim: "", hedef_miktar: "", mevcut_miktar: "", bitis_tarihi: "" });
    });
  };

  const handleSil = (id) => {
    if (window.confirm("Bu hedefi silmek istediğine emin misin?")) {
      hedefAPI.sil(id).then(() => {
        setHedefler(hedefler.filter((x) => x.id !== id));
      });
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Hedefler</h2>
        <p className="page-subtitle">Finansal hedeflerinizi belirleyin ve ilerlemenizi izleyin</p>
      </div>

      {/* Form */}
      <div className="card mb-lg">
        <h3 className="card-title">Yeni Hedef Ekle</h3>
        <div className="input-group">
          <input
            type="text"
            placeholder="Hedef İsmi (örn: Tatil, Araba)"
            value={form.isim}
            onChange={(e) => setForm({ ...form, isim: e.target.value })}
            className="input"
            style={{ width: "200px" }}
          />
          <input
            type="number"
            placeholder="Hedef Miktar (₺)"
            value={form.hedef_miktar}
            onChange={(e) => setForm({ ...form, hedef_miktar: e.target.value })}
            className="input"
            style={{ width: "180px" }}
          />
          <input
            type="number"
            placeholder="Mevcut Birikim (₺)"
            value={form.mevcut_miktar}
            onChange={(e) => setForm({ ...form, mevcut_miktar: e.target.value })}
            className="input"
            style={{ width: "180px" }}
          />
          <input
            type="date"
            value={form.bitis_tarihi}
            onChange={(e) => setForm({ ...form, bitis_tarihi: e.target.value })}
            className="input"
            style={{ width: "160px" }}
          />
          <button onClick={handleSubmit} className="btn btn-primary">
            + Ekle
          </button>
        </div>
      </div>

      {/* Liste */}
      <div className="flex flex-col gap-md">
        {hedefler.length === 0 ? (
          <div className="empty-state">Henüz hedef eklenmedi.</div>
        ) : (
          hedefler.map((h) => {
            const yuzdeRaw = (h.mevcut_miktar / h.hedef_miktar) * 100;
            const yuzde = isNaN(yuzdeRaw) ? 0 : Math.min(yuzdeRaw, 100).toFixed(0);
            
            let progressColorClass = "progress-fill";
            if (yuzde >= 100) progressColorClass += " bg-green";

            return (
              <div key={h.id} className="card" style={{ padding: "20px" }}>
                <div className="flex items-center justify-between" style={{ marginBottom: "16px" }}>
                  <div className="flex items-center gap-sm">
                    <strong style={{ fontSize: "16px" }}>{h.isim}</strong>
                    <span className="badge badge-purple">%{yuzde}</span>
                  </div>
                  <div className="flex items-center gap-md">
                    <span className="text-muted text-sm">Bitiş: {h.bitis_tarihi || "Belirtilmedi"}</span>
                    <button onClick={() => handleSil(h.id)} className="btn btn-danger btn-sm">
                      Sil
                    </button>
                  </div>
                </div>

                <div className="progress-bar mb-sm">
                  <div className={progressColorClass} style={{ width: `${yuzde}%` }} />
                </div>

                <div className="flex items-center justify-between text-muted text-sm">
                  <span>Biriken: <strong>₺{h.mevcut_miktar.toLocaleString("tr-TR")}</strong></span>
                  <span>Hedef: <strong>₺{h.hedef_miktar.toLocaleString("tr-TR")}</strong></span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Hedefler;