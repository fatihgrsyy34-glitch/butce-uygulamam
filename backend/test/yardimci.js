// Testler icin tek kullanimlik sunucu.
//
// server.js yuklendigi anda dinlemeye basliyor ve app'i disari vermiyor;
// bu yuzden once ortam degiskenlerini kuruyoruz, sonra modulu yukleyip
// /api/health ucu cevap verene kadar bekliyoruz.
//
// Veritabani gecici bir dosya (file: libsql). Gercek Turso'ya HIC dokunulmaz.
// dotenv mevcut process.env degerlerini ezmedigi icin burada kurduklarimiz
// backend/.env'den gelebilecek her seyin onunde olur.

const fs = require("node:fs");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");

const KAYIT_KODU = "test-davet-kodu";

// Port'u yoklayip birakmak yaris yaratiyor: iki test dosyasi ayri
// sureclerde ayni anda basliyor ve server.js portu ancak dbReady'den
// sonra baglaniyor (sema kurulumu + bcrypt seed, yuzlerce ms). Bu arada
// diger surec ayni portu kapabiliyor ve kaybeden EADDRINUSE ile cokuyor.
// Cozum: yoklama soketini server.js baglanana kadar ACIK tut.
function portuRezerveEt() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.on("error", reject);
    s.listen(0, "127.0.0.1", () => resolve({ port: s.address().port, soket: s }));
  });
}

function soketiKapat(soket) {
  return new Promise((resolve) => soket.close(resolve));
}

async function hazirBekle(taban, denemeSayisi = 100) {
  for (let i = 0; i < denemeSayisi; i++) {
    try {
      const r = await fetch(`${taban}/api/health`);
      if (r.ok) return;
    } catch {
      // sunucu henuz dinlemiyor
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("Sunucu 10 saniyede ayaga kalkmadi");
}

async function sunucuyuBaslat() {
  const dizin = fs.mkdtempSync(path.join(os.tmpdir(), "butce-test-"));
  try {
    const dbDosya = path.join(dizin, "test.db");

    process.env.TURSO_DATABASE_URL = `file:${dbDosya}`;
    process.env.TURSO_AUTH_TOKEN = "";
    process.env.JWT_SECRET = "test-icin-sabit-secret";
    process.env.KAYIT_KODU = KAYIT_KODU;

    const { port, soket } = await portuRezerveEt();
    process.env.PORT = String(port);

    // Sema kurulumu burada biter; portu ancak ondan sonra birakiyoruz.
    const { dbReady } = require("../database");
    await dbReady;
    await soketiKapat(soket);

    require("../server.js");

    const taban = `http://127.0.0.1:${port}`;
    await hazirBekle(taban);
    return { taban, dbDosya, dizin };
  } catch (e) {
    // Kendi cop dizinimizi biz toplayalim; yoksa /tmp'de birikir ve
    // asil hata after-hook'taki temizlik hatasinin altinda kaybolur.
    temizle(dizin);
    throw e;
  }
}

async function istek(taban, yol, { method = "GET", token, body } = {}) {
  const baslik = { "Content-Type": "application/json" };
  if (token) baslik.Authorization = `Bearer ${token}`;
  const r = await fetch(taban + yol, {
    method,
    headers: baslik,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let veri = null;
  try {
    veri = await r.json();
  } catch {
    // govdesiz cevap
  }
  return { durum: r.status, veri };
}

// Kayit ucu saatte 5 istekle sinirli; testler bu butceyi asmamali.
async function kullaniciOlustur(taban, email, sifre = "Sifre1234") {
  const { durum, veri } = await istek(taban, "/api/kayit", {
    method: "POST",
    body: { isim: email.split("@")[0], email, sifre, kayitKodu: KAYIT_KODU },
  });
  if (durum !== 201) {
    throw new Error(`kullanici olusturulamadi (${durum}): ${JSON.stringify(veri)}`);
  }
  return { token: veri.token, id: veri.kullanici.id, email, sifre };
}

function temizle(dizin) {
  fs.rmSync(dizin, { recursive: true, force: true });
}

module.exports = { sunucuyuBaslat, istek, kullaniciOlustur, temizle, KAYIT_KODU };
