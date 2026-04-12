import { useState } from "react";
import api from "../services/api";

export default function Login({ onLogin }) {
  const [mod, setMod] = useState("giris"); // giris | kayit
  const [form, setForm] = useState({ isim: "", email: "", sifre: "" });
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setHata("");
    setYukleniyor(true);

    try {
      if (mod === "kayit") {
        if (!form.isim || !form.email || !form.sifre) {
          setHata("Tüm alanları doldurun");
          setYukleniyor(false);
          return;
        }
        const { data } = await api.post("/kayit", form);
        localStorage.setItem("token", data.token);
        onLogin(data.kullanici);
      } else {
        if (!form.email || !form.sifre) {
          setHata("Email ve şifre gerekli");
          setYukleniyor(false);
          return;
        }
        const { data } = await api.post("/giris", {
          email: form.email,
          sifre: form.sifre,
        });
        localStorage.setItem("token", data.token);
        onLogin(data.kullanici);
      }
    } catch (err) {
      setHata(err.response?.data?.hata || "Bir hata oluştu");
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-primary)",
      }}
    >
      <div
        className="card"
        style={{
          width: "400px",
          padding: "40px",
          textAlign: "center",
          boxShadow: "0 20px 40px rgba(0,0,0,0.05)"
        }}
      >
        <h1
          style={{
            marginBottom: "8px",
            fontSize: "28px",
            background: "var(--accent-gradient)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontWeight: "800",
            letterSpacing: "-0.5px"
          }}
        >
          💰 Bütçem
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            marginBottom: "30px",
            fontSize: "14px",
          }}
        >
          {mod === "giris"
            ? "Hesabınıza giriş yapın"
            : "Yeni hesap oluşturun"}
        </p>

        {/* Tab butonları */}
        <div className="tab-bar" style={{ marginBottom: "24px" }}>
          {["giris", "kayit"].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMod(m);
                setHata("");
              }}
              className={`tab-btn ${mod === m ? "active" : ""}`}
              style={{ flex: 1, textAlign: "center", padding: "10px" }}
            >
              {m === "giris" ? "Giriş Yap" : "Kayıt Ol"}
            </button>
          ))}
        </div>

        <form onSubmit={handle} className="flex flex-col gap-sm">
          {mod === "kayit" && (
            <input
              type="text"
              placeholder="İsim"
              value={form.isim}
              onChange={(e) => setForm({ ...form, isim: e.target.value })}
              className="input"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input"
          />
          <input
            type="password"
            placeholder="Şifre"
            value={form.sifre}
            onChange={(e) => setForm({ ...form, sifre: e.target.value })}
            className="input"
          />

          {hata && (
            <div className="text-red text-sm mt-sm text-center">
              {hata}
            </div>
          )}

          <button
            type="submit"
            disabled={yukleniyor}
            className="btn btn-primary mt-sm"
            style={{ width: "100%", justifyContent: "center", padding: "14px", fontSize: "15px" }}
          >
            {yukleniyor
              ? "Yükleniyor..."
              : mod === "giris"
              ? "Giriş Yap"
              : "Kayıt Ol"}
          </button>
        </form>
      </div>
    </div>
  );
}
