# CLAUDE.md

Bütçem — kişisel finans takip uygulaması. React (Vite) frontend + Express backend, veritabanı **Turso** (uzak), yapay zeka için Google Gemini.

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

Sekiz tablo, hepsi Türkçe adlandırılmış: `kullanicilar`, `gelirler`, `harcamalar`, `kartlar`, `yatirimlar`, `hedefler`, `kurallar`, `ekstreler`. Alan adları da Türkçe (`miktar`, `tarih`, `kategori`, `kullanici_id`). Bu düzeni koru.

## Ortam değişkenleri

`backend/.env` gerekir (git tarafından yok sayılır, asla commit etme):

| Değişken | Olmadan ne olur |
|---|---|
| `TURSO_DATABASE_URL` | backend kalkmaz |
| `TURSO_AUTH_TOKEN` | backend kalkmaz |
| `GEMINI_API_KEY` | AI sohbet ve ekstre okuma çalışmaz |
| `JWT_SECRET` | sabit varsayılana düşer (`server.js:13`) — üretimde **mutlaka** ver |
| `COLLECT_API_KEY` | döviz/kur uçları çalışmaz |
| `PORT` | 3001 kullanılır |

## Stil

Vanilla CSS design system — `frontend/src/index.css` ve `App.css`, CSS değişkenleriyle kurulmuş "Ink & Brass" teması.

`tailwindcss` ve `@tailwindcss/vite` kurulu ve `vite.config.js`'e bağlı, **ama hiç kullanılmıyor** (kodda tek `@tailwind` direktifi veya utility sınıfı yok). Yeni kodda Tailwind sınıfı kullanma, mevcut CSS değişkenlerini kullan.

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
  utils/categories.js  kategori tanımları ve renkleri
  components/ParticleBackground.jsx  (sadece AI sekmesinde)
```

Kimlik doğrulama JWT + bcrypt. Her sorgu `kullanici_id` ile filtrelenir — yeni uç yazarken kullanıcı izolasyonunu **mutlaka** koru, aksi halde kullanıcılar birbirinin verisini görür.

## Notlar

- `README.md` uzun süre güncellenmedi; koda göre yeniden yazıldı. Yine de çelişki görürsen **koda güven**
- Bu projede test altyapısı yok (`backend` test script'i hata döndürür). Değişikliği uygulamayı çalıştırıp doğrula
- Lint: `cd frontend && npm run lint`
