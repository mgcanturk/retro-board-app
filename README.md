# Retro Board App

Gerçek zamanlı, modern ve optimize edilmiş retrospektif board uygulaması. Takımınızla hızlıca board oluşturun, katılımcıları yönetin, yorum ekleyin, beğeni/dislike verin ve tüm süreci kolayca yönetin.

---

## Kullanılan Teknolojiler

- **Backend:** Node.js, Express.js, Sequelize ORM, Socket.io
- **Veritabanı:** PostgreSQL
- **Frontend:** React, React Router, TailwindCSS, React Toastify, Lucide React Icons
- **Gerçek Zamanlı İletişim:** Socket.io
- **Cache:** Aktif board state için memory cache (tam invalidation)
- **Docker:** Çok katmanlı build, production için optimize imaj, build-time ARG/ENV desteği

---

## Özellikler

- Gerçek zamanlı retro board oluşturma ve yönetme
- Katılımcı yönetimi, admin yetkileri
- Yorum ekleme, beğeni/dislike (geri alınabilir)
- Board kilitleme/açma, isimleri gizleme/gösterme (admin)
- Katılımcı listesi ve sayısı her zaman güncel (cache invalidation ile)
- Board state için memory cache (aktif boardlar için hızlı erişim, katılımcı ekleme/çıkarma dahil tam invalidation)
- Board'a aynı anda aynı nickname ile katılım engellenir
- Board bulunamadığında veya sonlandırıldığında localStorage temizlenir ve kullanıcı ana sayfaya yönlendirilir
- Tüm edge-case'ler ve kullanıcı deneyimi detayları kapsanmıştır
- Docker ile kolay kurulum ve dağıtım
- Railway, Render, Fly.io gibi platformlarda kolay deploy

---

## Ortam Değişkenleri (Environment Variables)

### Backend için
- `DATABASE_URL` : PostgreSQL bağlantı adresi
- `PORT` : Backend portu (genellikle 5000, Railway otomatik atar)
- `BOARD_CREATE_KEY` : (isteğe bağlı) Board oluşturma için anahtar
- `FRONTEND_URL` : CORS için izin verilen frontend domaini

### Frontend için
- `REACT_APP_API_URL` : Backend API base URL

#### Örnek `.env` (frontend/.env):
```
REACT_APP_API_URL=https://senin-railway-domainin.up.railway.app
```

#### Örnek Environment (Railway veya başka bir platformda):
```
DATABASE_URL=postgres://user:password@host:port/database
PORT=5000
BOARD_CREATE_KEY=senin_board_anahtarin
FRONTEND_URL=https://senin-railway-domainin.up.railway.app
REACT_APP_API_URL=https://senin-railway-domainin.up.railway.app
```

> **Not:** Railway'de hem backend hem frontend aynı ortamda çalışıyorsa, FRONTEND_URL ve REACT_APP_API_URL aynı olmalıdır. Dockerfile'da ARG ve ENV ile build-time ve runtime değişkenler doğru şekilde aktarılır.

---

## Kurulum ve Çalıştırma

### 1. Geliştirme Ortamında

#### Backend
```sh
cd backend
npm install
npm run dev
```

#### Frontend
```sh
cd frontend
npm install
npm start
```

#### Veritabanı
- PostgreSQL kurulu olmalı ve `backend/.env` dosyasında bağlantı bilgileri tanımlı olmalı.

### 2. Docker ile (Tümleşik)

Projeyi Docker ve docker-compose ile ayağa kaldırmak için:

```sh
docker-compose up --build
```

- Uygulama backend: `http://localhost:5000`
- Frontend build'i backend üzerinden servis edilir.
- PostgreSQL servisi otomatik başlatılır.

---

## Geliştirici Notları & Optimizasyonlar

- Board state cache süresi: 20 dakika (erişim olmazsa otomatik silinir)
- Board ve ilişkili veriler, belirli aralıklarla veritabanında temizlenir
- Kod ve imajlar minimum kaynak tüketecek şekilde optimize edilmiştir
- API ve frontend adresleri environment variable ile yönetilir, production ve local ortamda kolayca değiştirilebilir
- Katılımcı ekleme/çıkarma, disconnect, join gibi tüm işlemlerde cache invalidation uygulanır
- Railway deploylarında environment variable'lar Dockerfile'da hem build-time (ARG) hem runtime (ENV) olarak aktarılır
- Board'a aynı anda aynı nickname ile katılım engellenir, sayfa yenileme/yönlendirme gibi durumlarda tekrar giriş yapılabilir
- Board bulunamadığında veya sonlandırıldığında localStorage temizlenir ve kullanıcı ana sayfaya yönlendirilir
- Anasayfada tüm localStorage otomatik olarak temizlenir
- Like/dislike işlemleri geri alınabilir (tekrar tıklanabilir)
- Tüm edge-case'ler ve kullanıcı deneyimi detayları test edilmiştir

---
 
