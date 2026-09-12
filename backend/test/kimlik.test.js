// Kimlik dogrulama: kayit kapisi, giris ve token kontrolu.
//
// Not: /api/kayit saatte 5 istekle sinirli (kayitLimiter). Testler tek bir
// kullanici olusturup onu paylasir, yoksa sinir dolar ve testler yaniltici
// sekilde kirmizi olur.

const test = require("node:test");
const assert = require("node:assert");
const { sunucuyuBaslat, istek, kullaniciOlustur, temizle } = require("./yardimci");

let taban, dizin, ana;

test.before(async () => {
  ({ taban, dizin } = await sunucuyuBaslat());
  ana = await kullaniciOlustur(taban, "ana@test.com");
});

test.after(() => temizle(dizin));

test("dogru kodla kayit token ve id doner", () => {
  assert.ok(ana.token, "token donmeli");
  assert.ok(Number.isInteger(ana.id), "kullanici id sayi olmali");
});

test("KAYIT_KODU tanimsizken kayit tamamen kapali", async () => {
  const onceki = process.env.KAYIT_KODU;
  delete process.env.KAYIT_KODU;
  try {
    const { durum } = await istek(taban, "/api/kayit", {
      method: "POST",
      body: { isim: "A", email: "kapali@test.com", sifre: "Sifre1234" },
    });
    assert.strictEqual(durum, 403, "KAYIT_KODU yokken kayit 403 donmeli");
  } finally {
    process.env.KAYIT_KODU = onceki;
  }
});

test("yanlis kayit kodu reddedilir", async () => {
  const { durum } = await istek(taban, "/api/kayit", {
    method: "POST",
    body: { isim: "A", email: "yanlis@test.com", sifre: "Sifre1234", kayitKodu: "uydurma" },
  });
  assert.strictEqual(durum, 403);
});

test("giris: dogru sifre token verir, yanlis sifre vermez", async () => {
  const basarili = await istek(taban, "/api/giris", {
    method: "POST",
    body: { email: ana.email, sifre: ana.sifre },
  });
  assert.strictEqual(basarili.durum, 200);
  assert.ok(basarili.veri.token);

  const basarisiz = await istek(taban, "/api/giris", {
    method: "POST",
    body: { email: ana.email, sifre: "YanlisSifre" },
  });
  assert.strictEqual(basarisiz.durum, 400);
  assert.ok(!basarisiz.veri.token, "yanlis sifrede token sizmamali");
});

test("eksik alanla giris 500 degil 400 doner", async () => {
  const { durum } = await istek(taban, "/api/giris", { method: "POST", body: {} });
  assert.strictEqual(durum, 400);
});

test("tokensiz ve bozuk tokenla korunan uca erisilemez", async () => {
  const tokensiz = await istek(taban, "/api/gelirler");
  assert.strictEqual(tokensiz.durum, 401);

  const bozuk = await istek(taban, "/api/gelirler", { token: "bu.gecerli.degil" });
  assert.strictEqual(bozuk.durum, 401);
});

test("sifre hicbir cevapta sizmiyor", async () => {
  const { veri } = await istek(taban, "/api/beni-getir", { token: ana.token });
  assert.ok(veri && !("sifre" in veri), "beni-getir sifre alanini dondurmemeli");
});
