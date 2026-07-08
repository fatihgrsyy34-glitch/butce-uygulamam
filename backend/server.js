require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { db, dbReady } = require("./database");

const upload = multer({ dest: "uploads/" });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const JWT_SECRET = process.env.JWT_SECRET || "butce-app-secret-key";

const AY_MAP = { "Ocak":"01","Şubat":"02","Mart":"03","Nisan":"04","Mayıs":"05","Haziran":"06","Temmuz":"07","Ağustos":"08","Eylül":"09","Ekim":"10","Kasım":"11","Aralık":"12" };
const donemToYilAy = (donemAdi) => {
  const [ay, yil] = (donemAdi || "").split(" ");
  return AY_MAP[ay] && yil ? `${yil}-${AY_MAP[ay]}` : null;
};

// libsql Row nesnelerini düz JSON objesine çevirir
const toRows = (r) => r.rows.map(row => Object.fromEntries(r.columns.map((col, i) => [col, row[i]])));
const toRow = (r) => r.rows[0] ? Object.fromEntries(r.columns.map((col, i) => [col, r.rows[0][i]])) : null;

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
    const mevcut = toRow(await db.execute({ sql: "SELECT id FROM kullanicilar WHERE email = ?", args: [email] }));
    if (mevcut) return res.status(400).json({ hata: "Bu email zaten kayıtlı" });
    const hash = await bcrypt.hash(sifre, 10);
    const result = await db.execute({ sql: "INSERT INTO kullanicilar (isim, email, sifre) VALUES (?, ?, ?)", args: [isim, email, hash] });
    const id = Number(result.lastInsertRowid);
    const token = jwt.sign({ id, isim, email }, JWT_SECRET, { expiresIn: "30d" });
    res.status(201).json({ token, kullanici: { id, isim, email } });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.post("/api/giris", async (req, res) => {
  try {
    const { email, sifre } = req.body;
    const kullanici = toRow(await db.execute({ sql: "SELECT * FROM kullanicilar WHERE email = ?", args: [email] }));
    if (!kullanici) return res.status(400).json({ hata: "Email veya şifre hatalı" });
    const dogru = await bcrypt.compare(sifre, kullanici.sifre);
    if (!dogru) return res.status(400).json({ hata: "Email veya şifre hatalı" });
    const token = jwt.sign({ id: kullanici.id, isim: kullanici.isim, email: kullanici.email }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, kullanici: { id: kullanici.id, isim: kullanici.isim, email: kullanici.email } });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.get("/api/beni-getir", authMiddleware, async (req, res) => {
  const kullanici = toRow(await db.execute({ sql: "SELECT id, isim, email FROM kullanicilar WHERE id = ?", args: [req.kullanici.id] }));
  res.json(kullanici);
});

// ==================== GELİRLER ====================
app.get("/api/gelirler", authMiddleware, async (req, res) => {
  try {
    res.json(toRows(await db.execute({ sql: "SELECT * FROM gelirler WHERE kullanici_id = ? ORDER BY tarih DESC", args: [req.kullanici.id] })));
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.post("/api/gelirler", authMiddleware, async (req, res) => {
  try {
    const { tarih, miktar, kategori, aciklama, tekrar_mi } = req.body;
    const result = await db.execute({ sql: "INSERT INTO gelirler (tarih, miktar, kategori, aciklama, tekrar_mi, kullanici_id) VALUES (?, ?, ?, ?, ?, ?)", args: [tarih, parseFloat(miktar), kategori || "Maaş", aciklama || "", tekrar_mi ? 1 : 0, req.kullanici.id] });
    res.status(201).json({ id: Number(result.lastInsertRowid) });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.delete("/api/gelirler/:id", authMiddleware, async (req, res) => {
  try {
    await db.execute({ sql: "DELETE FROM gelirler WHERE id = ? AND kullanici_id = ?", args: [req.params.id, req.kullanici.id] });
    res.json({ basarili: true });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.post("/api/gelirler/toplu-sil", authMiddleware, async (req, res) => {
  try {
    const ids = (req.body.ids || []).map(Number).filter(Number.isInteger);
    if (ids.length === 0) return res.status(400).json({ hata: "Silinecek kayıt seçilmedi" });
    const placeholders = ids.map(() => "?").join(",");
    await db.execute({ sql: `DELETE FROM gelirler WHERE id IN (${placeholders}) AND kullanici_id = ?`, args: [...ids, req.kullanici.id] });
    res.json({ basarili: true, silinen: ids.length });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

// ==================== HARCAMALAR ====================
app.get("/api/harcamalar", authMiddleware, async (req, res) => {
  try {
    res.json(toRows(await db.execute({ sql: "SELECT * FROM harcamalar WHERE kullanici_id = ? ORDER BY tarih DESC", args: [req.kullanici.id] })));
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.post("/api/harcamalar", authMiddleware, async (req, res) => {
  try {
    const { tarih, miktar, kategori, kart_id, aciklama } = req.body;
    const result = await db.execute({ sql: "INSERT INTO harcamalar (tarih, miktar, kategori, kart_id, aciklama, kullanici_id) VALUES (?, ?, ?, ?, ?, ?)", args: [tarih, parseFloat(miktar), kategori, kart_id || null, aciklama || "", req.kullanici.id] });
    res.status(201).json({ id: Number(result.lastInsertRowid) });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.delete("/api/harcamalar/:id", authMiddleware, async (req, res) => {
  try {
    await db.execute({ sql: "DELETE FROM harcamalar WHERE id = ? AND kullanici_id = ?", args: [req.params.id, req.kullanici.id] });
    res.json({ basarili: true });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.post("/api/harcamalar/toplu-sil", authMiddleware, async (req, res) => {
  try {
    const ids = (req.body.ids || []).map(Number).filter(Number.isInteger);
    if (ids.length === 0) return res.status(400).json({ hata: "Silinecek kayıt seçilmedi" });
    const placeholders = ids.map(() => "?").join(",");
    await db.execute({ sql: `DELETE FROM harcamalar WHERE id IN (${placeholders}) AND kullanici_id = ?`, args: [...ids, req.kullanici.id] });
    res.json({ basarili: true, silinen: ids.length });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

// ==================== KARTLAR ====================
app.get("/api/kartlar", authMiddleware, async (req, res) => {
  try {
    res.json(toRows(await db.execute({ sql: "SELECT * FROM kartlar WHERE kullanici_id = ? ORDER BY isim", args: [req.kullanici.id] })));
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.post("/api/kartlar", authMiddleware, async (req, res) => {
  try {
    const { isim, limit_miktar, son_odeme_gunu, banka, renk } = req.body;
    const result = await db.execute({ sql: "INSERT INTO kartlar (isim, limit_miktar, son_odeme_gunu, banka, renk, kullanici_id) VALUES (?, ?, ?, ?, ?, ?)", args: [isim, parseFloat(limit_miktar) || 0, parseInt(son_odeme_gunu) || null, banka || "", renk || "#6366f1", req.kullanici.id] });
    res.status(201).json({ id: Number(result.lastInsertRowid) });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.delete("/api/kartlar/:id", authMiddleware, async (req, res) => {
  try {
    await db.execute({ sql: "DELETE FROM kartlar WHERE id = ? AND kullanici_id = ?", args: [req.params.id, req.kullanici.id] });
    res.json({ basarili: true });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

// ==================== YATIRIMLAR ====================
app.get("/api/yatirimlar", authMiddleware, async (req, res) => {
  try {
    res.json(toRows(await db.execute({ sql: "SELECT * FROM yatirimlar WHERE kullanici_id = ? ORDER BY tarih DESC", args: [req.kullanici.id] })));
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.post("/api/yatirimlar", authMiddleware, async (req, res) => {
  try {
    const { tip, miktar, alis_fiyati, tarih, aciklama, yatirim_disi } = req.body;
    const result = await db.execute({ sql: "INSERT INTO yatirimlar (tip, miktar, alis_fiyati, tarih, aciklama, yatirim_disi, kullanici_id) VALUES (?, ?, ?, ?, ?, ?, ?)", args: [tip, parseFloat(miktar), parseFloat(alis_fiyati), tarih, aciklama || "", yatirim_disi ? 1 : 0, req.kullanici.id] });
    res.status(201).json({ id: Number(result.lastInsertRowid) });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.put("/api/yatirimlar/:id", authMiddleware, async (req, res) => {
  try {
    const { tip, miktar, alis_fiyati, tarih, aciklama, yatirim_disi } = req.body;
    await db.execute({ sql: "UPDATE yatirimlar SET tip=?, miktar=?, alis_fiyati=?, tarih=?, aciklama=?, yatirim_disi=? WHERE id=? AND kullanici_id=?", args: [tip, parseFloat(miktar), parseFloat(alis_fiyati), tarih, aciklama || "", yatirim_disi ? 1 : 0, req.params.id, req.kullanici.id] });
    res.json({ basarili: true });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.delete("/api/yatirimlar/:id", authMiddleware, async (req, res) => {
  try {
    await db.execute({ sql: "DELETE FROM yatirimlar WHERE id = ? AND kullanici_id = ?", args: [req.params.id, req.kullanici.id] });
    res.json({ basarili: true });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

// ==================== HEDEFLER ====================
app.get("/api/hedefler", authMiddleware, async (req, res) => {
  try {
    res.json(toRows(await db.execute({ sql: "SELECT * FROM hedefler WHERE kullanici_id = ? ORDER BY id DESC", args: [req.kullanici.id] })));
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.post("/api/hedefler", authMiddleware, async (req, res) => {
  try {
    const { isim, hedef_miktar, mevcut_miktar, bitis_tarihi } = req.body;
    const result = await db.execute({ sql: "INSERT INTO hedefler (isim, hedef_miktar, mevcut_miktar, bitis_tarihi, kullanici_id) VALUES (?, ?, ?, ?, ?)", args: [isim, parseFloat(hedef_miktar), parseFloat(mevcut_miktar) || 0, bitis_tarihi || null, req.kullanici.id] });
    res.status(201).json({ id: Number(result.lastInsertRowid) });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.delete("/api/hedefler/:id", authMiddleware, async (req, res) => {
  try {
    await db.execute({ sql: "DELETE FROM hedefler WHERE id = ? AND kullanici_id = ?", args: [req.params.id, req.kullanici.id] });
    res.json({ basarili: true });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

// ==================== KURALLAR ====================
app.get("/api/kurallar", authMiddleware, async (req, res) => {
  try {
    res.json(toRows(await db.execute({ sql: "SELECT * FROM kurallar WHERE kullanici_id = ? ORDER BY id", args: [req.kullanici.id] })));
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.put("/api/kurallar", authMiddleware, async (req, res) => {
  try {
    const { kurallar } = req.body;
    await db.batch(
      kurallar.map(k => ({ sql: "UPDATE kurallar SET yuzde = ? WHERE id = ? AND kullanici_id = ?", args: [k.yuzde, k.id, req.kullanici.id] })),
      "write"
    );
    res.json({ basarili: true });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.post("/api/kurallar/profil", authMiddleware, async (req, res) => {
  try {
    const { profilAdi } = req.body;
    const kategoriler = ["Kredi Kartı Ödemesi", "Altın Yatırımı", "Hisse Senedi", "Nakit", "Serbest"];
    await db.batch(
      kategoriler.map(k => ({ sql: "INSERT INTO kurallar (profil_adi, aktif, kategori, yuzde, kullanici_id) VALUES (?, ?, ?, ?, ?)", args: [profilAdi, 0, k, 0, req.kullanici.id] })),
      "write"
    );
    res.json(toRows(await db.execute({ sql: "SELECT * FROM kurallar WHERE profil_adi = ? AND kullanici_id = ?", args: [profilAdi, req.kullanici.id] })));
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.delete("/api/kurallar/profil/:profilAdi", authMiddleware, async (req, res) => {
  try {
    await db.execute({ sql: "DELETE FROM kurallar WHERE profil_adi = ? AND kullanici_id = ?", args: [req.params.profilAdi, req.kullanici.id] });
    res.json({ basarili: true });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

// ==================== DASHBOARD ====================
app.get("/api/dashboard", authMiddleware, async (req, res) => {
  try {
    const ay = req.query.ay || new Date().toISOString().slice(0, 7);
    const uid = req.kullanici.id;

    const gecenAyDate = new Date(ay + "-01");
    gecenAyDate.setMonth(gecenAyDate.getMonth() - 1);
    const gecenAyStr = gecenAyDate.toISOString().slice(0, 7);
    // İki ay önce — kart borcu (off-by-one) için bir önceki gösterilen dönem
    const ikiAyOnceDate = new Date(ay + "-01");
    ikiAyOnceDate.setMonth(ikiAyOnceDate.getMonth() - 2);
    const ikiAyOnceStr = ikiAyOnceDate.toISOString().slice(0, 7);

    const gelirR = await db.execute({ sql: "SELECT COALESCE(SUM(miktar), 0) as toplam FROM gelirler WHERE kullanici_id = ? AND strftime('%Y-%m', tarih) = ?", args: [uid, ay] });
    const yatirimR = await db.execute({ sql: "SELECT COALESCE(SUM(miktar * alis_fiyati), 0) as toplam FROM yatirimlar WHERE kullanici_id = ? AND strftime('%Y-%m', tarih) = ? AND (yatirim_disi = 0 OR yatirim_disi IS NULL)", args: [uid, ay] });
    const krediR = await db.execute({ sql: "SELECT COALESCE(SUM(toplam_tutar), 0) as toplam FROM ekstreler WHERE kullanici_id = ? AND donem_yilAy = ?", args: [uid, gecenAyStr] });
    // Manuel/nakit harcamalar (ekstreden gelmeyen) — seçilen aya göre. ekstre_id IS NULL şartı çift saymayı önler.
    const nakitR = await db.execute({ sql: "SELECT COALESCE(SUM(miktar), 0) as toplam FROM harcamalar WHERE kullanici_id = ? AND ekstre_id IS NULL AND strftime('%Y-%m', tarih) = ?", args: [uid, ay] });

    // Geçen ay karşılaştırması (MoM % değişim için önceki dönem değerleri)
    const oncekiGelirR = await db.execute({ sql: "SELECT COALESCE(SUM(miktar), 0) as toplam FROM gelirler WHERE kullanici_id = ? AND strftime('%Y-%m', tarih) = ?", args: [uid, gecenAyStr] });
    const oncekiKrediR = await db.execute({ sql: "SELECT COALESCE(SUM(toplam_tutar), 0) as toplam FROM ekstreler WHERE kullanici_id = ? AND donem_yilAy = ?", args: [uid, ikiAyOnceStr] });
    const oncekiNakitR = await db.execute({ sql: "SELECT COALESCE(SUM(miktar), 0) as toplam FROM harcamalar WHERE kullanici_id = ? AND ekstre_id IS NULL AND strftime('%Y-%m', tarih) = ?", args: [uid, gecenAyStr] });
    const oncekiYatirimR = await db.execute({ sql: "SELECT COALESCE(SUM(miktar * alis_fiyati), 0) as toplam FROM yatirimlar WHERE kullanici_id = ? AND strftime('%Y-%m', tarih) = ? AND (yatirim_disi = 0 OR yatirim_disi IS NULL)", args: [uid, gecenAyStr] });

    let kategorilerR = await db.execute({
      sql: `SELECT h.kategori, SUM(h.miktar) as toplam
            FROM harcamalar h
            JOIN ekstreler e ON h.ekstre_id = e.id
            WHERE h.kullanici_id = ? AND e.donem_yilAy = ?
            GROUP BY h.kategori ORDER BY toplam DESC`,
      args: [uid, gecenAyStr],
    });
    let kategoriler = toRows(kategorilerR);

    if (kategoriler.length === 0) {
      kategoriler = toRows(await db.execute({ sql: "SELECT kategori, SUM(miktar) as toplam FROM harcamalar WHERE kullanici_id = ? AND strftime('%Y-%m', tarih) = ? GROUP BY kategori ORDER BY toplam DESC", args: [uid, gecenAyStr] }));
    }

    const toplam_gelir = Number(gelirR.rows[0][0] ?? 0);
    const toplam_harcama = Number(krediR.rows[0][0] ?? 0);
    const toplam_yatirim = Number(yatirimR.rows[0][0] ?? 0);
    const nakit_harcama = Number(nakitR.rows[0][0] ?? 0);
    const kalan = toplam_gelir - toplam_harcama - nakit_harcama - toplam_yatirim;

    // Önceki dönem toplamları + kalan (MoM karşılaştırması için)
    const onceki_gelir = Number(oncekiGelirR.rows[0][0] ?? 0);
    const onceki_kredi_karti_borcu = Number(oncekiKrediR.rows[0][0] ?? 0);
    const onceki_nakit_harcama = Number(oncekiNakitR.rows[0][0] ?? 0);
    const onceki_yatirim = Number(oncekiYatirimR.rows[0][0] ?? 0);
    const onceki_kalan = onceki_gelir - onceki_kredi_karti_borcu - onceki_nakit_harcama - onceki_yatirim;

    let saglik_skoru = 100;
    if (toplam_gelir > 0) {
      const oran = toplam_harcama / toplam_gelir;
      if (oran > 0.9) saglik_skoru = 20;
      else if (oran > 0.7) saglik_skoru = 50;
      else if (oran > 0.5) saglik_skoru = 70;
      else saglik_skoru = 90;
    }
    res.json({
      toplam_gelir, toplam_harcama, nakit_harcama, kalan, saglik_skoru, kategoriler, ay,
      toplam_yatirim, kredi_karti_borcu: toplam_harcama, gecen_ay: gecenAyStr,
      onceki: {
        gelir: onceki_gelir,
        kredi_karti_borcu: onceki_kredi_karti_borcu,
        nakit_harcama: onceki_nakit_harcama,
        yatirim: onceki_yatirim,
        kalan: onceki_kalan,
      },
    });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

// ==================== DAGILIM ====================
app.post("/api/dagilim-hesapla", authMiddleware, async (req, res) => {
  try {
    const { gelir, profilAdi } = req.body;
    let kurallar;
    if (profilAdi) {
      kurallar = toRows(await db.execute({ sql: "SELECT * FROM kurallar WHERE profil_adi = ? AND kullanici_id = ?", args: [profilAdi, req.kullanici.id] }));
    } else {
      kurallar = toRows(await db.execute({ sql: "SELECT * FROM kurallar WHERE aktif = 1 AND kullanici_id = ?", args: [req.kullanici.id] }));
      if (kurallar.length === 0) {
        const ilkProfil = toRow(await db.execute({ sql: "SELECT profil_adi FROM kurallar WHERE kullanici_id = ? LIMIT 1", args: [req.kullanici.id] }));
        if (ilkProfil) {
          kurallar = toRows(await db.execute({ sql: "SELECT * FROM kurallar WHERE kullanici_id = ? AND profil_adi = ?", args: [req.kullanici.id, ilkProfil.profil_adi] }));
        }
      }
    }
    const dagilim = kurallar.map(k => ({ kategori: k.kategori, yuzde: k.yuzde, miktar: (gelir * k.yuzde) / 100 }));
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
    const sadeceTakip = 1;
    const harcamalar = analizSonucu.harcamalar || [];
    const toplamTutar = harcamalar.reduce((sum, h) => sum + (h.miktar || 0), 0);

    // Mükerrer engeli: aynı kullanıcı + dönem + kart için ekstre zaten varsa reddet
    if (donemYilAy) {
      const mevcut = toRow(await db.execute({
        sql: "SELECT id FROM ekstreler WHERE kullanici_id = ? AND donem_yilAy = ? AND ((kart_id IS NULL AND ? IS NULL) OR kart_id = ?)",
        args: [req.kullanici.id, donemYilAy, kartId, kartId],
      }));
      if (mevcut) {
        fs.unlinkSync(pdfPath);
        return res.status(409).json({ hata: "Bu döneme ait bu kart için ekstre zaten var. Önce silin ya da düzenleyin." });
      }
    }

    let ekstreId = null;
    if (harcamalar.length > 0) {
      const tx = await db.transaction("write");
      try {
        const ekstreResult = await tx.execute({
          sql: "INSERT INTO ekstreler (kart_id, donem_adi, donem_yilAy, harcama_sayisi, toplam_tutar, sadece_takip, kullanici_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
          args: [kartId, donemAdi, donemYilAy, harcamalar.length, toplamTutar, sadeceTakip, req.kullanici.id],
        });
        ekstreId = Number(ekstreResult.lastInsertRowid);
        for (const h of harcamalar) {
          await tx.execute({
            sql: "INSERT INTO harcamalar (tarih, miktar, kategori, kart_id, aciklama, ekstre_id, sadece_takip, kullanici_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            args: [h.tarih, h.miktar, h.kategori, kartId, h.aciklama, ekstreId, sadeceTakip, req.kullanici.id],
          });
        }
        await tx.commit();
      } catch (e) {
        await tx.rollback();
        throw e;
      }
    }

    fs.unlinkSync(pdfPath);
    res.json({ mesaj: `${harcamalar.length} harcama içe aktarıldı`, harcamalar, ekstre_id: ekstreId });
  } catch (err) {
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    res.status(500).json({ hata: "PDF analizi başarısız: " + err.message });
  }
});

app.get("/api/ekstreler", authMiddleware, async (req, res) => {
  try {
    res.json(toRows(await db.execute({
      sql: `SELECT e.*, k.isim as kart_isim, k.renk as kart_renk, k.banka as kart_banka
            FROM ekstreler e
            LEFT JOIN kartlar k ON e.kart_id = k.id
            WHERE e.kullanici_id = ?
            ORDER BY e.yukleme_tarihi DESC`,
      args: [req.kullanici.id],
    })));
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.get("/api/ekstreler/:id/harcamalar", authMiddleware, async (req, res) => {
  try {
    res.json(toRows(await db.execute({ sql: "SELECT * FROM harcamalar WHERE ekstre_id = ? AND kullanici_id = ? ORDER BY tarih ASC", args: [req.params.id, req.kullanici.id] })));
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.put("/api/ekstreler/:id", authMiddleware, async (req, res) => {
  try {
    const { donem_adi, toplam_tutar } = req.body;
    if (!donem_adi) return res.status(400).json({ hata: "Dönem adı gerekli" });
    const donemYilAy = donemToYilAy(donem_adi);
    await db.execute({
      sql: "UPDATE ekstreler SET donem_adi = ?, donem_yilAy = ?, toplam_tutar = ? WHERE id = ? AND kullanici_id = ?",
      args: [donem_adi, donemYilAy, parseFloat(toplam_tutar) || 0, req.params.id, req.kullanici.id],
    });
    res.json({ basarili: true });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

app.delete("/api/ekstreler/:id", authMiddleware, async (req, res) => {
  try {
    await db.batch([
      { sql: "DELETE FROM harcamalar WHERE ekstre_id = ? AND kullanici_id = ?", args: [req.params.id, req.kullanici.id] },
      { sql: "DELETE FROM ekstreler WHERE id = ? AND kullanici_id = ?", args: [req.params.id, req.kullanici.id] },
    ], "write");
    res.json({ basarili: true });
  } catch (err) { res.status(500).json({ hata: err.message }); }
});

// ==================== AI SOHBET ====================
app.post("/api/ai-sohbet", authMiddleware, async (req, res) => {
  try {
    const { soru, gecmis } = req.body;
    if (!soru) return res.status(400).json({ hata: "Soru boş olamaz" });
    const uid = req.kullanici.id;
    const gelirSonAylar = toRows(await db.execute({ sql: "SELECT strftime('%Y-%m', tarih) as ay, SUM(miktar) as toplam FROM gelirler WHERE kullanici_id = ? GROUP BY ay ORDER BY ay DESC LIMIT 6", args: [uid] }));
    const harcamaSonAylar = toRows(await db.execute({ sql: "SELECT strftime('%Y-%m', tarih) as ay, kategori, SUM(miktar) as toplam FROM harcamalar WHERE kullanici_id = ? GROUP BY ay, kategori ORDER BY ay DESC", args: [uid] }));
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
    const aiResult = await chat.sendMessage(soru);
    res.json({ cevap: aiResult.response.text() });
  } catch (err) {
    res.status(500).json({ hata: "AI yanıt üretemedi: " + err.message });
  }
});

// ==================== FİYATLAR ====================
app.get("/api/fiyatlar", authMiddleware, async (_req, res) => {
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
dbReady.then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Sunucu çalışıyor: http://localhost:${PORT}`);
  });
});
