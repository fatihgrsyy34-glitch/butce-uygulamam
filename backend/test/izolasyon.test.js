// Kullanici izolasyonu — bu projenin en kritik degismezi.
//
// kullanici_id kodda 51 yerde geciyor. Tek bir sorguda unutulmasi, bir
// kullanicinin digerinin para verisini gormesi demek. Testler A ve B diye
// iki kullanici kurup B'nin A'ya ait hicbir seye ulasamadigini dogruluyor.

const test = require("node:test");
const assert = require("node:assert");
const { sunucuyuBaslat, istek, kullaniciOlustur, temizle } = require("./yardimci");

let taban, dizin, A, B;

test.before(async () => {
  ({ taban, dizin } = await sunucuyuBaslat());
  A = await kullaniciOlustur(taban, "a@test.com");
  B = await kullaniciOlustur(taban, "b@test.com");
});

test.after(() => temizle(dizin));

test("B, A'nin gelirlerini goremez", async () => {
  const olustur = await istek(taban, "/api/gelirler", {
    method: "POST",
    token: A.token,
    body: { tarih: "2026-01-15", miktar: 5000, kategori: "Maaş", aciklama: "A'nin maasi" },
  });
  assert.ok(olustur.durum < 300, `gelir eklenemedi: ${JSON.stringify(olustur.veri)}`);

  const aListe = await istek(taban, "/api/gelirler", { token: A.token });
  assert.strictEqual(aListe.veri.length, 1, "A kendi gelirini gormeli");

  const bListe = await istek(taban, "/api/gelirler", { token: B.token });
  assert.strictEqual(bListe.veri.length, 0, "B, A'nin gelirini GORMEMELI");
});

test("B, A'nin gelirini silemez", async () => {
  const aListe = await istek(taban, "/api/gelirler", { token: A.token });
  const gelirId = aListe.veri[0].id;

  await istek(taban, `/api/gelirler/${gelirId}`, { method: "DELETE", token: B.token });

  const sonra = await istek(taban, "/api/gelirler", { token: A.token });
  assert.strictEqual(sonra.veri.length, 1, "B, A'nin gelirini silmis olmamali");
});

test("B, A'nin harcamalarini goremez", async () => {
  const olustur = await istek(taban, "/api/harcamalar", {
    method: "POST",
    token: A.token,
    body: { tarih: "2026-01-16", miktar: 250, kategori: "Market", aciklama: "A'nin harcamasi" },
  });
  assert.ok(olustur.durum < 300, `harcama eklenemedi: ${JSON.stringify(olustur.veri)}`);

  const bListe = await istek(taban, "/api/harcamalar", { token: B.token });
  assert.strictEqual(bListe.veri.length, 0, "B, A'nin harcamasini GORMEMELI");
});

test("B, kendi kaydini A'nin kartina baglayamaz", async () => {
  // server.js:111 - kart_id istemciden geliyor; sahiplik ayrica dogrulanmali.
  const kart = await istek(taban, "/api/kartlar", {
    method: "POST",
    token: A.token,
    body: { isim: "A'nin karti", limit_miktar: 10000, son_odeme_gunu: 5, banka: "X" },
  });
  assert.ok(kart.durum < 300, `kart eklenemedi: ${JSON.stringify(kart.veri)}`);

  const aKartlar = await istek(taban, "/api/kartlar", { token: A.token });
  const kartId = aKartlar.veri[0].id;

  const denemesi = await istek(taban, "/api/harcamalar", {
    method: "POST",
    token: B.token,
    body: { tarih: "2026-01-17", miktar: 99, kategori: "Market", kart_id: kartId },
  });
  assert.ok(
    denemesi.durum >= 400,
    `B, A'nin kartina kayit baglayabildi (durum ${denemesi.durum}) - sahiplik kontrolu delinmis`
  );
});

test("B, A'nin kartlarini goremez", async () => {
  const bKartlar = await istek(taban, "/api/kartlar", { token: B.token });
  assert.strictEqual(bKartlar.veri.length, 0, "B, A'nin kartini GORMEMELI");
});
