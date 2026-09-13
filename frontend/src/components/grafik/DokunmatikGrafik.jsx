import { useRef, useState } from "react";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, Area, Cell,
  XAxis, YAxis, CartesianGrid, ReferenceLine, ReferenceDot,
} from "recharts";
import { GRAFIK_RENK, paraKisa, paraTam } from "./tema";

// Dokunma noktasından veri indeksi hesaplarken çizim alanının nerede
// başladığını bilmemiz gerekiyor; bu yüzden YAxis genişliği sabit.
const EKSEN_GENISLIK = 46;
const SAG_BOSLUK = 10;

/**
 * Parmakla üzerinde gezindikçe o noktanın değerini grafiğin ÜSTÜNDE
 * gösteren kart.
 *
 * Recharts'ın kendi tooltip kutusu kapalı: mobilde tam parmağın altında
 * kalıyor ve okunmuyordu. Yerine sabit bir okuma satırı kullanıyoruz.
 *
 * Aktif indeksi recharts'ın olay nesnesinden değil, dokunmanın ekran
 * konumundan kendimiz hesaplıyoruz — recharts'ın touch davranışı sürüme
 * göre değişiyor. Hesabın doğru olması için X ekseninin ölçeği açıkça
 * veriliyor (scale): "point" noktaları uçlara, "band" bandın ortasına
 * koyar ve indeks formülü buna göre değişir.
 */
function DokunmatikGrafik({
  baslik,
  sagUst,
  veri = [],
  etiketAlani,
  seriler = [],
  tip = "line",          // "line" | "area" | "bar"
  yukseklik = 260,
  etiketBicim = (v) => v,
  altBilgi,
}) {
  const kapsayiciRef = useRef(null);
  const [aktif, setAktif] = useState(null);

  if (!veri.length) {
    return (
      <div className="card mt-lg">
        <h3 className="card-title">{baslik}</h3>
        <div className="empty-state">Gösterilecek veri yok.</div>
      </div>
    );
  }

  const cubuk = tip === "bar";
  // Dokunulmuyorken son dönemi göster; kart hiçbir zaman boş durmaz.
  const indeks = aktif ?? veri.length - 1;
  const nokta = veri[indeks];
  const seciliMi = aktif !== null;

  const indexBul = (clientX) => {
    const el = kapsayiciRef.current;
    if (!el) return null;
    const kutu = el.getBoundingClientRect();
    const genislik = kutu.width - EKSEN_GENISLIK - SAG_BOSLUK;
    if (genislik <= 0) return null;

    const oran = (clientX - kutu.left - EKSEN_GENISLIK) / genislik;
    // band: nokta bandın ortasında → hangi banda düştüğüne bak
    // point: noktalar uçlarda → en yakın noktaya yuvarla
    const ham = cubuk
      ? Math.floor(oran * veri.length)
      : Math.round(oran * (veri.length - 1));

    return Math.min(veri.length - 1, Math.max(0, ham));
  };

  const izle = (clientX) => setAktif(indexBul(clientX));
  const birak = () => setAktif(null);

  return (
    <div className="card mt-lg">
      <div className="grafik-baslik">
        <h3 className="card-title" style={{ marginBottom: 0 }}>{baslik}</h3>
        {sagUst}
      </div>

      {/* Okunan değer: parmak grafiğin üstündeyken burası canlı güncellenir */}
      <div className="grafik-okuma">
        <span className="grafik-okuma-donem">
          {etiketBicim(nokta[etiketAlani])}
          {!seciliMi && <em className="grafik-okuma-ipucu">— dokunup kaydırın</em>}
        </span>
        <div className="grafik-okuma-degerler">
          {seriler.map((s) => (
            <span key={s.alan} className="grafik-okuma-deger">
              <i style={{ background: s.renk }} />
              <span className="grafik-okuma-ad">{s.ad}</span>
              <strong>{paraTam(nokta[s.alan])}</strong>
            </span>
          ))}
        </div>
      </div>

      <div
        ref={kapsayiciRef}
        className="grafik-alan"
        onTouchStart={(e) => izle(e.touches[0].clientX)}
        onTouchMove={(e) => izle(e.touches[0].clientX)}
        onTouchEnd={birak}
        onTouchCancel={birak}
        onMouseMove={(e) => izle(e.clientX)}
        onMouseLeave={birak}
      >
        <ResponsiveContainer width="100%" height={yukseklik}>
          <ComposedChart data={veri} margin={{ top: 8, right: SAG_BOSLUK, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRAFIK_RENK.izgara} />
            <XAxis
              dataKey={etiketAlani}
              scale={cubuk ? "band" : "point"}
              tickFormatter={etiketBicim}
              axisLine={false}
              tickLine={false}
              tick={{ fill: GRAFIK_RENK.eksen, fontSize: 11 }}
              minTickGap={12}
            />
            <YAxis
              width={EKSEN_GENISLIK}
              tickFormatter={paraKisa}
              axisLine={false}
              tickLine={false}
              tick={{ fill: GRAFIK_RENK.eksen, fontSize: 11 }}
            />

            {/* Çizgi/alan: okunan dönemi dikey çizgi işaretler.
                Çubukta çizgi kullanılmıyor — band ölçeğinde çizginin bandın
                başına mı ortasına mı düşeceği recharts sürümüne bağlı;
                onun yerine seçili olmayan çubuklar soluklaştırılıyor. */}
            {seciliMi && !cubuk && (
              <ReferenceLine
                x={nokta[etiketAlani]}
                stroke={GRAFIK_RENK.vurgu}
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
            )}

            {seriler.map((s) =>
              cubuk ? (
                <Bar
                  key={s.alan} dataKey={s.alan} name={s.ad}
                  radius={[4, 4, 0, 0]} isAnimationActive={false}
                >
                  {veri.map((_, i) => (
                    <Cell
                      key={i}
                      fill={s.renk}
                      fillOpacity={!seciliMi || i === indeks ? 1 : 0.3}
                    />
                  ))}
                </Bar>
              ) : tip === "area" ? (
                <Area
                  key={s.alan} type="monotone" dataKey={s.alan} name={s.ad}
                  stroke={s.renk} strokeWidth={2} fill={s.renk} fillOpacity={0.14}
                  dot={false} activeDot={false} isAnimationActive={false}
                />
              ) : (
                <Line
                  key={s.alan} type="monotone" dataKey={s.alan} name={s.ad}
                  stroke={s.renk} strokeWidth={2.5}
                  dot={false} activeDot={false} isAnimationActive={false}
                />
              )
            )}

            {/* Çizgi/alan grafiğinde okunan noktayı büyütülmüş nokta ile göster */}
            {seciliMi && !cubuk && seriler.map((s) => (
              <ReferenceDot
                key={`n-${s.alan}`}
                x={nokta[etiketAlani]}
                y={nokta[s.alan]}
                r={5}
                fill={s.renk}
                stroke="var(--bg-card)"
                strokeWidth={2}
                isFront
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {altBilgi}
    </div>
  );
}

export default DokunmatikGrafik;
