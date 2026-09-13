// Gemini dayaniklilik katmani: gecici hatada yeniden deneme, yedek modele
// gecis ve sure butcesi.
//
// Ag'a hic cikilmiyor: modelIleDene'ye sahte bir is fonksiyonu veriliyor,
// hatalar elle uretiliyor. Bu yuzden testler milisaniyeler suruyor.

const test = require("node:test");
const assert = require("node:assert");
const { modelIleDene, geciciMi } = require("../gemini");

// Google SDK durum kodunu ayri alanda vermiyor, mesaja gomuyor.
const gercekHata = () => new Error(
  "[GoogleGenerativeAI Error]: Error fetching from " +
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent: " +
  "[503 Service Unavailable] This model is currently experiencing high demand."
);

const HIZLI = { ilkBekleme: 1, modeller: ["birincil", "yedek"] };

test("kullanicinin gordugu 503 mesaji gecici sayilir", () => {
  assert.equal(geciciMi(gercekHata()), true);
});

test("429 ve ag kopmalari da gecici sayilir", () => {
  assert.equal(geciciMi(new Error("[429 Too Many Requests] quota")), true);
  assert.equal(geciciMi(new Error("fetch failed")), true);
  assert.equal(geciciMi(Object.assign(new Error("bos"), { status: 503 })), true);
});

test("bozuk istek gecici degil", () => {
  assert.equal(geciciMi(new Error("[400 Bad Request] invalid argument")), false);
  assert.equal(geciciMi(new Error("AI yanitindan JSON cikarilamadi")), false);
});

test("gecici hatadan sonra yeniden deneyip basarili olur", async () => {
  let cagri = 0;
  const sonuc = await modelIleDene(async () => {
    cagri++;
    if (cagri < 3) throw gercekHata();
    return "oldu";
  }, HIZLI);

  assert.equal(sonuc, "oldu");
  assert.equal(cagri, 3, "ilk iki deneme basarisiz, ucuncu tutmali");
});

test("birincil model israrla yogunsa yedek modele gecer", async () => {
  const denenen = [];
  const sonuc = await modelIleDene(async (model) => {
    denenen.push(model);
    if (model === "birincil") throw gercekHata();
    return `${model} cevapladi`;
  }, HIZLI);

  assert.equal(sonuc, "yedek cevapladi");
  assert.equal(denenen.filter((m) => m === "birincil").length, 3,
    "birincil model deneme hakki kadar denenmeli");
  assert.equal(denenen[denenen.length - 1], "yedek");
});

test("kalici hata yeniden denenmez, oldugu gibi yukselir", async () => {
  let cagri = 0;
  await assert.rejects(
    () => modelIleDene(async () => {
      cagri++;
      throw new Error("[400 Bad Request] bozuk PDF");
    }, HIZLI),
    /bozuk PDF/
  );
  assert.equal(cagri, 1, "kalici hatada tek deneme yapilmali");
});

test("tum modeller tukenirse kullaniciya ilk hata doner", async () => {
  await assert.rejects(
    () => modelIleDene(async () => { throw gercekHata(); }, HIZLI),
    /503 Service Unavailable/
  );
});

test("sure butcesi asilirsa beklemeden vazgecer", async () => {
  const basladi = Date.now();
  await assert.rejects(
    () => modelIleDene(async () => { throw gercekHata(); },
      { ilkBekleme: 5000, sureButcesi: 50, modeller: ["birincil", "yedek"] }),
    /503/
  );
  assert.ok(Date.now() - basladi < 1000,
    "butce dolunca uzun beklemeye girmemeli");
});
