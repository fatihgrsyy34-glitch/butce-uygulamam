import { useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { kategoriRengi, paraTam } from "./tema";

/**
 * Kategori halkası. Bir dilime dokununca halkanın ortası o kategorinin
 * adını, tutarını ve yüzdesini gösterir; dokunulmadığında toplamı.
 *
 * Eski hali <PieChart width={300}> ile sabit genişlikteydi — dar ekranda
 * ne küçülüyor ne de ortalanıyordu. Artık kapsayıcıya uyuyor.
 */
function KategoriHalka({ veri = [], adAlani = "kategori", degerAlani = "toplam", yukseklik = 260 }) {
  const [aktif, setAktif] = useState(null);

  const toplam = veri.reduce((t, d) => t + (d[degerAlani] || 0), 0);
  if (!veri.length || toplam <= 0) {
    return <div className="empty-state">Bu ay harcama verisi yok.</div>;
  }

  const secili = aktif !== null ? veri[aktif] : null;
  const gosterilenTutar = secili ? secili[degerAlani] : toplam;
  const yuzde = secili ? (secili[degerAlani] / toplam) * 100 : 100;

  return (
    <div className="halka-sarmal">
      <div
        className="halka-grafik"
        onMouseLeave={() => setAktif(null)}
      >
        <ResponsiveContainer width="100%" height={yukseklik}>
          <PieChart>
            <Pie
              data={veri}
              dataKey={degerAlani}
              nameKey={adAlani}
              cx="50%"
              cy="50%"
              innerRadius="62%"
              outerRadius="92%"
              stroke="none"
              isAnimationActive={false}
              onClick={(_, i) => setAktif((ö) => (ö === i ? null : i))}
              onMouseEnter={(_, i) => setAktif(i)}
            >
              {veri.map((d, i) => (
                <Cell
                  key={d[adAlani]}
                  fill={kategoriRengi(d[adAlani])}
                  fillOpacity={aktif === null || aktif === i ? 1 : 0.3}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Halkanın ortasındaki okuma — dokunmayı engellememesi için
            pointer-events CSS'te kapalı */}
        <div className="halka-orta">
          <span className="halka-orta-ad">{secili ? secili[adAlani] : "Toplam"}</span>
          <strong className="halka-orta-tutar">{paraTam(gosterilenTutar)}</strong>
          {secili && <span className="halka-orta-yuzde">%{yuzde.toFixed(1)}</span>}
        </div>
      </div>

      <ul className="halka-liste">
        {veri.map((d, i) => (
          <li
            key={d[adAlani]}
            className={`halka-satir${aktif === i ? " aktif" : ""}`}
            onClick={() => setAktif((ö) => (ö === i ? null : i))}
          >
            <span className="halka-nokta" style={{ background: kategoriRengi(d[adAlani]) }} />
            <span className="halka-ad">{d[adAlani]}</span>
            <span className="halka-oran">%{((d[degerAlani] / toplam) * 100).toFixed(0)}</span>
            <strong className="halka-tutar">{paraTam(d[degerAlani])}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default KategoriHalka;
