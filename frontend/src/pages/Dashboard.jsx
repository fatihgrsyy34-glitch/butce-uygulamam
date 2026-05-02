import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { dashboardAPI } from "../services/api";
import { getCategoryData } from "../utils/categories";

function Dashboard() {
  const [veri, setVeri] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [secilenAy, setSecilenAy] = useState(new Date().toISOString().slice(0, 7));

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

  if (yukleniyor) return <div className="empty-state">⏳ Yükleniyor...</div>;
  if (!veri) return <div className="empty-state">Veri alınamadı.</div>;

  const kartBorcu = veri.kredi_karti_borcu || 0;
  const toplamYatirim = veri.toplam_yatirim || 0;
  const kalan = veri.kalan;
  const gelir = veri.toplam_gelir || 0;

  const yuzde = (miktar) => gelir > 0 ? ((Math.abs(miktar) / gelir) * 100).toFixed(1) : null;

  const saglikStatus = veri.saglik_skoru >= 70 ? "green" : veri.saglik_skoru >= 40 ? "yellow" : "red";

  const kategoriler = veri.kategoriler || [];
  const chartData = kategoriler.map(k => {
    const catData = getCategoryData(k.kategori);
    return { name: k.kategori, value: k.toplam, fill: catData.color };
  });

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Aylık finansal özetiniz</p>
        </div>
        <input
          type="month"
          value={secilenAy}
          onChange={(e) => setSecilenAy(e.target.value)}
          className="input"
          style={{ width: "auto" }}
        />
      </div>

      <div className="stat-grid mb-lg">
        <div className="stat-card green" style={{ background: "var(--bg-secondary)", borderBottom: "4px solid var(--green)" }}>
          <div className="stat-label flex items-center gap-sm">💵 Toplam Gelir</div>
          <div className="stat-value green">₺{veri.toplam_gelir.toLocaleString("tr-TR")}</div>
          <div className="stat-sub">Bu aya ait tüm kazançlar</div>
        </div>

        <div className="stat-card red" style={{ background: "var(--bg-secondary)", borderBottom: "4px solid var(--red)" }}>
          <div className="stat-label flex items-center gap-sm">💳 Kart Borcu (Ödenecek)</div>
          <div className="stat-value red">₺{kartBorcu.toLocaleString("tr-TR")}</div>
          <div className="flex items-center gap-sm mt-sm">
            {yuzde(kartBorcu) && (
              <span style={{ background: "var(--red-soft)", color: "var(--red)", fontSize: "12px", fontWeight: "700", padding: "2px 8px", borderRadius: "6px" }}>
                %{yuzde(kartBorcu)}
              </span>
            )}
            <span className="stat-sub">{veri.gecen_ay} dönemi</span>
          </div>
        </div>

        <div className="stat-card purple" style={{ background: "var(--bg-secondary)", borderBottom: "4px solid var(--accent-primary)" }}>
          <div className="stat-label flex items-center gap-sm">📈 Bu Ay Yatırım</div>
          <div className="stat-value purple">₺{toplamYatirim.toLocaleString("tr-TR")}</div>
          <div className="flex items-center gap-sm mt-sm">
            {yuzde(toplamYatirim) && (
              <span style={{ background: "rgba(59,130,246,0.1)", color: "var(--accent-primary)", fontSize: "12px", fontWeight: "700", padding: "2px 8px", borderRadius: "6px" }}>
                %{yuzde(toplamYatirim)}
              </span>
            )}
            <span className="stat-sub">Değerlendirilen miktar</span>
          </div>
        </div>

        <div className={`stat-card ${kalan >= 0 ? 'cyan' : 'red'}`}>
          <div className="stat-label flex items-center gap-sm">💰 Kalan (Net)</div>
          <div className={`stat-value ${kalan >= 0 ? 'cyan' : 'red'}`}>
            ₺{kalan.toLocaleString("tr-TR")}
          </div>
          <div className="flex items-center gap-sm mt-sm">
            {yuzde(kalan) && (
              <span style={{ background: kalan >= 0 ? "var(--cyan-soft)" : "var(--red-soft)", color: kalan >= 0 ? "var(--cyan)" : "var(--red)", fontSize: "12px", fontWeight: "700", padding: "2px 8px", borderRadius: "6px" }}>
                %{yuzde(kalan)}
              </span>
            )}
            <span className="stat-sub">Kullanılabilir bakiye</span>
          </div>
        </div>

        <div className="stat-card flex items-center justify-between">
          <div>
            <div className="stat-label">Sağlık Skoru</div>
            <div className="stat-sub" style={{ marginTop: "8px", maxWidth: "120px" }}>Durum: {saglikStatus === 'green' ? 'İyi 🟢' : 'Riskli 🔴'}</div>
          </div>
          <div className="score-circle">
            <span className={`text-${saglikStatus}`}>{veri.saglik_skoru}</span>
          </div>
        </div>
      </div>

      {/* Görselleştirilmiş Kategori Dağılımı */}
      {kategoriler.length > 0 && (
        <div className="card mt-lg flex items-start gap-lg flex-wrap" style={{ padding: "30px" }}>
          <div style={{ flex: 1, minWidth: "300px" }}>
            <h3 className="card-title mb-lg">Geçen Ayın Harcama Dağılımı</h3>
            <div className="flex flex-col gap-sm">
              {kategoriler.map((k) => {
                const catData = getCategoryData(k.kategori);
                const yuzdelik = kartBorcu > 0 ? Math.min(((k.toplam / kartBorcu) * 100), 100).toFixed(0) : 0;
                
                return (
                  <div key={k.kategori} className="flex items-center gap-md" style={{ padding: "10px", background: "var(--bg-tertiary)", borderRadius: "10px", border: "1px solid var(--bg-card-border)" }}>
                    <div style={{
                      width: "42px", height: "42px", borderRadius: "12px", 
                      background: catData.bg, color: catData.color,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px"
                    }}>
                      {catData.icon}
                    </div>
                    <div className="flex-1 pr-md">
                      <strong className="text-primary" style={{ fontSize: "15px" }}>{k.kategori}</strong>
                      <div className="progress-bar mt-sm" style={{ height: "6px", background: "#e2e8f0" }}>
                        <div className="progress-fill" style={{ width: `${yuzdelik}%`, background: catData.color, animation: "none" }} />
                      </div>
                    </div>
                    <strong style={{ color: catData.color, fontSize: "22px", minWidth: "90px", textAlign: "right" }}>₺{k.toplam.toLocaleString("tr-TR")}</strong>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ width: "260px", height: "260px", alignSelf: "center", marginTop: "20px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={110} stroke="none">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => `₺${val.toLocaleString("tr-TR")}`} contentStyle={{ background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0" }} itemStyle={{ color: "#0f172a" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;