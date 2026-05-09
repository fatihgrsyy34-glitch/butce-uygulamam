require("dotenv").config();
const { createClient } = require("@libsql/client");
const bcrypt = require("bcryptjs");

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const initDb = async () => {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS kullanicilar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      isim TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      sifre TEXT NOT NULL,
      olusturma_tarihi TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS gelirler (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tarih TEXT NOT NULL,
      miktar REAL NOT NULL,
      kategori TEXT NOT NULL DEFAULT 'Maaş',
      aciklama TEXT,
      tekrar_mi INTEGER DEFAULT 0,
      kullanici_id INTEGER REFERENCES kullanicilar(id)
    );

    CREATE TABLE IF NOT EXISTS kartlar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      isim TEXT NOT NULL,
      limit_miktar REAL DEFAULT 0,
      son_odeme_gunu INTEGER,
      banka TEXT,
      renk TEXT DEFAULT '#6366f1',
      kullanici_id INTEGER REFERENCES kullanicilar(id)
    );

    CREATE TABLE IF NOT EXISTS harcamalar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tarih TEXT NOT NULL,
      miktar REAL NOT NULL,
      kategori TEXT NOT NULL,
      kart_id INTEGER,
      aciklama TEXT,
      kullanici_id INTEGER REFERENCES kullanicilar(id),
      FOREIGN KEY (kart_id) REFERENCES kartlar(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS yatirimlar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tip TEXT NOT NULL,
      miktar REAL NOT NULL,
      alis_fiyati REAL NOT NULL,
      tarih TEXT NOT NULL,
      aciklama TEXT,
      kullanici_id INTEGER REFERENCES kullanicilar(id)
    );

    CREATE TABLE IF NOT EXISTS hedefler (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      isim TEXT NOT NULL,
      hedef_miktar REAL NOT NULL,
      mevcut_miktar REAL DEFAULT 0,
      bitis_tarihi TEXT,
      kullanici_id INTEGER REFERENCES kullanicilar(id)
    );

    CREATE TABLE IF NOT EXISTS kurallar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profil_adi TEXT NOT NULL DEFAULT 'Varsayılan',
      aktif INTEGER DEFAULT 0,
      kategori TEXT NOT NULL,
      yuzde REAL NOT NULL,
      kullanici_id INTEGER REFERENCES kullanicilar(id)
    );

    CREATE TABLE IF NOT EXISTS ekstreler (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kart_id INTEGER REFERENCES kartlar(id) ON DELETE SET NULL,
      donem_adi TEXT NOT NULL,
      yukleme_tarihi TEXT DEFAULT (datetime('now')),
      harcama_sayisi INTEGER DEFAULT 0,
      toplam_tutar REAL DEFAULT 0,
      kullanici_id INTEGER REFERENCES kullanicilar(id)
    );
  `);

  const kolonEkle = async (tablo) => {
    try {
      await db.execute(`ALTER TABLE ${tablo} ADD COLUMN kullanici_id INTEGER REFERENCES kullanicilar(id)`);
    } catch (e) {}
  };
  for (const t of ["gelirler", "kartlar", "harcamalar", "yatirimlar", "hedefler", "kurallar"]) {
    await kolonEkle(t);
  }

  try { await db.execute("ALTER TABLE yatirimlar ADD COLUMN yatirim_disi INTEGER DEFAULT 0"); } catch (e) {}
  try { await db.execute("ALTER TABLE harcamalar ADD COLUMN ekstre_id INTEGER REFERENCES ekstreler(id) ON DELETE SET NULL"); } catch (e) {}
  try { await db.execute("ALTER TABLE harcamalar ADD COLUMN sadece_takip INTEGER DEFAULT 0"); } catch (e) {}
  try { await db.execute("ALTER TABLE ekstreler ADD COLUMN sadece_takip INTEGER DEFAULT 0"); } catch (e) {}
  try { await db.execute("ALTER TABLE ekstreler ADD COLUMN donem_yilAy TEXT"); } catch (e) {}

  const mevcutResult = await db.execute("SELECT id FROM kullanicilar LIMIT 1");
  if (mevcutResult.rows.length === 0) {
    const hash = bcrypt.hashSync("adampro123", 10);
    const result = await db.execute({
      sql: "INSERT INTO kullanicilar (isim, email, sifre) VALUES (?, ?, ?)",
      args: ["Fatih", "fatih_52_gursoy@hotmail.com", hash],
    });
    const uid = Number(result.lastInsertRowid);
    for (const tablo of ["gelirler", "kartlar", "harcamalar", "yatirimlar", "hedefler", "kurallar"]) {
      await db.execute({ sql: `UPDATE ${tablo} SET kullanici_id = ? WHERE kullanici_id IS NULL`, args: [uid] });
    }
    console.log("✅ Varsayılan kullanıcı oluşturuldu");
  } else {
    const uid = Number(mevcutResult.rows[0][0]);
    const yeniEmail = "fatih_52_gursoy@hotmail.com";
    const emailResult = await db.execute({ sql: "SELECT email FROM kullanicilar WHERE id = ?", args: [uid] });
    const mevcutEmail = emailResult.rows[0] ? emailResult.rows[0][0] : null;
    if (mevcutEmail && mevcutEmail !== yeniEmail) {
      try {
        const yeniHash = bcrypt.hashSync("adampro123", 10);
        await db.execute({ sql: "UPDATE kullanicilar SET email = ?, sifre = ? WHERE id = ?", args: [yeniEmail, yeniHash, uid] });
        console.log("✅ Kullanıcı bilgileri güncellendi");
      } catch (e) {
        console.log("⚠️ Varsayılan kullanıcı e-postası zaten kullanımda. Güncelleme atlandı.");
      }
    }
    for (const tablo of ["gelirler", "kartlar", "harcamalar", "yatirimlar", "hedefler", "kurallar"]) {
      await db.execute({ sql: `UPDATE ${tablo} SET kullanici_id = ? WHERE kullanici_id IS NULL`, args: [uid] });
    }
  }

  const kuralResult = await db.execute("SELECT COUNT(*) FROM kurallar");
  if (Number(kuralResult.rows[0][0]) === 0) {
    const ilkResult = await db.execute("SELECT id FROM kullanicilar LIMIT 1");
    if (ilkResult.rows.length > 0) {
      const ilkId = Number(ilkResult.rows[0][0]);
      await db.batch([
        { sql: "INSERT INTO kurallar (profil_adi, aktif, kategori, yuzde, kullanici_id) VALUES (?, ?, ?, ?, ?)", args: ["Varsayılan", 1, "Kredi Kartı Ödemesi", 40, ilkId] },
        { sql: "INSERT INTO kurallar (profil_adi, aktif, kategori, yuzde, kullanici_id) VALUES (?, ?, ?, ?, ?)", args: ["Varsayılan", 0, "Altın Yatırımı", 20, ilkId] },
        { sql: "INSERT INTO kurallar (profil_adi, aktif, kategori, yuzde, kullanici_id) VALUES (?, ?, ?, ?, ?)", args: ["Varsayılan", 0, "Hisse Senedi", 15, ilkId] },
        { sql: "INSERT INTO kurallar (profil_adi, aktif, kategori, yuzde, kullanici_id) VALUES (?, ?, ?, ?, ?)", args: ["Varsayılan", 0, "Nakit", 15, ilkId] },
        { sql: "INSERT INTO kurallar (profil_adi, aktif, kategori, yuzde, kullanici_id) VALUES (?, ?, ?, ?, ?)", args: ["Varsayılan", 0, "Serbest", 10, ilkId] },
      ], "write");
    }
  }

  console.log("✅ Veritabanı hazır");
};

const dbReady = initDb().catch((err) => {
  console.error("❌ Veritabanı başlatma hatası:", err);
  process.exit(1);
});

module.exports = { db, dbReady };
