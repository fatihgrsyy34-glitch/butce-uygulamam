require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { db } = require("./database");

const upload = multer({ dest: "uploads/" });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const JWT_SECRET = process.env.JWT_SECRET || "butce-app-secret-key";

const AY_MAP = { "Ocak":"01","Şubat":"02","Mart":"03","Nisan":"04","Mayıs":"05","Haziran":"06","Temmuz":"07","Ağustos":"08","Eylül":"09","Ekim":"10","Kasım":"11","Aralık":"12" };
const donemToYilAy = (donemAdi) => {
  const [ay, yil] = (donemAdi || "").split(" ");
  return AY_MAP[ay] && yil ? `${yil}-${AY_MAP[ay]}` : null;
};

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ==================== AUTH MIDDLEWARE ====================
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ hata: "Token gerekli" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.kullanici = decoded;
    next();
  } catch (err) {
    res.status(401).json({ hata: "Geçersiz token" });
  }
};

// ==================== AUTH ====================
app.post("/api/kayit", async (req, res) => {
  try {
    const { isim, email, sifre } = req.body;
    if (!isim || !email || !sifre) return res.status(400).json({ hata: "Tüm alanlar zorunlu" });
    const mevcut = db.prepare("SELECT id FROM kullanicilar WHERE email = ?").get(email);
    if (mevcut) return res.status(400).json({ hata: "Bu email zaten kayıtlı" });
    const hash = await bcrypt.hash(sifre, 10);
    const result = db.prepare("INSERT INTO kullanicilar (isim, email, sifre) VALUES (?, ?, ?)").run(isim, email, hash);
    const token = jwt.sign({ id: result.lastInsertRowid, isim, email }, JWT_SECRET, { expiresIn: "30d" });
    res.status(201).json({ token, kullanici: { id: result.lastInsertRowid, isim, email } });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.post("/api/giris", async (req, res) => {
  try {
    const { email, sifre } = req.body;
    const kullanici = db.prepare("SELECT * FROM kullanicilar WHERE email = ?").get(email);
    if (!kullanici) return res.status(400).json({ hata: "Email veya şifre hatalı" });
    const dogru = await bcrypt.compare(sifre, kullanici.sifre);
    if (!dogru) return res.status(400).json({ hata: "Email veya şifre hatalı" });
    const token = jwt.sign({ id: kullanici.id, isim: kullanici.isim, email: kullanici.email }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, kullanici: { id: kullanici.id, isim: kullanici.isim, email: kullanici.email } });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.get("/api/beni-getir", authMiddleware, (req, res) => {
  const kullanici = db.prepare("SELECT id, isim, email FROM kullanicilar WHERE id = ?").get(req.kullanici.id);
  res.json(kullanici);
});

// ==================== GELİRLER ====================
app.get("/api/gelirler", authMiddleware, (req, res) => {
  try {
    res.json(db.prepare("SELECT * FROM gelirler WHERE kullanici_id = ? ORDER BY tarih DESC").all(req.kullanici.id));
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.post("/api/gelirler", authMiddleware, (req, res) => {
  try {
    const { tarih, miktar, kategori, aciklama, tekrar_mi } = req.body;
    const result = db.prepare("INSERT INTO gelirler (tarih, miktar, kategori, aciklama, tekrar_mi, kullanici_id) VALUES (?, ?, ?, ?, ?, ?)").run(tarih, parseFloat(miktar), kategori || "Maaş", aciklama || "", tekrar_mi ? 1 : 0, req.kullanici.id);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.delete("/api/gelirler/:id", authMiddleware, (req, res) => {
  try {
    db.prepare("DELETE FROM gelirler WHERE id = ? AND kullanici_id = ?").run(req.params.id, req.kullanici.id);
    res.json({ basarili: true });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

// ==================== HARCAMALAR ====================
app.get("/api/harcamalar", authMiddleware, (req, res) => {
  try {
    res.json(db.prepare("SELECT * FROM harcamalar WHERE kullanici_id = ? AND (sadece_takip IS NULL OR sadece_takip = 0) ORDER BY tarih DESC").all(req.kullanici.id));
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.post("/api/harcamalar", authMiddleware, (req, res) => {
  try {
    const { tarih, miktar, kategori, kart_id, aciklama } = req.body;
    const result = db.prepare("INSERT INTO harcamalar (tarih, miktar, kategori, kart_id, aciklama, kullanici_id) VALUES (?, ?, ?, ?, ?, ?)").run(tarih, parseFloat(miktar), kategori, kart_id || null, aciklama || "", req.kullanici.id);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.delete("/api/harcamalar/:id", authMiddleware, (req, res) => {
  try {
    db.prepare("DELETE FROM harcamalar WHERE id = ? AND kullanici_id = ?").run(req.params.id, req.kullanici.id);
    res.json({ basarili: true });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

// ==================== KARTLAR ====================
app.get("/api/kartlar", authMiddleware, (req, res) => {
  try {
    res.json(db.prepare("SELECT * FROM kartlar WHERE kullanici_id = ? ORDER BY isim").all(req.kullanici.id));
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.post("/api/kartlar", authMiddleware, (req, res) => {
  try {
    const { isim, limit_miktar, son_odeme_gunu, banka, renk } = req.body;
    const result = db.prepare("INSERT INTO kartlar (isim, limit_miktar, son_odeme_gunu, banka, renk, kullanici_id) VALUES (?, ?, ?, ?, ?, ?)").run(isim, parseFloat(limit_miktar) || 0, parseInt(son_odeme_gunu) || null, banka || "", renk || "#6366f1", req.kullanici.id);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.delete("/api/kartlar/:id", authMiddleware, (req, res) => {
  try {
    db.prepare("DELETE FROM kartlar WHERE id = ? AND kullanici_id = ?").run(req.params.id, req.kullanici.id);
    res.json({ basarili: true });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

// ==================== YATIRIMLAR ====================
app.get("/api/yatirimlar", authMiddleware, (req, res) => {
  try {
    res.json(db.prepare("SELECT * FROM yatirimlar WHERE kullanici_id = ? ORDER BY tarih DESC").all(req.kullanici.id));
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.post("/api/yatirimlar", authMiddleware, (req, res) => {
  try {
    const { tip, miktar, alis_fiyati, tarih, aciklama } = req.body;
    const result = db.prepare("INSERT INTO yatirimlar (tip, miktar, alis_fiyati, tarih, aciklama, kullanici_id) VALUES (?, ?, ?, ?, ?, ?)").run(tip, parseFloat(miktar), parseFloat(alis_fiyati), tarih, aciklama || "", req.kullanici.id);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.delete("/api/yatirimlar/:id", authMiddleware, (req, res) => {
  try {
    db.prepare("DELETE FROM yatirimlar WHERE id = ? AND kullanici_id = ?").run(req.params.id, req.kullanici.id);
    res.json({ basarili: true });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

// ==================== HEDEFLER ====================
app.get("/api/hedefler", authMiddleware, (req, res) => {
  try {
    res.json(db.prepare("SELECT * FROM hedefler WHERE kullanici_id = ? ORDER BY rowid DESC").all(req.kullanici.id));
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.post("/api/hedefler", authMiddleware, (req, res) => {
  try {
    const { isim, hedef_miktar, mevcut_miktar, bitis_tarihi } = req.body;
    const result = db.prepare("INSERT INTO hedefler (isim, hedef_miktar, mevcut_miktar, bitis_tarihi, kullanici_id) VALUES (?, ?, ?, ?, ?)").run(isim, parseFloat(hedef_miktar), parseFloat(mevcut_miktar) || 0, bitis_tarihi || null, req.kullanici.id);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.delete("/api/hedefler/:id", authMiddleware, (req, res) => {
  try {
    db.prepare("DELETE FROM hedefler WHERE id = ? AND kullanici_id = ?").run(req.params.id, req.kullanici.id);
    res.json({ basarili: true });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

// ==================== KURALLAR ====================
app.get("/api/kurallar", authMiddleware, (req, res) => {
  try {
    res.json(db.prepare("SELECT * FROM kurallar WHERE kullanici_id = ? ORDER BY id").all(req.kullanici.id));
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.put("/api/kurallar", authMiddleware, (req, res) => {
  try {
    const { kurallar } = req.body;
    const guncelle = db.prepare("UPDATE kurallar SET yuzde = ? WHERE id = ? AND kullanici_id = ?");
    kurallar.forEach(k => guncelle.run(k.yuzde, k.id, req.kullanici.id));
    res.json({ basarili: true });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.post("/api/kurallar/profil", authMiddleware, (req, res) => {
  try {
    const { profilAdi } = req.body;
    const kategoriler = ["Kredi Kartı Ödemesi", "Altın Yatırımı", "Hisse Senedi", "Nakit", "Serbest"];
    const ekle = db.prepare("INSERT INTO kurallar (profil_adi, aktif, kategori, yuzde, kullanici_id) VALUES (?, ?, ?, ?, ?)");
    kategoriler.forEach(k => ekle.run(profilAdi, 0, k, 0, req.kullanici.id));
    res.json(db.prepare("SELECT * FROM kurallar WHERE profil_adi = ? AND kullanici_id = ?").all(profilAdi, req.kullanici.id));
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.delete("/api/kurallar/profil/:profilAdi", authMiddleware, (req, res) => {
  try {
    db.prepare("DELETE FROM kurallar WHERE profil_adi = ? AND kullanici_id = ?").run(req.params.profilAdi, req.kullanici.id);
    res.json({ basarili: true });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

// ==================== DASHBOARD ====================
app.get("/api/dashboard", authMiddleware, (req, res) => {
  try {
    const ay = req.query.ay || new Date().toISOString().slice(0, 7);
    const uid = req.kullanici.id;
    const gelir = db.prepare("SELECT COALESCE(SUM(miktar), 0) as toplam FROM gelirler WHERE kullanici_id = ? AND strftime('%Y-%m', tarih) = ?").get(uid, ay);
    const harcama = db.prepare("SELECT COALESCE(SUM(miktar), 0) as toplam FROM harcamalar WHERE kullanici_id = ? AND strftime('%Y-%m', tarih) = ? AND (sadece_takip IS NULL OR sadece_takip = 0)").get(uid, ay);
    const kategoriler = db.prepare("SELECT kategori, SUM(miktar) as toplam FROM harcamalar WHERE kullanici_id = ? AND strftime('%Y-%m', tarih) = ? AND (sadece_takip IS NULL OR sadece_takip = 0) GROUP BY kategori ORDER BY toplam DESC").all(uid, ay);
    const yatirim = db.prepare("SELECT COALESCE(SUM(miktar * alis_fiyati), 0) as toplam FROM yatirimlar WHERE kullanici_id = ? AND strftime('%Y-%m', tarih) = ?").get(uid, ay);

    const gecenAyDate = new Date(ay + "-01");
    gecenAyDate.setMonth(gecenAyDate.getMonth() - 1);
    const gecenAyStr = gecenAyDate.toISOString().slice(0, 7);
    const krediKartiBorcu = db.prepare("SELECT COALESCE(SUM(toplam_tutar), 0) as toplam FROM ekstreler WHERE kullanici_id = ? AND donem_yilAy = ? AND (sadece_takip IS NULL OR sadece_takip = 0)").get(uid, gecenAyStr);

    const toplam_gelir = gelir.toplam;
    const toplam_harcama = harcama.toplam;
    const kalan = toplam_gelir - toplam_harcama;
    let saglik_skoru = 100;
    if (toplam_gelir > 0) {
      const oran = toplam_harcama / toplam_gelir;
      if (oran > 0.9) saglik_skoru = 20;
      else if (oran > 0.7) saglik_skoru = 50;
      else if (oran > 0.5) saglik_skoru = 70;
      else saglik_skoru = 90;
    }
    res.json({ toplam_gelir, toplam_harcama, kalan, saglik_skoru, kategoriler, ay, toplam_yatirim: yatirim.toplam, kredi_karti_borcu: krediKartiBorcu.toplam, gecen_ay: gecenAyStr });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

// ==================== DAGILIM ====================
app.post("/api/dagilim-hesapla", authMiddleware, (req, res) => {
  try {
    const { gelir, profilAdi } = req.body;
    let kurallar;
    if (profilAdi) {
      kurallar = db.prepare("SELECT * FROM kurallar WHERE profil_adi = ? AND kullanici_id = ?").all(profilAdi, req.kullanici.id);
    } else {
      kurallar = db.prepare("SELECT * FROM kurallar WHERE aktif = 1 AND kullanici_id = ?").all(req.kullanici.id);
      if (kurallar.length === 0) {
        kurallar = db.prepare("SELECT * FROM kurallar WHERE kullanici_id = ? AND profil_adi = (SELECT profil_adi FROM kurallar WHERE kullanici_id = ? LIMIT 1)").all(req.kullanici.id, req.kullanici.id);
      }
    }
    const dagilim = kurallar.map(k => ({
      kategori: k.kategori,
      yuzde: k.yuzde,
      miktar: (gelir * k.yuzde) / 100
    }));
    res.json({ dagilim });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

// ==================== EKSTRE YÜKLE ====================
app.post("/api/ekstre-yukle", authMiddleware, upload.single("pdf"), async (req, res) => {
  if (!req.file) return res.status(400).json({ hata: "PDF dosyası yükleyin" });
  const pdfPath = req.file.path;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const pdfData = fs.readFileSync(pdfPath);
    const base64Pdf = pdfData.toString("base64");
    const prompt = `Bu bir Türk bankasına ait kredi kartı ekstresidir. Harcamaları aşağıdaki JSON formatında çıkar:
{"harcamalar": [{"tarih": "YYYY-MM-DD", "aciklama": "işlem açıklaması", "miktar": 0, "kategori": "kategori"}]}
Kategori seçenekleri: Market, Yemek & Restoran, Ulaşım, Giyim, Sağlık, Eğlence, Faturalar, Eğitim, Diğer
Sadece JSON döndür, başka hiçbir şey yazma.`;
    const result = await model.generateContent([{ inlineData: { mimeType: "application/pdf", data: base64Pdf } }, prompt]);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI yanıtından JSON çıkarılamadı");
    const analizSonucu = JSON.parse(jsonMatch[0]);
    const kartId = req.body.kart_id ? parseInt(req.body.kart_id) : null;
    const donemAdi = req.body.donem_adi || "Bilinmiyor";
    const donemYilAy = donemToYilAy(donemAdi);
    const sadeceTakip = req.body.sadece_takip === "1" ? 1 : 0;
    const harcamalar = analizSonucu.harcamalar || [];
    const toplamTutar = harcamalar.reduce((sum, h) => sum + (h.miktar || 0), 0);

    let ekstreId = null;
    if (harcamalar.length > 0) {
      db.transaction(() => {
        const ekstreResult = db.prepare(
          "INSERT INTO ekstreler (kart_id, donem_adi, donem_yilAy, harcama_sayisi, toplam_tutar, sadece_takip, kullanici_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
        ).run(kartId, donemAdi, donemYilAy, harcamalar.length, toplamTutar, sadeceTakip, req.kullanici.id);
        ekstreId = ekstreResult.lastInsertRowid;
        for (const h of harcamalar) {
          db.prepare(
            "INSERT INTO harcamalar (tarih, miktar, kategori, kart_id, aciklama, ekstre_id, sadece_takip, kullanici_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
          ).run(h.tarih, h.miktar, h.kategori, kartId, h.aciklama, ekstreId, sadeceTakip, req.kullanici.id);
        }
      })();
    }

    fs.unlinkSync(pdfPath);
    res.json({ mesaj: `${harcamalar.length} harcama içe aktarıldı`, harcamalar, ekstre_id: ekstreId });
  } catch (err) {
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    res.status(500).json({ hata: "PDF analizi başarısız: " + err.message });
  }
});

app.get("/api/ekstreler", authMiddleware, (req, res) => {
  try {
    const ekstreler = db.prepare(`
      SELECT e.*, k.isim as kart_isim, k.renk as kart_renk, k.banka as kart_banka
      FROM ekstreler e
      LEFT JOIN kartlar k ON e.kart_id = k.id
      WHERE e.kullanici_id = ?
      ORDER BY e.yukleme_tarihi DESC
    `).all(req.kullanici.id);
    res.json(ekstreler);
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.get("/api/ekstreler/:id/harcamalar", authMiddleware, (req, res) => {
  try {
    const harcamalar = db.prepare(
      "SELECT * FROM harcamalar WHERE ekstre_id = ? AND kullanici_id = ? ORDER BY tarih ASC"
    ).all(req.params.id, req.kullanici.id);
    res.json(harcamalar);
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.delete("/api/ekstreler/:id", authMiddleware, (req, res) => {
  try {
    db.transaction(() => {
      db.prepare("DELETE FROM harcamalar WHERE ekstre_id = ? AND kullanici_id = ?").run(req.params.id, req.kullanici.id);
      db.prepare("DELETE FROM ekstreler WHERE id = ? AND kullanici_id = ?").run(req.params.id, req.kullanici.id);
    })();
    res.json({ basarili: true });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

// ==================== AI SOHBET ====================
app.post("/api/ai-sohbet", authMiddleware, async (req, res) => {
  try {
    const { soru, gecmis } = req.body;
    if (!soru) return res.status(400).json({ hata: "Soru boş olamaz" });
    const uid = req.kullanici.id;
    const gelirSonAylar = db.prepare("SELECT strftime('%Y-%m', tarih) as ay, SUM(miktar) as toplam FROM gelirler WHERE kullanici_id = ? GROUP BY ay ORDER BY ay DESC LIMIT 6").all(uid);
    const harcamaSonAylar = db.prepare("SELECT strftime('%Y-%m', tarih) as ay, kategori, SUM(miktar) as toplam FROM harcamalar WHERE kullanici_id = ? GROUP BY ay, kategori ORDER BY ay DESC").all(uid);
    const sistem = `Sen bir Türk kişisel finans asistanısın. Kullanıcının tüm finansal geçmişi:

GELİRLER (son 6 ay):
${gelirSonAylar.map(g => `${g.ay}: ₺${g.toplam}`).join("\n")}

HARCAMALAR (tüm aylar, kategori bazlı):
${harcamaSonAylar.map(h => `${h.ay} - ${h.kategori}: ₺${h.toplam}`).join("\n")}

Kullanıcı hangi ayı sorarsa o aya ait verileri kullan. Türkçe, samimi ve pratik tavsiyeler ver.`;
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: sistem });
    const chat = model.startChat({
      history: (gecmis || []).slice(-10).map(m => ({ role: m.rol === "user" ? "user" : "model", parts: [{ text: m.icerik }] }))
    });
    const result = await chat.sendMessage(soru);
    res.json({ cevap: result.response.text() });
  } catch (err) {
    res.status(500).json({ hata: "AI yanıt üretemedi: " + err.message });
  }
});

// ==================== FİYATLAR ====================
app.get("/api/fiyatlar", authMiddleware, async (req, res) => {
  try {
    const [altinRes, dovizRes] = await Promise.all([
      fetch("https://api.collectapi.com/economy/goldPrice", {
        headers: { "authorization": process.env.COLLECT_API_KEY, "content-type": "application/json" }
      }),
      fetch("https://api.collectapi.com/economy/singleCurrency?base=USD", {
        headers: { "authorization": process.env.COLLECT_API_KEY, "content-type": "application/json" }
      })
    ]);
    const altinData = await altinRes.json();
    const dovizData = await dovizRes.json();
    const altin = {};
    if (altinData.success) {
      altinData.result.forEach(a => {
        altin[a.name] = { alis: parseFloat(a.buy), satis: parseFloat(a.sell) };
      });
    }
    res.json({ altin, doviz: dovizData.result || [] });
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});

// ==================== SUNUCU ====================
app.listen(PORT, () => {
  console.log(`✅ Sunucu çalışıyor: http://localhost:${PORT}`);
});