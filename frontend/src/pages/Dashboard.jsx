import { useState, useEffect, useRef } from "react";
import { dashboardAPI } from "../services/api";
import { getCategoryData } from "../utils/categories";

const fmt = (n) => (n ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

// Geçen aya göre değişim rozeti. goodWhenUp: artış iyi mi (gelir=iyi, harcama=kötü)
function Delta({ cur, prev, goodWhenUp, suffix = "geçen aya göre" }) {
  if (prev === undefined || prev === null || prev === 0) return null;
  const pct = ((cur - prev) / Math.abs(prev)) * 100;
  if (!isFinite(pct)) return null;
  const up = pct >= 0;
  const iyi = up === goodWhenUp;
  const renk = iyi ? "var(--green)" : "var(--red)";
  const soft = iyi ? "var(--green-soft)" : "var(--red-soft)";
  return (
    <span className="flex items-center gap-sm" style={{ marginTop: 7 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: soft, color: renk, fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
        {up ? "▲" : "▼"} %{Math.abs(pct).toFixed(1).replace(".", ",")}
      </span>
      <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{suffix}</span>
    </span>
  );
}

function Dashboard() {
  const [veri, setVeri] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [secilenAy, setSecilenAy] = useState(new Date().toISOString().slice(0, 7));
  const ringRef = useRef(null);

  useEffect(() => {
    setYukleniyor(true);
    dashboardAPI.getir(secilenAy).then((res) => {
      setVeri(res.data);
      setYukleniyor(false);
    }).catch((err) => {
      console.error(err);
      setYukleniyor(false);
    });
  }, [secilenAy]);

  const skor = veri?.saglik_skoru ?? 0;

  // Sağlık skoru halkası
  useEffect(() => {
    const cv = ringRef.current;
    if (!cv || !veri) return;
    const css = getComputedStyle(document.documentElement);
    const dpr = window.devicePixelRatio || 1;
    const size = 150;
    cv.width = size * dpr; cv.height = size * dpr;
    const ctx = cv.getContext("2d");
    ctx.scale(dpr, dpr);
    const cx = size / 2, cy = size / 2, rad = 60;
    const renk = skor >= 70 ? css.getPropertyValue("--green").trim()
      : skor >= 40 ? css.getPropertyValue("--yellow").trim()
      : css.getPropertyValue("--red").trim();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf;
    const draw = (p) => {
      ctx.clearRect(0, 0, size, size);
      ctx.lineWidth = 11; ctx.lineCap = "round";
      ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.strokeStyle = css.getPropertyValue("--bg-tertiary").trim(); ctx.stroke();
      const start = -Math.PI / 2;
      ctx.beginPath(); ctx.arc(cx, cy, rad, start, start + (skor / 100) * Math.PI * 2 * p);
      ctx.strokeStyle = renk; ctx.stroke();
    };
    if (reduce) { draw(1); return; }
    let t0 = null;
    const step = (ts) => {
      if (!t0) t0 = ts;
      const p = Math.min(1, (ts - t0) / 850);
      draw(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [veri, skor]);

  if (yukleniyor) return <div className="empty-state">⏳ Yükleniyor…</div>;
  if (!veri) return <div className="empty-state">Veri alınamadı.</div>;

  const gelir = veri.toplam_gelir || 0;
  const kartBorcu = veri.kredi_karti_borcu || 0;
  const nakit = veri.nakit_harcama || 0;
  const yatirim = veri.toplam_yatirim || 0;
  const kalan = veri.kalan || 0;
  const onceki = veri.onceki || {};
  const kategoriler = veri.kategoriler || [];

  const toplamHarcama = kartBorcu + nakit;
  const oncekiHarcama = (onceki.kredi_karti_borcu || 0) + (onceki.nakit_harcama || 0);

  const pOf = (x) => (gelir > 0 ? Math.round((x / gelir) * 100) : 0);
  const harcamaPct = pOf(toplamHarcama);
  const yatirimPct = pOf(yatirim);
  const kalanPct = pOf(Math.max(kalan, 0));

  // Maaş dağılım çubuğu (harcama / yatırım / kalan)
  const segSpent = Math.max(toplamHarcama, 0);
  const segInv = Math.max(yatirim, 0);
  const segRem = Math.max(kalan, 0);
  const taban = Math.max(gelir, segSpent + segInv + segRem, 1);
  const w = (x) => `${(x / taban) * 100}%`;

  const skorDurum = skor >= 70 ? { t: "İyi", c: "var(--green)" } : skor >= 40 ? { t: "Orta", c: "var(--yellow)" } : { t: "Riskli", c: "var(--red)" };

  return (
    <div>
      <div className="page-header flex items-center justify-between flex-wrap gap-md">
        <div>
          <div style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--accent-primary)", fontWeight: 700 }}>
            Aylık Özet
          </div>
          <h2 className="page-title" style={{ marginTop: 4 }}>Genel Bakış</h2>
          <p className="page-subtitle">Bir bakışta nakit akışın ve finansal sağlığın.</p>
        </div>
        <input type="month" value={secilenAy} onChange={(e) => setSecilenAy(e.target.value)} className="input" style={{ width: "auto" }} />
      </div>

      {/* HERO */}
      <div className="dash-hero mb-lg">
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="stat-label">Kalan (Net) · Kullanılabilir Bakiye</div>
          <div className="stat-value tnum" style={{ fontSize: 46, color: kalan >= 0 ? "var(--cyan)" : "var(--red)", marginTop: 6 }}>
            <span style={{ color: "var(--text-faint)", fontSize: 26, fontWeight: 400, marginRight: 6 }}>₺</span>{fmt(kalan)}
          </div>
          <Delta cur={kalan} prev={onceki.kalan} goodWhenUp={true} />

          {/* Maaş dağılımı */}
          <div style={{ marginTop: "auto", paddingTop: 20 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Maaşının dağılımı</span>
              {gelir > 0 && <span style={{ fontSize: 11, color: "var(--text-faint)" }}>gelir ₺{fmt(gelir)}</span>}
            </div>
            <div style={{ display: "flex", height: 10, borderRadius: 6, overflow: "hidden", background: "var(--bg-tertiary)" }}>
              <div style={{ width: w(segSpent), background: "var(--red)" }} title="Harcama" />
              <div style={{ width: w(segInv), background: "var(--accent-primary)" }} title="Yatırım" />
              <div style={{ width: w(segRem), background: "var(--green)" }} title="Kalan" />
            </div>
            <div className="flex gap-lg flex-wrap" style={{ marginTop: 12 }}>
              <Legend renk="var(--red)" ad="Harcadın" pct={harcamaPct} />
              <Legend renk="var(--accent-primary)" ad="Yatırıma ayırdın" pct={yatirimPct} />
              <Legend renk="var(--green)" ad="Kaldı" pct={kalanPct} />
            </div>
          </div>
        </div>

        <div className="card flex flex-col items-center justify-center" style={{ textAlign: "center" }}>
          <div style={{ position: "relative", width: 150, height: 150 }}>
            <canvas ref={ringRef} style={{ width: 150, height: 150 }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <b className="tnum" style={{ fontFamily: "var(--font-serif)", fontSize: 40, fontWeight: 700, lineHeight: 1 }}>{skor}</b>
              <span style={{ fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--text-faint)", marginTop: 3 }}>Skor</span>
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12.5, color: "var(--text-muted)" }}>
            Finansal sağlık: <b style={{ color: skorDurum.c }}>{skorDurum.t}</b>
          </div>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="stat-grid">
        <KpiCard label="Toplam Gelir" deger={gelir} renk="var(--green)"
          delta={<Delta cur={gelir} prev={onceki.gelir} goodWhenUp={true} />}
          note="Bu aya ait tüm kazançlar" />

        <KpiCard label="Kart Borcu (Ödenecek)" deger={kartBorcu} renk="var(--red)"
          pct={gelir > 0 ? `maaşının %${pOf(kartBorcu)}'i` : null}
          delta={<Delta cur={kartBorcu} prev={onceki.kredi_karti_borcu} goodWhenUp={false} />}
          note={`${veri.gecen_ay} dönemi`} />

        <KpiCard label="Nakit / Manuel Harcama" deger={nakit} renk="var(--red)"
          pct={gelir > 0 ? `maaşının %${pOf(nakit)}'i` : null}
          delta={<Delta cur={nakit} prev={onceki.nakit_harcama} goodWhenUp={false} />}
          note="nakit / hesaptan" />

        <KpiCard label="Bu Ay Yatırım" deger={yatirim} renk="var(--accent-primary)"
          pct={gelir > 0 ? `maaşının %${pOf(yatirim)}'i` : null}
          delta={<Delta cur={yatirim} prev={onceki.yatirim} goodWhenUp={true} />}
          note="değerlendirilen miktar" />
      </div>

      {/* Toplam harcama MoM özeti */}
      <div className="card mb-lg flex items-center justify-between flex-wrap gap-md">
        <div className="flex items-center gap-md">
          <div className="score-circle" style={{ background: "var(--red-soft)", color: "var(--red)" }}>Σ</div>
          <div>
            <div className="stat-label" style={{ marginBottom: 2 }}>Toplam Harcama (Kart + Nakit)</div>
            <div className="stat-value tnum" style={{ fontSize: 22, color: "var(--red)" }}>₺{fmt(toplamHarcama)}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <Delta cur={toplamHarcama} prev={oncekiHarcama} goodWhenUp={false} suffix="geçen aya göre harcama" />
          {gelir > 0 && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Bu ay maaşının <b style={{ color: "var(--text-primary)" }}>%{harcamaPct}</b>'ini harcadın</div>}
        </div>
      </div>

      {/* Kategori dağılımı */}
      {kategoriler.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-md">
            <h3 className="card-title" style={{ margin: 0 }}>Harcama Dağılımı</h3>
            <span style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{veri.gecen_ay} dönemi · ₺{fmt(kartBorcu)}</span>
          </div>
          <div>
            {kategoriler.map((k, i) => {
              const cat = getCategoryData(k.kategori);
              const maxV = Math.max(...kategoriler.map((x) => x.toplam), 1);
              const pct = Math.round((k.toplam / maxV) * 100);
              return (
                <div key={k.kategori} style={{ padding: "11px 0", borderTop: i === 0 ? "none" : "1px solid var(--bg-card-border)" }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 7 }}>
                    <span className="flex items-center gap-sm" style={{ fontSize: 13, fontWeight: 500 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: cat.color, display: "inline-block" }} />
                      {k.kategori}
                    </span>
                    <span className="tnum" style={{ fontSize: 13, fontWeight: 600 }}>₺{fmt(k.toplam)}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 6, background: "var(--bg-tertiary)", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: 6, background: cat.color, transformOrigin: "left", animation: "grow 0.9s cubic-bezier(.2,.7,.2,1) both", animationDelay: `${i * 0.05}s` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Legend({ renk, ad, pct }) {
  return (
    <span className="flex items-center gap-sm">
      <span style={{ width: 9, height: 9, borderRadius: 3, background: renk }} />
      <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{ad} <b className="tnum" style={{ color: "var(--text-primary)" }}>%{pct}</b></span>
    </span>
  );
}

function KpiCard({ label, deger, renk, pct, delta, note }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value tnum" style={{ color: renk }}>
        <span style={{ color: "var(--text-faint)", fontSize: 15, fontWeight: 400, marginRight: 3 }}>₺</span>{fmt(deger)}
      </div>
      {pct && <div style={{ fontSize: 11.5, color: "var(--accent-primary)", fontWeight: 600, marginTop: 4 }}>{pct}</div>}
      {delta}
      <div className="stat-sub" style={{ marginTop: delta ? 6 : 4 }}>{note}</div>
    </div>
  );
}

export default Dashboard;
