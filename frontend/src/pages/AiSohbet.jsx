import { useState, useRef, useEffect } from "react";
import { aiAPI } from "../services/api";
import ParticleBackground from "../components/ParticleBackground";

function AiSohbet() {
  const [mesajlar, setMesajlar] = useState([]);
  const [soru, setSoru] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mesajlar, yukleniyor]);

  const handleGonder = async () => {
    if (!soru.trim() || yukleniyor) return;

    const yeniMesajlar = [...mesajlar, { rol: "user", icerik: soru }];
    setMesajlar(yeniMesajlar);
    setSoru("");
    setYukleniyor(true);

    try {
      const res = await aiAPI.sohbet(soru, mesajlar);
      setMesajlar([...yeniMesajlar, { rol: "assistant", icerik: res.data.cevap }]);
    } catch (err) {
      setMesajlar([...yeniMesajlar, { rol: "assistant", icerik: "Bir hata oluştu, tekrar dene." }]);
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <>
      <ParticleBackground />
      <div className="chat-container" style={{ position: "relative", zIndex: 1 }}>
        <div className="page-header" style={{ marginBottom: "10px" }}>
        <h2 className="page-title">🤖 AI Finans Asistanı</h2>
        <p className="page-subtitle">Gemini destekli kişisel finans danışmanınız</p>
      </div>

      {/* Mesajlar */}
      <div className="chat-messages">
        {mesajlar.length === 0 && (
          <div className="card" style={{ alignSelf: "center", maxWidth: "500px", marginTop: "40px", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>✨</div>
            <h3 className="card-title text-primary" style={{ marginBottom: "8px" }}>Nasıl yardımcı olabilirim?</h3>
            <p className="text-muted text-sm mb-lg">Geçmiş verilerinizi inceleyip size özel tavsiyeler verebilirim.</p>
            
            <div className="flex flex-col gap-sm">
              <button className="btn btn-secondary" onClick={() => setSoru("Bu ay bütçem nasıl gidiyor?")}>Bu ay bütçem nasıl gidiyor?</button>
              <button className="btn btn-secondary" onClick={() => setSoru("Önümüzdeki ay nasıl tasarruf edebilirim?")}>Tasarruf tavsiyesi ver</button>
              <button className="btn btn-secondary" onClick={() => setSoru("Harcama alışkanlıklarımı analiz et")}>Harcamalarımı analiz et</button>
            </div>
          </div>
        )}

        {mesajlar.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.rol}`}>
            {m.icerik}
          </div>
        ))}

        {yukleniyor && (
          <div className="chat-bubble assistant" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <span style={{ animation: "typing-dot 1.4s infinite ease-in-out both", animationDelay: "-0.32s", width: "6px", height: "6px", background: "var(--accent-primary)", borderRadius: "50%" }}></span>
            <span style={{ animation: "typing-dot 1.4s infinite ease-in-out both", animationDelay: "-0.16s", width: "6px", height: "6px", background: "var(--accent-primary)", borderRadius: "50%" }}></span>
            <span style={{ animation: "typing-dot 1.4s infinite ease-in-out both", width: "6px", height: "6px", background: "var(--accent-primary)", borderRadius: "50%" }}></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area card" style={{ padding: "10px", marginTop: "10px", display: "flex", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Asistana soru sorun..."
          value={soru}
          onChange={(e) => setSoru(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGonder()}
          className="input"
          style={{ border: "none", background: "transparent", boxShadow: "none" }}
          disabled={yukleniyor}
        />
        <button
          onClick={handleGonder}
          disabled={yukleniyor || !soru.trim()}
          className="btn btn-primary"
          style={{ padding: "10px 20px" }}
        >
          Gönder
        </button>
      </div>
    </div>
    </>
  );
}

export default AiSohbet;