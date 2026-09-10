# 💰 Bütçem

Kişisel finans ve bütçe takip uygulaması. Gelir-gider takibi, kredi kartı yönetimi, birikim hedefleri, yatırım takibi ve Google Gemini destekli ekstre okuma / finansal sohbet.

React (Vite) arayüz + Express API, veritabanı olarak Turso.

**Canlı:** [butce-uygulamam.vercel.app](https://butce-uygulamam.vercel.app) · API: Render · Veritabanı: Turso

### Telefona kurmak (iOS)

Uygulama bir PWA — App Store gerekmez. iPhone'da Safari ile siteyi aç, **Paylaş → Ana Ekrana Ekle**. Sonrasında ana ekranda kendi ikonuyla, Safari arayüzü olmadan tam ekran açılır. Aynı hesap, aynı veri: telefonda girdiğin kayıt bilgisayarda da görünür.

## Özellikler

- **Kimlik doğrulama** — JWT + bcrypt. Her kullanıcı yalnızca kendi verisini görür; tüm sorgular `kullanici_id` ile filtrelenir.
- **Dashboard** — bakiye, toplam gelir, geçen ayın harcamaları ve finansal sağlık skoru tek ekranda.
- **Gelir / gider yönetimi** — kategori, tarih ve kart bazlı kayıt, listeleme, silme. Renk kodlu kategoriler (`frontend/src/utils/categories.js`).
- **Kredi kartı takibi** — kart limiti, son ödeme günü, banka ve kart bazlı harcama dağılımı.
- **Grafikler** — Recharts ile aylık gelir/gider karşılaştırmaları, kategori dağılımı.
- **Hedefler** — birikim hedefi tanımlama ve ilerleme takibi.
- **Yatırımlar** — yatırım kalemleri ve yatırım dışı ayrımı.
- **Akıllı para dağılımı** — gelirin, tanımlanan kural profillerine göre (örn. %50 ihtiyaç / %30 istek / %20 birikim) otomatik dağıtılması.
- **AI ekstre okuma** — PDF ekstre yüklenir, Gemini okuyup kategorize edilmiş harcamalara çevirir.
- **AI sohbet** — kişisel bütçe üzerine soru-cevap.
- **Mobil ve masaüstü tek arayüz** — 860px altında sidebar yerine alt sekme çubuğu devreye girer, 11 sayfanın tamamı telefondan erişilebilir. Masaüstü düzeni değişmez.

## Teknolojiler

**Frontend:** React 19, Vite 7, Recharts, Axios. Stil için vanilla CSS design system (CSS değişkenleriyle kurulmuş "Ink & Brass" teması) — utility framework kullanılmıyor.

**Backend:** Node.js, Express 5, JWT (`jsonwebtoken`), bcrypt (`bcryptjs`), Multer (PDF yükleme).

**Veritabanı:** [Turso](https://turso.tech) — `@libsql/client` ile uzak libSQL bağlantısı.

**AI:** Google Generative AI (Gemini).

## Kurulum

**Gereksinim:** Node.js. Ayrıca bir Turso veritabanı ve bir Gemini API anahtarı.

### 1. Ortam değişkenleri

`backend/.env` dosyası oluştur:

```env
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
GEMINI_API_KEY=...
JWT_SECRET=uzun-rastgele-bir-deger
COLLECT_API_KEY=...
# KAYIT_KODU=davet-kodu        # tanımlı değilse yeni kayıt kapalı
# IZINLI_ORIGINLER=https://ornek.com
# PORT=3001
```

`TURSO_DATABASE_URL` ve `TURSO_AUTH_TOKEN` zorunludur — onlar olmadan backend başlamaz.

`JWT_SECRET` verilmezse her açılışta rastgele üretilir: kimse token taklit edemez, ama sunucu yeniden başladığında tüm oturumlar düşer. Oturumların kalıcı olması için tanımla.

`KAYIT_KODU` tanımlı değilse `/api/kayit` kapalıdır ve kimse yeni hesap açamaz — uygulama internete açık olduğu için varsayılan bu. Kayıt almak istersen bir davet kodu ver; kayıt formu bu kodu ister.

`IZINLI_ORIGINLER` ile CORS beyaz listesine ek alan adı eklenir; bu proje için `*.vercel.app` ve `localhost` zaten kabul edilir.

`GEMINI_API_KEY` yoksa yalnızca AI özellikleri devre dışı kalır, `COLLECT_API_KEY` yoksa kur/döviz uçları çalışmaz.

> `better-sqlite3` yerel derleme araçları olmayan makinelerde `npm install` sırasında hata verir. Backend'e paket eklerken `npm install <paket> --ignore-scripts` kullan.

### 2. Backend

```bash
cd backend
npm install
node server.js
```

`http://localhost:3001` üzerinde çalışır. Veritabanı şeması ilk açılışta otomatik kurulur (`CREATE TABLE IF NOT EXISTS`), ayrı bir migration adımı gerekmez.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

`http://localhost:5173` üzerinde açılır ve API'ye `http://localhost:3001/api` adresinden gider. Backend farklı bir adreste çalışıyorsa `VITE_API_URL` ile belirt.

## Komutlar

| Komut | Dizin | Açıklama |
|---|---|---|
| `node server.js` | `backend` | API sunucusunu başlatır |
| `node migrate.js` | `backend` | Eski yerel `butce.db`'yi Turso'ya taşır — **tek seferlik**, normal geliştirmede kullanılmaz |
| `npm run dev` | `frontend` | Vite geliştirme sunucusu |
| `npm run build` | `frontend` | Üretim derlemesi (`dist/`) |
| `npm run preview` | `frontend` | Derlemeyi yerel olarak sunar |
| `npm run lint` | `frontend` | ESLint |

Projede otomatik test bulunmuyor; değişiklikler uygulamayı çalıştırarak doğrulanır.

## Proje yapısı

```
backend/
  server.js      Express uygulaması — ~33 API ucu, JWT auth, Gemini, PDF yükleme
  database.js    Turso bağlantısı ve şema tanımları
  migrate.js     tek seferlik taşıma script'i
frontend/src/
  pages/         Dashboard, Gelirler, Harcamalar, Kartlar, KrediKartTakip,
                 Grafikler, Hedefler, Yatirimlar, Dagilim, AiSohbet,
                 EkstreYukle, Login
  services/api.js       tüm HTTP çağrıları
  styles/mobile.css     ≤860px mobil düzen katmanı
  utils/categories.js   kategori tanımları ve renkleri
  utils/menu.jsx        menü öğeleri + ikonlar (sidebar ve mobil nav ortak)
  components/           MobileNav, ParticleBackground
  index.css, App.css    design system
.github/workflows/
  keep-alive.yml   Render'ı uyanık tutan 10 dakikalık /api/health pingi
```

### Veritabanı tabloları

`kullanicilar`, `gelirler`, `harcamalar`, `kartlar`, `yatirimlar`, `hedefler`, `kurallar`, `ekstreler` — tablo ve alan adları Türkçedir.

## Deploy

Frontend Vercel üzerinde yayınlanır ve `main` branch'ine bağlıdır: `main`'e giden her push canlıya çıkar. Geliştirme için ayrı branch açıp push etmek Vercel'de preview deploy üretir.

Backend Render'ın bedava katmanında çalışır. Bu katman 15 dakika boşta kalınca servisi uyutur ve uyanması ~22 saniye sürer; `.github/workflows/keep-alive.yml` 10 dakikada bir `/api/health` ucunu çağırarak bunu engeller. Ping başarısız olursa iş de başarısız olur, yani aynı zamanda bedava kesinti bildirimi sağlar.

Frontend'in hangi API adresine gittiği `VITE_API_URL` ile belirlenir ve **bu değer repoda değil, Vercel panelinde tanımlıdır**.

## Katkı

Ayrıntılı geliştirme kuralları ve mimari notlar için [`CLAUDE.md`](./CLAUDE.md) dosyasına bakın.
