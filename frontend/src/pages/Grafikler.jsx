import { useState, useEffect } from "react";
import { harcamaAPI, gelirAPI } from "../services/api";
import DokunmatikGrafik from "../components/grafik/DokunmatikGrafik";
import KategoriHalka from "../components/grafik/KategoriHalka";
import { GRAFIK_RENK, ayKisa, ayUzun } from "../components/grafik/tema";

const SERILER = [
  { alan: "gelir", ad: "Gelir", renk: GRAFIK_RENK.gelir },
  { alan: "harcama", ad: "Harcama", renk: GRAFIK_RENK.harcama },
];

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

      <DokunmatikGrafik
        baslik="Aylık Gelir & Harcama"
        veri={aylikVeri}
        etiketAlani="ay"
        seriler={SERILER}
        tip="bar"
        yukseklik={260}
        etiketBicim={ayKisa}
      />

      <div className="card mt-lg">
        <div className="grafik-baslik">
          <h3 className="card-title" style={{ marginBottom: 0 }}>Kategori Dağılımı</h3>
          <input
            type="month"
            value={secilenAy}
            onChange={(e) => setSecilenAy(e.target.value)}
            className="input input-ay"
          />
        </div>
        <KategoriHalka veri={kategoriVeri} />
      </div>

      <DokunmatikGrafik
        baslik="Gelir & Harcama Trendi"
        veri={aylikVeri}
        etiketAlani="ay"
        seriler={SERILER}
        tip="area"
        yukseklik={240}
        etiketBicim={ayKisa}
        altBilgi={
          aylikVeri.length > 0 && (
            <p className="grafik-dipnot">
              {ayUzun(aylikVeri[0].ay)} – {ayUzun(aylikVeri[aylikVeri.length - 1].ay)} arası {aylikVeri.length} ay
            </p>
          )
        }
      />
    </div>
  );
}

export default Grafikler;
