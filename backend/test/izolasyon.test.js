// Kullanici izolasyonu — bu projenin en kritik degismezi.
//
// kullanici_id kodda 51 yerde geciyor. Tek bir sorguda unutulmasi, bir
// kullanicinin digerinin para verisini gormesi demek. Testler A ve B diye
// iki kullanici kurup B'nin A'ya ait hicbir seye ulasamadigini dogruluyor.
//
// Kapsam: gelirler, harcamalar, kartlar, yatirimlar, hedefler.
// Kapsam disi: kurallar (profil bazli) ve ekstreler (PDF yukleme gerektirir).

const test = require("node:test");
const assert = require("node:assert");
const { sunucuyuBaslat, istek, kullaniciOlustur, temizle } = require("./yardimci");

let taban, dizin, A, B;
const kimlik = {}; // before'da olusturulan kayitlarin id'leri

// Cevabin dizi oldugunu dogrulayip donduren yardimci: istek() JSON parse
// hatasini yuttugu icin veri null olabiliyor ve ham indeksleme kafa
// karistirici TypeError veriyor.
function dizi(cevap, ad) {
  assert.ok(
    Array.isArray(cevap.veri),
    `${ad}: dizi bekleniyordu, durum ${cevap.durum}, govde ${JSON.stringify(cevap.veri)}`
  );
  return cevap.veri;
}

async function ekle(yol, token, govde) {
  const c = await istek(taban, yol, { method: "POST", token, body: govde });
  assert.strictEqual(c.durum, 201, `${yol} eklenemedi: ${JSON.stringify(c.veri)}`);
  return c.veri.id;
}

test.before(async () => {
  ({ taban, dizin } = await sunucuyuBaslat());
  A = await kullaniciOlustur(taban, "a@test.com");
  B = await kullaniciOlustur(taban, "b@test.com");

  // Tum kayitlar burada olusur: testler birbirinin sirasina bagli olmasin,
  // --test-name-pattern ile tek test kosuldugunda da calissin.
  kimlik.gelir = await ekle("/api/gelirler", A.token, {
    tarih: "2026-01-15", miktar: 5000, kategori: "Maaş", aciklama: "A'nin maasi",
  });
  kimlik.kart = await ekle("/api/kartlar", A.token, {
    isim: "A'nin karti", limit_miktar: 10000, son_odeme_gunu: 5, banka: "X",
  });
  kimlik.harcama = await ekle("/api/harcamalar", A.token, {
    tarih: "2026-01-16", miktar: 250, kategori: "Market",
  });
  kimlik.yatirim = await ekle("/api/yatirimlar", A.token, {
    tip: "Altın", miktar: 10, alis_fiyati: 2500, tarih: "2026-01-10",
  });
  kimlik.hedef = await ekle("/api/hedefler", A.token, {
    isim: "Tatil", hedef_miktar: 20000, mevcut_miktar: 1000,
  });
});

// before basarisiz olursa dizin undefined kalir; korumasiz temizlik
// ERR_INVALID_ARG_TYPE atip asil baslatma hatasini gizler.
test.after(() => dizin && temizle(dizin));

for (const [ad, yol] of [
  ["gelirlerini", "/api/gelirler"],
  ["harcamalarini", "/api/harcamalar"],
  ["kartlarini", "/api/kartlar"],
  ["yatirimlarini", "/api/yatirimlar"],
  ["hedeflerini", "/api/hedefler"],
]) {
  test(`B, A'nin ${ad} goremez`, async () => {
    const aninki = dizi(await istek(taban, yol, { token: A.token }), `A ${yol}`);
    assert.strictEqual(aninki.length, 1, `A kendi kaydini gormeli (${yol})`);

    const bninki = dizi(await istek(taban, yol, { token: B.token }), `B ${yol}`);
    assert.strictEqual(bninki.length, 0, `B, A'nin kaydini GORMEMELI (${yol})`);
  });
}

test("B, A'nin gelirini silemez", async () => {
  await istek(taban, `/api/gelirler/${kimlik.gelir}`, { method: "DELETE", token: B.token });

  const sonra = dizi(await istek(taban, "/api/gelirler", { token: A.token }), "A gelirler");
  assert.strictEqual(sonra.length, 1, "B, A'nin gelirini silmis olmamali");
});

test("A kendi kartina kayit baglayabilir", async () => {
  // Negatif testin anlamli olmasi icin pozitif durumun calistigini da
  // gostermek sart: yoksa uc tamamen bozulsa bile negatif test yesil kalir.
  const c = await istek(taban, "/api/harcamalar", {
    method: "POST",
    token: A.token,
    body: { tarih: "2026-01-18", miktar: 75, kategori: "Market", kart_id: kimlik.kart },
  });
  assert.strictEqual(c.durum, 201, `A kendi kartini kullanabilmeli: ${JSON.stringify(c.veri)}`);
});

test("B, kendi kaydini A'nin kartina baglayamaz", async () => {
  // kart_id istemciden geliyor; kartKullaniciyaAitMi sahipligi dogruluyor.
  const c = await istek(taban, "/api/harcamalar", {
    method: "POST",
    token: B.token,
    body: { tarih: "2026-01-17", miktar: 99, kategori: "Market", kart_id: kimlik.kart },
  });
  assert.strictEqual(
    c.durum, 403,
    `B, A'nin kartina kayit baglayabildi (durum ${c.durum}) - sahiplik kontrolu delinmis`
  );
});
