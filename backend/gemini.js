// Gemini çağrılarını dayanıklı hale getiren katman.
//
// Google'ın modelleri yoğunlukta 503 "This model is currently experiencing
// high demand" döndürüyor. Bu hata GEÇİCİ: birkaç saniye sonra aynı istek
// sorunsuz geçiyor. Tek denemede pes etmek, kullanıcıya düzeltemeyeceği bir
// hata göstermek demek — ekstre yüklerken en can sıkıcı hâli.
//
// Buradaki strateji:
//   1. Geçici hatada üssel artan sürelerle yeniden dene
//   2. Birincil model ısrarla yoğunsa yedek modele geç
//   3. Toplam süre bütçesini aşma (kullanıcı sonsuza kadar beklemesin)

// Yedek zinciri ortamdan değiştirilebilir; varsayılan makul bir ikili.
const MODELLER = (process.env.GEMINI_MODELLER || "gemini-2.5-flash,gemini-2.0-flash")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Hata yeniden denemeye değer mi?
 *
 * SDK hata nesnesi durum kodunu ayrı bir alanda vermiyor, mesajın içine
 * "[503 Service Unavailable]" biçiminde gömüyor — bu yüzden hem alanlara
 * hem metne bakıyoruz.
 */
function geciciMi(err) {
  const kod = err?.status ?? err?.code;
  if ([429, 500, 502, 503, 504].includes(Number(kod))) return true;

  const mesaj = String(err?.message || "");
  if (/\[(429|500|502|503|504)\s/.test(mesaj)) return true;

  // Ağ katmanı kopmaları da geçici sayılır
  return /high demand|overloaded|fetch failed|ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up/i
    .test(mesaj);
}

/**
 * Verilen işi model zinciri üzerinde, geçici hatalarda yeniden deneyerek
 * çalıştırır.
 *
 * @param {(modelAdi: string) => Promise<any>} calistir
 * @param {object} secenekler
 * @param {number} secenekler.modelBasinaDeneme  bir model için deneme sayısı
 * @param {number} secenekler.ilkBekleme         ilk bekleme (ms), sonra ikiye katlanır
 * @param {number} secenekler.sureButcesi        toplam üst sınır (ms)
 * @param {string[]} secenekler.modeller         model zinciri (test için)
 */
async function modelIleDene(calistir, secenekler = {}) {
  const {
    modelBasinaDeneme = 3,
    ilkBekleme = 1000,
    sureButcesi = 75000,
    modeller = MODELLER,
    uyari = () => {},
  } = secenekler;

  if (!modeller.length) {
    throw new Error("Gemini model listesi boş — GEMINI_MODELLER ayarını kontrol edin");
  }

  const baslangic = Date.now();
  let ilkHata = null;

  for (let m = 0; m < modeller.length; m++) {
    const model = modeller[m];

    for (let deneme = 0; deneme < modelBasinaDeneme; deneme++) {
      try {
        return await calistir(model);
      } catch (err) {
        if (!ilkHata) ilkHata = err;

        // Kalıcı hata (bozuk PDF, geçersiz istek, kota bitmiş...) yeniden
        // denemekle düzelmez. Birincil modelde geldiyse doğrudan yükselt;
        // yedekte geldiyse yedeğin kendi sorunu olabilir, ilk hatayı koru.
        if (!geciciMi(err)) {
          if (m === 0) throw err;
          throw ilkHata;
        }

        const sonDeneme = deneme === modelBasinaDeneme - 1;
        // Üssel artış + rastgele sapma: aynı anda gelen istekler üst üste binmesin
        const sure = Math.round(ilkBekleme * 2 ** deneme * (0.7 + Math.random() * 0.6));
        const butceDoldu = Date.now() - baslangic + sure > sureButcesi;

        if (sonDeneme || butceDoldu) {
          uyari(`Gemini ${model} yanıt vermedi (${deneme + 1} deneme): ${err.message}`);
          if (butceDoldu) throw ilkHata;   // süre bitti, yedek modele de vakit yok
          break;                            // bir sonraki modele geç
        }

        await bekle(sure);
      }
    }
  }

  throw ilkHata;
}

/** Kullanıcıya gösterilecek hata: geçiciyse ne yapması gerektiğini söyle. */
function kullaniciMesaji(err, isim = "İşlem") {
  return geciciMi(err)
    ? `Google'ın yapay zekâ servisi şu an yoğun. Birkaç dakika sonra tekrar deneyin.`
    : `${isim} başarısız: ${err.message}`;
}

/** Geçici hatalar için 503, diğerleri için 500. */
const durumKodu = (err) => (geciciMi(err) ? 503 : 500);

module.exports = { modelIleDene, geciciMi, kullaniciMesaji, durumKodu, MODELLER };
