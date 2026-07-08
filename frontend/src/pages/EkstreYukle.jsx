import { useState, useEffect } from "react";
import { kartAPI } from "../services/api";
import api from "../services/api";

function EkstreYukle() {
  const ayIsimler = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const bugun = new Date();
  const guncelYil = bugun.getFullYear();

  const [kartlar, setKartlar] = useState([]);
  const [secilenKart, setSecilenKart] = useState("");
  const [secilenAy, setSecilenAy] = useState(ayIsimler[bugun.getMonth()]);
  const [dosya, setDosya] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sonuc, setSonuc] = useState(null);
  const [hata, setHata] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    kartAPI.getirAll().then((res) => setKartlar(res.data));
  }, []);

  const handleYukle = async () => {
    if (!dosya) {
      alert("Lütfen bir PDF dosyası seçin!");
      return;
    }

    setYukleniyor(true);
    setSonuc(null);
    setHata(null);

    const formData = new FormData();
    formData.append("pdf", dosya);
    formData.append("donem_adi", `${secilenAy} ${guncelYil}`);
    if (secilenKart) formData.append("kart_id", secilenKart);

    try {
      const res = await api.post("/ekstre-yukle", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });
      setSonuc(res.data);
    } catch (err) {
      setHata(err.response?.data?.hata || err.message || "Bir hata oluştu");
    } finally {
      setYukleniyor(false);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setDosya(e.dataTransfer.files[0]);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title text-cyan">Ekstre Yükle & AI Analizi</h2>
        <p className="page-subtitle">PDF ekstreyi yükleyin, Gemini AI otomatik kategorize etsin</p>
      </div>

      <div className="card mt-lg" style={{ background: "var(--bg-secondary)", borderColor: "var(--cyan-soft)" }}>
        <div className="flex flex-col gap-lg">
          <div className="flex gap-md" style={{ flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label className="form-label" style={{ color: "var(--text-primary)" }}>Ekstre Dönemi</label>
              <select
                value={secilenAy}
                onChange={(e) => setSecilenAy(e.target.value)}
                className="input"
                style={{ border: "1px solid var(--cyan-soft)", background: "var(--bg-tertiary)" }}
              >
                {ayIsimler.map((ay) => (
                  <option key={ay} value={ay}>{ay} {guncelYil}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label className="form-label" style={{ color: "var(--text-primary)" }}>Kart Seçin (Opsiyonel)</label>
              <select
                value={secilenKart}
                onChange={(e) => setSecilenKart(e.target.value)}
                className="input"
                style={{ border: "1px solid var(--cyan-soft)", background: "var(--bg-tertiary)" }}
              >
                <option value="">Kart seçin</option>
                {kartlar.map((k) => (
                  <option key={k.id} value={k.id}>{k.isim}</option>
                ))}
              </select>
            </div>
          </div>

          <div
            className={`upload-zone ${isDragging ? "dragging" : ""} ${dosya ? "has-file" : ""}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => document.getElementById("fileDropRef").click()}
            style={{ 
              borderColor: isDragging || dosya ? "var(--cyan)" : "var(--bg-card-border)",
              background: isDragging || dosya ? "var(--cyan-soft)" : "var(--bg-tertiary)"
            }}
          >
            <input
              type="file"
              id="fileDropRef"
              accept=".pdf"
              onChange={(e) => setDosya(e.target.files[0])}
              style={{ display: "none" }}
            />
            {dosya ? (
              <div>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>📄</div>
                <strong className="text-cyan" style={{ fontSize: "16px" }}>{dosya.name}</strong>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "8px" }}>Değiştirmek için tıklayın veya sürükleyin</p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>📥</div>
                <strong style={{ color: "var(--text-primary)", fontSize: "16px" }}>PDF Dosyasını Sürükleyip Bırakın</strong>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "8px" }}>veya seçmek için tıklayın</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center mt-sm">
            <button
              onClick={handleYukle}
              disabled={yukleniyor || !dosya}
              className="btn btn-primary"
              style={{ width: "240px", height: "46px", justifyContent: "center", background: yukleniyor || !dosya ? "var(--cyan-soft)" : "linear-gradient(135deg, #06b6d4, #3b82f6)" }}
            >
              {yukleniyor ? "⏳ Analiz ediliyor..." : "🚀 Yükle & Analiz Et"}
            </button>
          </div>
        </div>
      </div>

      {hata && (
        <div className="card mt-lg" style={{ borderColor: "var(--red-soft)", background: "var(--red-soft)" }}>
          <strong className="text-red">❌ Hata:</strong> {hata}
        </div>
      )}

      {sonuc && (
        <div className="mt-lg">
          <div className="card mb-md" style={{ borderColor: "var(--green-soft)", background: "var(--green-soft)" }}>
            <strong className="text-green">✅ {sonuc.mesaj}</strong>
          </div>
          
          <div className="flex flex-col">
            {sonuc.harcamalar?.map((h, i) => (
              <div key={i} className="list-item">
                <div className="list-item-info">
                  <strong>{h.kategori}</strong> {h.aciklama ? `— ${h.aciklama}` : ''}
                  <p>{h.tarih}</p>
                </div>
                <strong className="text-red">₺{h.miktar?.toLocaleString("tr-TR")}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default EkstreYukle;