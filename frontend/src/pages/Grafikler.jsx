import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer
} from "recharts";
import { harcamaAPI, gelirAPI } from "../services/api";

const RENKLER = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];

function Grafikler() {
  const [aylikVeri, setAylikVeri] = useState([]);
  const [kategoriVeri, setKategoriVeri] = useState([]);
  const [secilenAy, setSecilenAy] = useState(new Date().toISOString().slice(0, 7));
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    Promise.all([
      harcamaAPI.getirAll(),
      gelirAPI.getirAll()
    ]).then(([harcRes, gelirRes]) => {
      const harcamalar = harcRes.data;
      const gelirler = gelirRes.data;

      // Aylık gelir/harcama verisi
      const ayMap = {};
      harcamalar.forEach(h => {
        const ay = h.tarih.slice(0, 7);
        if (!ayMap[ay]) ayMap[ay] = { ay, harcama: 0, gelir: 0 };
        ayMap[ay].harcama += h.miktar;
      });
      gelirler.forEach(g => {
        const ay = g.tarih.slice(0, 7);
        if (!ayMap[ay]) ayMap[ay] = { ay, harcama: 0, gelir: 0 };
        ayMap[ay].gelir += g.miktar;
      });
      const aylikSirali = Object.values(ayMap).sort((a, b) => a.ay.localeCompare(b.ay));
      setAylikVeri(aylikSirali);

      // Seçilen ay kategori verisi
      const secAyHarcamalar = harcamalar.filter(h => h.tarih.startsWith(secilenAy));
      const katMap = {};
      secAyHarcamalar.forEach(h => {
        if (!katMap[h.kategori]) katMap[h.kategori] = { kategori: h.kategori, toplam: 0 };
        katMap[h.kategori].toplam += h.miktar;
      });
      setKategoriVeri(Object.values(katMap).sort((a, b) => b.toplam - a.toplam));
      setYukleniyor(false);
    });
  }, [secilenAy]);

  if (yukleniyor) return <div className="empty-state">⏳ Yükleniyor...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Grafikler</h2>
        <p className="page-subtitle">Gelir, harcama ve kategori trendleri</p>
      </div>

      {/* Aylık Karşılaştırma */}
      <div className="card mt-lg">
        <h3 className="card-title">Aylık Gelir & Harcama</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={aylikVeri} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="ay" axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `₺${(v/1000).toFixed(0)}K`} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} formatter={(val) => `₺${val.toLocaleString("tr-TR")}`} />
            <Legend iconType="circle" />
            <Bar dataKey="gelir" name="Gelir" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="harcama" name="Harcama" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Kategori Pasta Grafik */}
      <div className="card mt-lg">
        <div className="flex items-center justify-between mb-md">
          <h3 className="card-title" style={{ marginBottom: 0 }}>Kategori Dağılımı</h3>
          <input
            type="month"
            value={secilenAy}
            onChange={(e) => setSecilenAy(e.target.value)}
            className="input"
            style={{ width: "auto", padding: "6px 12px" }}
          />
        </div>

        {kategoriVeri.length === 0 ? (
          <div className="empty-state">Bu ay harcama verisi yok.</div>
        ) : (
          <div className="flex items-center gap-lg flex-wrap">
            <PieChart width={300} height={300}>
              <Pie data={kategoriVeri} dataKey="toplam" nameKey="kategori" cx="50%" cy="50%" innerRadius={70} outerRadius={110} stroke="none">
                {kategoriVeri.map((_, i) => (
                  <Cell key={i} fill={RENKLER[i % RENKLER.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => `₺${val.toLocaleString("tr-TR")}`} />
              <Legend iconType="circle" layout="horizontal" />
            </PieChart>

            <div className="flex-1" style={{ minWidth: "250px" }}>
              <div className="flex flex-col gap-sm">
                {kategoriVeri.map((k, i) => (
                  <div key={k.kategori} className="list-item" style={{ padding: "12px 16px" }}>
                    <div className="flex items-center gap-sm">
                      <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: RENKLER[i % RENKLER.length] }} />
                      <strong className="text-primary">{k.kategori}</strong>
                    </div>
                    <strong>₺{k.toplam.toLocaleString("tr-TR")}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Harcama Trendi */}
      <div className="card mt-lg">
        <h3 className="card-title">Harcama Trendi</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={aylikVeri} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="ay" axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `₺${(v/1000).toFixed(0)}K`} axisLine={false} tickLine={false} />
            <Tooltip formatter={(val) => `₺${val.toLocaleString("tr-TR")}`} />
            <Legend iconType="circle" />
            <Line type="monotone" dataKey="harcama" name="Harcama" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "#1a1a2e" }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="gelir" name="Gelir" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "#1a1a2e" }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Grafikler;