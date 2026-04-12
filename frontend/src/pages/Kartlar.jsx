import { useState, useEffect } from "react";
import { kartAPI } from "../services/api";

function Kartlar() {
  const [kartlar, setKartlar] = useState([]);
  const [form, setForm] = useState({
    isim: "",
    limit_miktar: "",
    son_odeme_gunu: "",
    banka: "",
    renk: "#6366f1",
  });

  useEffect(() => {
    kartAPI.getirAll().then((res) => setKartlar(res.data));
  }, []);

  const handleSubmit = () => {
    if (!form.isim) {
      alert("Kart ismi zorunludur!");
      return;
    }
    kartAPI.ekle(form).then(() => {
      kartAPI.getirAll().then((res) => setKartlar(res.data));
      setForm({ isim: "", limit_miktar: "", son_odeme_gunu: "", banka: "", renk: "#6366f1" });
    });
  };

  const handleSil = (id) => {
    if (window.confirm("Bu kartı silmek istediğine emin misin?")) {
      kartAPI.sil(id).then(() => {
        setKartlar(kartlar.filter((x) => x.id !== id));
      });
    }
  };

  const handleMouseMove = (e, index) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Kartlar</h2>
        <p className="page-subtitle">Kredi kartlarınızı ve limitlerinizi yönetin</p>
      </div>

      {/* Form */}
      <div className="card mb-lg">
        <h3 className="card-title">Yeni Kart Ekle</h3>
        <div className="input-group">
          <input
            type="text"
            placeholder="Kart İsmi (örn: Garanti Bonus)"
            value={form.isim}
            onChange={(e) => setForm({ ...form, isim: e.target.value })}
            className="input"
            style={{ width: "200px" }}
          />
          <input
            type="text"
            placeholder="Banka"
            value={form.banka}
            onChange={(e) => setForm({ ...form, banka: e.target.value })}
            className="input"
            style={{ width: "200px" }}
          />
          <input
            type="number"
            placeholder="Limit (₺)"
            value={form.limit_miktar}
            onChange={(e) => setForm({ ...form, limit_miktar: e.target.value })}
            className="input"
            style={{ width: "160px" }}
          />
          <input
            type="number"
            placeholder="Son Ödeme Günü"
            value={form.son_odeme_gunu}
            onChange={(e) => setForm({ ...form, son_odeme_gunu: e.target.value })}
            className="input"
            style={{ width: "160px" }}
          />
          <input
            type="color"
            value={form.renk}
            onChange={(e) => setForm({ ...form, renk: e.target.value })}
            className="input"
            style={{ width: "60px", padding: "4px", height: "42px", cursor: "pointer" }}
          />
          <button onClick={handleSubmit} className="btn btn-primary" style={{ padding: "10px 24px" }}>
            + Ekle
          </button>
        </div>
      </div>

      {/* Kartlar */}
      <div className="flex flex-wrap gap-lg mt-lg">
        {kartlar.length === 0 ? (
          <div className="empty-state w-full">Henüz kart eklenmedi.</div>
        ) : (
          kartlar.map((k, index) => (
            <div 
              key={k.id} 
              className="credit-card" 
              style={{ background: `linear-gradient(135deg, ${k.renk}, #111)` }}
              onMouseMove={(e) => handleMouseMove(e, index)}
            >
              <button
                onClick={() => handleSil(k.id)}
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  cursor: "pointer",
                  fontSize: "12px",
                  backdropFilter: "blur(4px)"
                }}
              >
                Sil
              </button>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <p style={{ fontSize: "14px", opacity: 0.9, letterSpacing: "1px" }}>{k.banka || "BANKA"}</p>
                <div style={{ width: "40px", height: "25px", background: "rgba(255,255,255,0.4)", borderRadius: "4px" }}></div>
              </div>
              <h3 style={{ fontSize: "22px", letterSpacing: "2px", marginBottom: "24px" }}>{k.isim}</h3>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: "10px", opacity: 0.7, textTransform: "uppercase" }}>Limit</p>
                  <p style={{ fontSize: "15px", fontWeight: "600" }}>₺{k.limit_miktar.toLocaleString("tr-TR")}</p>
                </div>
                <div>
                  <p style={{ fontSize: "10px", opacity: 0.7, textTransform: "uppercase" }}>Son Ödeme</p>
                  <p style={{ fontSize: "15px", fontWeight: "600" }}>Her ayın {k.son_odeme_gunu}. günü</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Kartlar;