# CLAUDE.md

Bütçem — kişisel finans takip uygulaması. React (Vite) frontend + Express backend, veritabanı **Turso** (uzak), yapay zeka için Google Gemini.

## Yayın — uygulama zaten canlı

Üç katman da bulutta, hepsi bedava katmanda. Yerel geliştirme bunun *yanında* çalışır, önkoşulu değil.

| Katman | Adres | Nerede |
|---|---|---|
| Frontend | `https://butce-uygulamam.vercel.app` | Vercel, `main`'den otomatik deploy |
| Backend | `https://butce-uygulamam-1.onrender.com` | Render, bedava katman |
| Veritabanı | — | Turso (uzak) |

**`VITE_API_URL` repoda tanımlı değil, Vercel panelinde duruyor.** Bu yüzden `services/api.js:3`'e bakınca `localhost:3001` görünür ama yayındaki paket Render adresine gider. Backend'in nerede olduğunu anlamak için derlenmiş pakete bakmak gerekir — repoda izi yoktur.

**Render bedava katmanı 15 dk boşta kalırsa uyur, uyanması ~22 sn sürer.** `.github/workflows/keep-alive.yml` 10 dakikada bir `/api/health` ucunu çağırıp bunu engeller. O iş devre dışı kalırsa uygulama telefonda 20+ saniye açılmaz. Zamanlanmış GitHub işleri repo 60 gün hareketsiz kalırsa otomatik durur.

## Çalıştırma

İki ayrı terminal gerekir. `npm start` script'i **yok**, aramayın.

```bash
# 1. Backend  → http://localhost:3001
cd backend && npm install && node server.js

# 2. Frontend → http://localhost:5173
cd frontend && npm install && npm run dev
```

Frontend backend'e `http://localhost:3001/api` adresinden gider (`frontend/src/services/api.js`). Vite'ta proxy yok, mutlak URL kullanılıyor. Farklı bir backend adresi için `VITE_API_URL` ver.

## Veritabanı: Turso, yerel dosya değil

`backend/database.js` `@libsql/client` ile **uzak Turso** veritabanına bağlanır. Yerel `database.db` / `butce.db` dosyası yoktur ve gerekmez.

- `TURSO_DATABASE_URL` ve `TURSO_AUTH_TOKEN` olmadan backend hiç kalkmaz
- Şema `database.js` içinde `CREATE TABLE IF NOT EXISTS` ile açılışta kurulur — ayrı migration adımı yok
- `backend/migrate.js` tek seferlik bir taşıma script'idir (eski yerel `butce.db` → Turso). Normal geliştirmede **çalıştırmayın**
- `better-sqlite3` bağımlılıklarda duruyor ama yalnızca `migrate.js` kullanıyor; yeni kodda kullanma
- `better-sqlite3` yerel derleme araçları olmayan makinelerde (ör. WSL) `npm install` sırasında patlar. Backend'e paket eklemek için `npm install <paket> --ignore-scripts` kullan; Render'da tam kurulum sorunsuz geçiyor
- Backend'i gerçek veriye dokunmadan denemek için tek kullanımlık yerel veritabanı: `TURSO_DATABASE_URL="file:/tmp/test.db" TURSO_AUTH_TOKEN="" node server.js`

Sekiz tablo, hepsi Türkçe adlandırılmış: `kullanicilar`, `gelirler`, `harcamalar`, `kartlar`, `yatirimlar`, `hedefler`, `kurallar`, `ekstreler`. Alan adları da Türkçe (`miktar`, `tarih`, `kategori`, `kullanici_id`). Bu düzeni koru.

## Ortam değişkenleri

`backend/.env` gerekir (git tarafından yok sayılır, asla commit etme):

| Değişken | Olmadan ne olur |
|---|---|
| `TURSO_DATABASE_URL` | backend kalkmaz |
| `TURSO_AUTH_TOKEN` | backend kalkmaz |
| `GEMINI_API_KEY` | AI sohbet ve ekstre okuma çalışmaz |
| `JWT_SECRET` | her açılışta rastgele üretilir + uyarı loglanır; kimse token taklit edemez ama sunucu yeniden başladığında **herkes çıkış yapmış olur**. Kalıcı oturum için mutlaka ver |
| `KAYIT_KODU` | **kayıt tamamen kapalı** (`/api/kayit` 403 döner). Yeni hesap açılmasına izin vermek için bir davet kodu ver; kayıt formu bu kodu ister |
| `IZINLI_ORIGINLER` | yalnızca `*.vercel.app` (bu proje) ve `localhost` kabul edilir. Başka bir alan adı eklemek için virgülle ayır |
| `COLLECT_API_KEY` | döviz/kur uçları çalışmaz |
| `PORT` | 3001 kullanılır |

## Stil

Vanilla CSS design system — `frontend/src/index.css` ve `App.css`, CSS değişkenleriyle kurulmuş "Ink & Brass" teması.

`tailwindcss` ve `@tailwindcss/vite` kurulu ve `vite.config.js`'e bağlı, **ama hiç kullanılmıyor** (kodda tek `@tailwind` direktifi veya utility sınıfı yok). Yeni kodda Tailwind sınıfı kullanma, mevcut CSS değişkenlerini kullan.

### Mobil katman — tek kod tabanı, iki düzen

`frontend/src/styles/mobile.css` telefon/tablet düzenini taşır. **Kırılma noktası 860px.**

- **>860px:** masaüstü sidebar düzeni. `mobile.css` içindeki kuralların hepsi `@media (max-width: 860px)` içinde olduğu için masaüstü etkilenmez — bu bilinçli bir sınırdır, dışına kural yazma
- **≤860px:** sidebar tamamen gizlenir; `components/MobileNav.jsx` üst marka çubuğu + alt sekme çubuğu + "Daha fazla" alt sayfasını render eder
- Sidebar ve alt sekme çubuğu menü tanımlarını `utils/menu.jsx`'ten alır (`MENU_ITEMS`, `ICONS`). Sekme çubuğunda hangi sayfaların doğrudan görüneceğini `MOBIL_ANA_SEKMELER` belirler; listeye girmeyen sayfalar otomatik "Daha fazla" sayfasına düşer
- Z-index düzeni: perde 300, alt sayfa 310, **sekme çubuğu 320** (alt sayfa açıkken kapatma düğmesi erişilebilir kalmalı)

**Dikkat — dar ekranda taşan tek bir satır tüm gezinmeyi kilitler.** Tarayıcı ekrandan geniş içerik görünce düzen alanını genişletiyor (393px → 561px ölçüldü) ve `position: fixed` olan alt çubuk ekranın dışına kayıyor; hiçbir dokunma çalışmıyor. Bu yüzden `mobile.css` dar ekranda `.flex:not(.flex-col)` satırlarını sarmalıyor ve sabit `width` veren inline stillerden kaçınmak gerekiyor. Yeni sayfa eklerken 393px genişlikte taşma kontrolü yap.

Diğer mobil kısıtlar: `input` yazı boyutu ≥16px olmalı (küçükse iOS sayfayı zorla büyütür), dokunma hedefleri ≥44px, güvenli alan boşlukları `env(safe-area-inset-*)` ile (`index.html`'de `viewport-fit=cover` şart).

### PWA

`vite-plugin-pwa` ile kurulu; iPhone'da *Paylaş → Ana Ekrana Ekle* ile tam ekran, Safari arayüzü olmadan açılır. Manifest `vite.config.js` içinde, ikonlar `frontend/public/` altında (`pwa-*`, `apple-touch-icon`, `favicon.svg`).

**`/api/*` bilinçli olarak önbelleğe alınmıyor** (`navigateFallbackDenylist`): finans verisi her zaman canlı gelmeli ve kimliğe bağlı cevaplar diskte durmamalı. Yalnızca uygulama kabuğu ve fontlar precache ediliyor.

## Bloke eden komutlar — çalıştırma

`npm run dev`, `node server.js`, `npm run preview` gibi sunucular **hiç bitmez**. Bunları normal bir komut olarak çalıştırırsan oturum sonsuza kadar bekler ve hiçbir cevap üretemez.

- Sunucuyu ayağa kaldırman gerekiyorsa arka planda başlat, ya da hiç başlatma
- Değişikliği doğrulamak için sunucuya ihtiyaç varsa kullanıcıya söyle, o başlatsın
- `npm install`, `npm run build`, `npm run lint`, `git` komutları biter — bunlar sorunsuz

## Çalışma kuralları — kapsam ve haber verme

Bu oturumların çoğu Telegram üzerinden, onay istemi olmadan çalışır. Kullanıcı ne yaptığını anlık göremez, bu yüzden kapsam disiplini kritiktir.

- **Yalnızca isteneni yap.** Güvenlik sıkılaştırması, performans optimizasyonu, refactor, bağımlılık yükseltme, mimari değişiklik — bunları kendi başına başlatma. Gerekli görüyorsan **öner ve onay bekle.**
- **İstenenin dışına çıktıysan cevabında açıkça söyle.** "Şunu istedin, şunu yaptım; ayrıca şuna da dokunmam gerekti çünkü…" Sessizce fazladan iş yapma.
- **Her cevabın sonunda ne değiştirdiğini özetle** — dosya adları ve commit varsa hash'i ile. Kullanıcı ekranı görmüyor.
- Büyük veya geri alması zor bir şey (veri silme, şema değişikliği, deploy, `main`'e push, bağımlılık kaldırma) gerekiyorsa **yapma, sor.**
- Emin olmadığın bir varsayımla ilerleme; tek cümlelik soru sor.
- **Önemli değişikliklerden sonra `cd backend && npm test` çalıştır.** Her küçük düzeltmede gerekmez; şunlarda zorunlu: backend mantığı, kimlik doğrulama, yetki/sahiplik kontrolü, para hesabı, veritabanı şeması, yeni API ucu. Sonucu cevabında yaz (kaç test geçti). Yazım hatası, metin veya CSS değişikliğinde gerek yok.
- Aynı kapsamdaki değişikliklerde `/code-review`, güvenliği ilgilendiriyorsa `/security-review` çalıştır. İkisi de CLI'a gömülüdür, kurulum gerekmez.
- Kullanıcı "test yap" derse kastettiği budur: `cd backend && npm test`.
- **Çok dosyaya yayılan arama gerekiyorsa Task aracıyla devret** ve yalnızca sonucu bağlama al. Dosya dökümleri ana oturuma girerse oturum şişer; bu proje bir kez 5 MB'a çıkıp tek mesajı $3.62'ye çıkarmıştı.

Not: uygulamayı yalnızca sahibi kullanıyor. Yani "herkese açık servis" varsayımıyla kendi inisiyatifinle sertleştirme yapma — gerekiyorsa önce söyle.

### Bekleyen durum — önce bunu oku

`main` yerelde `origin/main`'den **11 commit ileride ve hiçbiri push edilmedi.** Canlı site hâlâ eski kodu çalıştırıyor (`origin/main` = `151c438`).

Push etmeden önce bilinmesi gerekenler:

- **`KAYIT_KODU` tanımlı değilse kayıt tamamen kapanır** (`server.js:124`, `/api/kayit` 403 döner). Render ortam değişkenlerinde tanımlanmadan push edilirse kimse hesap açamaz.
- CORS artık dar bir beyaz listeyle çalışıyor; canlı frontend adresi listede değilse uygulama backend'e ulaşamaz.
- `/api/health` ve keep-alive workflow'u da bu push edilmemiş commit'lerde. Bu yüzden canlı backend şu an `/api/health` için 404 dönüyor ve soğuk başlangıcı ~22 saniye sürüyor.

**Push kararını kullanıcı verir.** İstenirse ayrı bir branch'e push edilir (Vercel preview üretir), `main`'e değil.

## Git kuralları

- Remote: `github.com/fatihgrsyy34-glitch/butce-uygulamam`
- **`main`'e doğrudan push etmeyin.** `main` Vercel'in canlı deploy branch'i; push edilen her şey anında yayına çıkar
- İş için branch aç, oraya push et → Vercel preview deploy üretir → merge kararını kullanıcı verir
- **Her tamamlanan iş için commit at.** Commit geçmişi bu projenin değişiklik günlüğüdür; ayrı bir günlük dosyası tutulmuyor. Commit mesajı ne yapıldığını tek satırda açıklasın

## Yapı

```
backend/
  server.js      Express uygulaması, ~33 API ucu, JWT auth, Gemini entegrasyonu, multer ile PDF ekstre yükleme
  database.js    Turso bağlantısı + şema
  migrate.js     tek seferlik taşıma script'i (kullanma)
frontend/src/
  pages/         Dashboard, Gelirler, Harcamalar, Kartlar, KrediKartTakip,
                 Grafikler, Hedefler, Yatirimlar, Dagilim, AiSohbet,
                 EkstreYukle, Login
  services/api.js   tüm HTTP çağrıları burada toplanmış — yeni uç eklerken buraya ekle
  styles/mobile.css    ≤860px mobil düzen katmanı
  utils/categories.js  kategori tanımları ve renkleri
  utils/menu.jsx       menü öğeleri + ikonlar (sidebar ve mobil nav ortak kaynağı)
  components/MobileNav.jsx           mobil üst çubuk, alt sekmeler, "Daha fazla"
  components/ParticleBackground.jsx  (sadece AI sekmesinde)
.github/workflows/keep-alive.yml   Render'ı uyanık tutan 10 dakikalık ping
```

Kimlik doğrulama JWT + bcrypt. Her sorgu `kullanici_id` ile filtrelenir — yeni uç yazarken kullanıcı izolasyonunu **mutlaka** koru, aksi halde kullanıcılar birbirinin verisini görür.

## Notlar

- `README.md` uzun süre güncellenmedi; koda göre yeniden yazıldı. Yine de çelişki görürsen **koda güven**
- Backend'de testler var (aşağıdaki "Testler" bölümü). Frontend'de yok — arayüz değişikliğini uygulamayı çalıştırıp doğrula
- Lint: `cd frontend && npm run lint`

## Testler

`cd backend && npm test` — Node'un yerleşik test koşucusu (`node:test`), ek bağımlılık yok. 15 test, ~1 saniye.

- `test/yardimci.js` — her koşuda geçici bir `file:` libsql veritabanı ve boş porta bağlanan sunucu kurar. **Gerçek Turso'ya hiç dokunmaz.** `dotenv` mevcut `process.env` değerlerini ezmediği için buradaki ayarlar `.env`'in önünde gelir
- `test/kimlik.test.js` — kayıt kapısı (`KAYIT_KODU`), giriş, bozuk token, şifre sızıntısı
- `test/izolasyon.test.js` — iki kullanıcı kurup birinin diğerinin **gelir, harcama, kart, yatırım ve hedeflerine** erişemediğini doğrular; `kartKullaniciyaAitMi` sahiplik kontrolü de burada (hem reddedilen hem kabul edilen durum test edilir). `kurallar` ve `ekstreler` henüz kapsam dışı — o tablolarda `kullanici_id` düşerse test yakalamaz

`--test-force-exit` bayrağı şart: `server.js` yüklendiği anda dinlemeye başlıyor ve sunucuyu dışarı vermiyor, bayraksız süreç hiç kapanmıyor.

**Kayıt ucu saatte 5 istekle sınırlı** (`kayitLimiter`). Yeni test yazarken kullanıcıyı `test.before` içinde bir kez oluştur ve paylaş; her teste bir kayıt koyarsan sınır dolar ve testler yanıltıcı şekilde kırmızıya döner.

Frontend testi yok.
