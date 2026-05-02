// Lokal butce.db → Turso migrasyon scripti
// Kullanım: node migrate.js
// ÖNEMLI: npm install @libsql/client yaptıktan sonra çalıştır
// ÖNEMLI: server.js'i hiç başlatmadan ÖNCE çalıştır

require("dotenv").config();
const Database = require("better-sqlite3");
const { createClient } = require("@libsql/client");
const path = require("path");

const localDb = new Database(path.join(__dirname, "butce.db"), { readonly: true });
const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Sıra önemli: FK bağımlılıklarına göre
const TABLOLAR = [
  "kullanicilar",
  "kartlar",
  "gelirler",
  "yatirimlar",
  "hedefler",
  "kurallar",
  "ekstreler",
  "harcamalar",
];

async function schemaOlustur() {
  await turso.executeMultiple(`
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
      ekstre_id INTEGER,
      sadece_takip INTEGER DEFAULT 0,
      FOREIGN KEY (kart_id) REFERENCES kartlar(id) ON DELETE SET NULL,
      FOREIGN KEY (ekstre_id) REFERENCES ekstreler(id) ON DELETE SET NULL
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
      kullanici_id INTEGER REFERENCES kullanicilar(id),
      sadece_takip INTEGER DEFAULT 0,
      donem_yilAy TEXT
    );
  `);
  console.log("✅ Turso şeması hazır");
}

async function tursoBosMu() {
  const r = await turso.execute("SELECT COUNT(*) FROM kullanicilar");
  return Number(r.rows[0][0]) === 0;
}

async function migrate() {
  console.log("🚀 Migrasyon başlıyor...\n");

  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error("❌ .env dosyasında TURSO_DATABASE_URL veya TURSO_AUTH_TOKEN eksik!");
    process.exit(1);
  }

  await schemaOlustur();

  const bos = await tursoBosMu();
  if (!bos) {
    if (!process.argv.includes("--force")) {
      console.log("⚠️  Turso'da zaten veri var. Üzerine yazmak için: node migrate.js --force");
      process.exit(0);
    }
    console.log("⚠️  --force ile devam ediliyor, mevcut veriler üzerine yazılıyor...\n");
  }

  let toplamBasarili = 0;
  let toplamHata = 0;

  for (const tablo of TABLOLAR) {
    let satirlar;
    try {
      satirlar = localDb.prepare(`SELECT * FROM ${tablo}`).all();
    } catch (e) {
      console.log(`⏭️  ${tablo}: tablo bulunamadı, atlanıyor`);
      continue;
    }

    if (satirlar.length === 0) {
      console.log(`⏭️  ${tablo}: boş, atlanıyor`);
      continue;
    }

    console.log(`📦 ${tablo}: ${satirlar.length} kayıt aktarılıyor...`);
    let basarili = 0;

    for (const satir of satirlar) {
      const kolonlar = Object.keys(satir);
      const degerler = Object.values(satir);
      const placeholders = kolonlar.map(() => "?").join(", ");
      const sql = `INSERT OR REPLACE INTO ${tablo} (${kolonlar.join(", ")}) VALUES (${placeholders})`;

      try {
        await turso.execute({ sql, args: degerler });
        basarili++;
      } catch (e) {
        console.error(`  ❌ Satır hatası (${tablo}):`, e.message);
        console.error("     Veri:", JSON.stringify(satir));
        toplamHata++;
      }
    }

    toplamBasarili += basarili;
    console.log(`  ✅ ${basarili}/${satirlar.length} kayıt aktarıldı`);
  }

  console.log("\n" + "=".repeat(50));
  console.log(`🎉 Migrasyon tamamlandı!`);
  console.log(`   ✅ Başarılı: ${toplamBasarili} kayıt`);
  if (toplamHata > 0) console.log(`   ❌ Hatalı:   ${toplamHata} kayıt`);
  console.log("=".repeat(50));
  console.log("\nArtık server.js'i başlatabilir veya Render'a deploy edebilirsin.");
}

migrate().catch((err) => {
  console.error("❌ Migrasyon hatası:", err.message);
  process.exit(1);
});
