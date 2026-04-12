const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "butce.db");
const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
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
`);

// Mevcut tablolara kullanici_id kolonu ekle (yoksa)
const kolonEkle = (tablo) => {
  try {
    db.prepare(`ALTER TABLE ${tablo} ADD COLUMN kullanici_id INTEGER REFERENCES kullanicilar(id)`).run();
    console.log(`✅ ${tablo} tablosuna kullanici_id eklendi`);
  } catch (e) {
    // Kolon zaten varsa hata verir, normal
  }
};

kolonEkle("gelirler");
kolonEkle("kartlar");
kolonEkle("harcamalar");
kolonEkle("yatirimlar");
kolonEkle("hedefler");
kolonEkle("kurallar");

// Mevcut verileri varsayılan kullanıcıya bağla
const bcrypt = require("bcryptjs");

const mevcutKullanici = db.prepare("SELECT id FROM kullanicilar LIMIT 1").get();
if (!mevcutKullanici) {
  const hash = bcrypt.hashSync("adampro123", 10);
  const result = db.prepare("INSERT INTO kullanicilar (isim, email, sifre) VALUES (?, ?, ?)").run("Fatih", "fatih_52_gursoy@hotmail.com", hash);
  const uid = result.lastInsertRowid;
  db.prepare("UPDATE gelirler SET kullanici_id = ? WHERE kullanici_id IS NULL").run(uid);
  db.prepare("UPDATE kartlar SET kullanici_id = ? WHERE kullanici_id IS NULL").run(uid);
  db.prepare("UPDATE harcamalar SET kullanici_id = ? WHERE kullanici_id IS NULL").run(uid);
  db.prepare("UPDATE yatirimlar SET kullanici_id = ? WHERE kullanici_id IS NULL").run(uid);
  db.prepare("UPDATE hedefler SET kullanici_id = ? WHERE kullanici_id IS NULL").run(uid);
  db.prepare("UPDATE kurallar SET kullanici_id = ? WHERE kullanici_id IS NULL").run(uid);
  console.log("✅ Varsayılan kullanıcı oluşturuldu");
} else {
  // Mevcut kullanıcının giriş bilgilerini güncelle (veriler korunur)
  const yeniEmail = "fatih_52_gursoy@hotmail.com";
  const mevcutEmail = db.prepare("SELECT email FROM kullanicilar WHERE id = ?").get(mevcutKullanici.id);
  if (mevcutEmail && mevcutEmail.email !== yeniEmail) {
    const yeniHash = bcrypt.hashSync("adampro123", 10);
    db.prepare("UPDATE kullanicilar SET email = ?, sifre = ? WHERE id = ?").run(yeniEmail, yeniHash, mevcutKullanici.id);
    console.log("✅ Kullanıcı bilgileri güncellendi");
  }
  // Mevcut kullanıcıya bağlanmamış verileri bağla
  db.prepare("UPDATE gelirler SET kullanici_id = ? WHERE kullanici_id IS NULL").run(mevcutKullanici.id);
  db.prepare("UPDATE kartlar SET kullanici_id = ? WHERE kullanici_id IS NULL").run(mevcutKullanici.id);
  db.prepare("UPDATE harcamalar SET kullanici_id = ? WHERE kullanici_id IS NULL").run(mevcutKullanici.id);
  db.prepare("UPDATE yatirimlar SET kullanici_id = ? WHERE kullanici_id IS NULL").run(mevcutKullanici.id);
  db.prepare("UPDATE hedefler SET kullanici_id = ? WHERE kullanici_id IS NULL").run(mevcutKullanici.id);
  db.prepare("UPDATE kurallar SET kullanici_id = ? WHERE kullanici_id IS NULL").run(mevcutKullanici.id);
}

// Varsayılan kurallar
const kuralSayisi = db.prepare("SELECT COUNT(*) as sayi FROM kurallar").get();
if (kuralSayisi.sayi === 0) {
  const ilkKullanici = db.prepare("SELECT id FROM kullanicilar LIMIT 1").get();
  if (ilkKullanici) {
    const kuralEkle = db.prepare("INSERT INTO kurallar (profil_adi, aktif, kategori, yuzde, kullanici_id) VALUES (?, ?, ?, ?, ?)");
    kuralEkle.run("Varsayılan", 1, "Kredi Kartı Ödemesi", 40, ilkKullanici.id);
    kuralEkle.run("Varsayılan", 0, "Altın Yatırımı", 20, ilkKullanici.id);
    kuralEkle.run("Varsayılan", 0, "Hisse Senedi", 15, ilkKullanici.id);
    kuralEkle.run("Varsayılan", 0, "Nakit", 15, ilkKullanici.id);
    kuralEkle.run("Varsayılan", 0, "Serbest", 10, ilkKullanici.id);
  }
}

console.log("✅ Veritabanı hazır");

module.exports = { db };