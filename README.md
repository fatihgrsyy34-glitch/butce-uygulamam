# 💰 Bütçem - Modern Finans ve Bütçe Takip Uygulaması

Bu proje, kişisel finans yönetimini kolaylaştıran, gelir-gider takibini sağlayan ve **Yapay Zeka (AI)** destekli veri analizi sunan modern bir web uygulamasıdır. Güncel fintech (finansal teknoloji) trendlerine uygun, "Clean Light Theme" odaklı kurumsal bir arayüze sahiptir.

## ✨ Öne Çıkan Özellikler

- **🔒 Güvenli Kimlik Doğrulama:** JWT (JSON Web Token) ve paralo şifreleme (Bcrypt) yapısıyla güvenli kullanıcı girişi ve kayıt işlemleri. Her kullanıcı sadece kendi verisini görür.
- **📊 Modern Dashboard (Özet Ekranı):** Mevcut bakiyeyi, toplam kazancı, geçen ayın harcamalarını ve finansal "Sağlık Skoru"nu bir bakışta gösteren ana panel.
- **💸 Gelir ve Gider Yönetimi:** İşlemleri detaylı şekilde (kategori, tarih, kart seçimi vb.) ekleme, listeleme ve silme imkanı. Renk kodlamalı kategori yapısı (Örn: Market için 🛒, Yemek için 🍔).
- **📉 Grafiksel Analizler (Recharts):** Aylık bazlı harcama ve gelirleri kıyaslayan gelişmiş, etkileşimli sütun/pasta grafikleri.
- **🤖 AI Asistan (Google Gemini Destekli):** Sisteme PDF formatında ekstre yüklenebilmesi ve yapay zekanın bu ekstreyi okuyarak otomatik kategorize edilmiş harcamalara dönüştürmesi. Ayrıca chat ekranında kişisel bütçe tavsiyesi verebilmesi.
- **💡 Akıllı Para Dağılımı:** Belirli bir gelir miktarının, kullanıcının belirlediği "Kural Profillerine" (Örn: %50 İhtiyaç, %30 İstek, %20 Birikim) göre otomatik dağıtılması.

## 🛠️ Kullanılan Teknolojiler

**Frontend (Kullanıcı Arayüzü):**
- **React.js (Vite):** Hızlı ve modern arayüz geliştirme kütüphanesi.
- **Recharts:** Veri görselleştirme ve grafikler.
- **Vanilla CSS (Design System):** Tailwind vb. yerine, doğrudan css değişkenleri ile oluşturulmuş, yüksek performanslı ve ferah "Light Theme" özel tasarım sistemi. Glassmorphism ve dinamik Particle Background (sadece AI sekmesinde) mevcuttur.

**Backend (Sunucu):**
- **Node.js & Express.js:** Hızlı, asenkron ve esnek RESTful API altyapısı.
- **SQLite:** Kurulum gerektirmeyen, dosya tabanlı (file-based) ilişkisel veritabanı. Projenin tek bir tıkla her makinede çalışmasını sağlar (`database.db`).
- **Axios:** Frontend-Backend arası veri haberleşmesi.
- **Multer:** Ekstre (PDF) dosyası yükleme işlemleri.

**Yapay Zeka (AI):**
- **Google Generative AI (Gemini):** Metin tabanlı komutları anlama, finansal veriyi analiz edip JSON'a çevirme işlevleri.

## 🚀 Yerel Geliştirme Ortamı (Local Setup)

Projeyi kendi bilgisayarınızda (localhost) çalıştırmak için aşağıdaki adımları izleyin:

1. **Gereksinimler:** Bilgisayarınızda `Node.js` yüklü olmalıdır.
2. **Klonlama:** Proje klasörünü kendi ortamınıza indirin.
3. **Backend'i Başlatma:**
   ```bash
   cd backend
   npm install
   node server.js
   ```
4. **Frontend'i Başlatma (Farklı bir pencerede):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
5. Tarayıcınızda `http://localhost:5173` adresine giderek uygulamaya girebilirsiniz.

## 🌐 Canlıya Alma (Deployment)

Projenin internet ortamında herkesin erişebileceği (URL üzerinden girilebilen) şekilde çalışması için Frontend ve Backend yapısı modern barındırma sistemlerinde barındırılmaktadır:
- **Veritabanı ve API (Backend):** SQLite kullanıldığı için disk esnekliği ve 7/24 stabilite gereksinimi nedeniyle **Render.com** üzerinden (`Web Service` modülünde) yayınlanmaktadır. Ortam değişkenlerinden bağımsız ve güvenlidir.
- **Tasarım ve Arayüz (Frontend):** Vercel mimarisine (`Vercel.com`) doğrudan entegre edilmiştir. Kullanıcı Vercel URL'si üzerinden bağlandığında Vite ile pre-render edilmiş arayüz ile karşılaşır. 

*Not: Vercel üzerinde Frontend deploy edilirken `VITE_API_URL` environment (ortam) değişkenine, projenin canlı Render sunucusundaki Base URL'i atanmıştır. Bu sayede local vs prod (canlı) ortam yönlendirmeleri tam otomatik olarak gerçekleşmektedir.*

---
*Bu proje, modern web geliştirme süreçlerini (tasarım sistemi oluşturma, component yapısı) ve yapay zeka entegrasyonlarını (Google Gemini LLM) birlikte harmanlayan kapsamlı bir bitirme / startup vizyon projesidir.*
