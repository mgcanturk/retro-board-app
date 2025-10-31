# Retro Board App

Gerçek zamanlı, modern ve optimize edilmiş retrospektif board uygulaması. Takımınızla hızlıca board oluşturun, katılımcıları yönetin, yorum ekleyin, beğeni/dislike verin ve tüm süreci kolayca yönetin.

---

## 🚀 Özellikler

### 📋 Board Yönetimi
- **Board Oluşturma**: Özelleştirilebilir kolonlarla retro board oluşturma
- **Davet Sistemi**: Güvenli davet kodu ile katılımcı davet etme
- **Board Kilitleme**: Admin tarafından board'u kilitleme/açma
- **Board Sonlandırma**: Admin tarafından board'u sonlandırma
- **Board Dışa Aktarma**: Sonuçları .TXT formatında indirme

### 👥 Katılımcı Yönetimi
- **Admin Yetkileri**: Board oluşturan kişi otomatik admin olur
- **Katılımcı Listesi**: Gerçek zamanlı katılımcı listesi görüntüleme
- **Katılımcı Atma**: Admin tarafından katılımcıları board'dan atma
- **Nickname Değiştirme**: Katılımcıların nickname'lerini değiştirme
- **Çift Katılım Engelleme**: Aynı nickname ile aynı anda katılım engelleme

### 💬 Yorum Sistemi
- **Yorum Ekleme**: Kolonlara yorum ekleme
- **Admin Kolonları**: Sadece admin'in yorum ekleyebileceği özel kolonlar
- **Beğeni/Dislike**: Yorumlara beğeni ve dislike verme (geri alınabilir)
- **Yorum Silme**: Admin tarafından yorum silme
- **Yorum Sıralama**: Kronolojik, ters kronolojik ve yazara göre sıralama

### ⏱️ Zamanlayıcı
- **Süre Belirleme**: 1, 5, 10, 15, 30 dakika seçenekleri
- **Otomatik Kilitleme**: Süre bitiminde board otomatik kilitlenir
- **Süre Durdurma**: Admin tarafından süreyi durdurma
- **Gerçek Zamanlı Sayaç**: Tüm katılımcılar için senkronize sayaç

### 🎨 Kullanıcı Arayüzü
- **Dark Mode**: Karanlık/Aydınlık tema desteği
- **Responsive Tasarım**: Mobil ve masaüstü uyumlu
- **Gerçek Zamanlı Güncellemeler**: Socket.io ile anlık güncellemeler
- **Toast Bildirimleri**: Kullanıcı dostu bildirimler
- **Loading States**: Yükleme durumları

### 🔒 Güvenlik ve Performans
- **Davet Kodu Doğrulama**: Güvenli katılım sistemi
- **Board Oluşturma Anahtarı**: İsteğe bağlı güvenlik anahtarı
- **Otomatik Bağlantı Yönetimi**: WebSocket bağlantı kopması durumunda otomatik yeniden bağlanma
- **Veritabanı Temizleme**: Eski board'ların otomatik temizlenmesi

### 🔗 Paylaşım ve Erişim
- **Board Linki Kopyalama**: Tek tıkla board linkini kopyalama
- **Anonim Katılım**: Nickname ile anonim katılım
- **İsim Gizleme**: Admin tarafından katılımcı isimlerini gizleme
- **Katılımcı Sayısı**: Gerçek zamanlı katılımcı sayısı

---

## 🛠️ Kullanılan Teknolojiler

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **Sequelize ORM**: Veritabanı ORM
- **Socket.io**: Gerçek zamanlı iletişim
- **PostgreSQL**: Ana veritabanı
- **UUID**: Benzersiz ID'ler için

### Frontend
- **React 18**: UI framework
- **React Router**: Sayfa yönlendirme
- **TailwindCSS**: CSS framework
- **React Toastify**: Bildirim sistemi
- **Lucide React**: İkon kütüphanesi
- **Socket.io Client**: Gerçek zamanlı bağlantı

### DevOps & Deployment
- **Docker**: Konteynerizasyon
- **Docker Compose**: Çoklu servis yönetimi

---

## 📦 Kurulum ve Çalıştırma

### Gereksinimler
- Node.js 16+ 
- PostgreSQL 12+
- Docker (opsiyonel)

### 1. Geliştirme Ortamında

#### Backend Kurulumu
```bash
cd backend
npm install
npm run dev
```

#### Frontend Kurulumu
```bash
cd frontend
npm install
npm start
```

#### Veritabanı Kurulumu
PostgreSQL kurulu olmalı ve `backend/.env` dosyasında bağlantı bilgileri tanımlı olmalı.

### 2. Docker ile (Önerilen)

```bash
# Tüm servisleri başlat
docker-compose up --build

# Arka planda çalıştır
docker-compose up -d --build
```

**Erişim Adresleri:**
- Uygulama: `http://localhost:5000`
- PostgreSQL: `localhost:5432`

---

## ⚙️ Ortam Değişkenleri

### Backend (.env)
```env
DATABASE_URL=postgres://retro_user:retro_pass@db:5432/retro_board
PORT=5000
NODE_ENV=production
FRONTEND_URL=http://localhost:5000
BOARD_CREATE_KEY=your_secret_key_here
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
```

### Production Örneği

**Backend (.env):**
```env
DATABASE_URL=postgres://prod_user:secure_password@your-db-host:5432/retro_board
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-production-domain.com
BOARD_CREATE_KEY=your_secure_production_key
```

**Frontend (.env):**
```env
REACT_APP_API_URL=https://your-production-domain.com
```

---

## 🗄️ Veritabanı Yapısı

### Board Tablosu
- `id`: UUID (Primary Key)
- `name`: Board adı
- `description`: Board açıklaması
- `inviteCode`: Davet kodu
- `isLocked`: Kilit durumu
- `showNames`: İsim gösterme durumu
- `timer`: Zamanlayıcı bilgileri (JSONB)
- `commentSortOrder`: Yorum sıralama düzeni

### User Tablosu
- `id`: UUID (Primary Key)
- `nickname`: Kullanıcı adı
- `isAdmin`: Admin yetkisi
- `boardId`: Bağlı olduğu board
- `socketId`: Aktif socket bağlantısı

### Column Tablosu
- `id`: UUID (Primary Key)
- `name`: Kolon adı
- `adminOnly`: Sadece admin erişimi
- `order`: Sıralama
- `boardId`: Bağlı olduğu board

### Comment Tablosu
- `id`: UUID (Primary Key)
- `text`: Yorum metni
- `author`: Yazar nickname'i
- `columnId`: Bağlı olduğu kolon
- `boardId`: Bağlı olduğu board
- `likes`: Beğenen kullanıcılar (Array)
- `dislikes`: Dislike veren kullanıcılar (Array)

---

## 🔧 API Endpoints

### Board İşlemleri
- `POST /api/boards` - Yeni board oluştur
- `GET /api/boards/:boardId` - Board bilgilerini getir
- `GET /api/boards/:boardId/export` - Board'u dışa aktar
- `POST /api/boards/:boardId/cleanup-duplicates` - Duplicate kullanıcıları temizle (admin)

### Socket.io Events

#### Client → Server
- `joinBoard` - Board'a katıl
- `addComment` - Yorum ekle
- `likeComment` - Yorumu beğen
- `dislikeComment` - Yorumu dislike et
- `deleteComment` - Yorum sil (admin)
- `changeNickname` - Nickname değiştir
- `toggleLock` - Board kilitle/aç (admin)
- `toggleShowNames` - İsimleri göster/gizle (admin)
- `startTimer` - Zamanlayıcı başlat (admin)
- `stopTimer` - Zamanlayıcı durdur (admin)
- `changeCommentSortOrder` - Yorum sıralamasını değiştir (admin)
- `removeUser` - Kullanıcı at (admin)
- `endBoard` - Board'u sonlandır (admin)

#### Server → Client
- `boardState` - Board durumu güncelleme
- `commentAdded` - Yeni yorum eklendi
- `commentDeleted` - Yorum silindi
- `nicknameChanged` - Nickname değişti
- `boardLocked` - Board kilitlendi/açıldı
- `showNamesToggled` - İsimleri göster/gizle durumu değişti
- `commentSortOrderChanged` - Yorum sıralaması değişti
- `timerStarted` - Zamanlayıcı başladı (kilit otomatik açılır)
- `timerEnded` - Zamanlayıcı bitti (kilit otomatik kapanır)
- `timerStopped` - Zamanlayıcı durduruldu (kilit otomatik kapanır)
- `participantCountUpdated` - Katılımcı sayısı güncellendi
- `boardEnded` - Board sonlandırıldı
- `kickedFromBoard` - Kullanıcı board'dan atıldı
- `userLeft` - Kullanıcı ayrıldı
- `userRemoved` - Kullanıcı atıldı
- `error` - Hata mesajı

---

## 🚀 Deployment

### Docker Compose ile (Önerilen)

```bash
# 1. Projeyi klonla
git clone https://github.com/your-username/retro-board-app.git
cd retro-board-app

# 2. .env dosyalarını oluştur
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. .env dosyalarını düzenle (production değerleriyle)
nano backend/.env
nano frontend/.env

# 4. Docker Compose ile başlat
docker-compose up -d --build

# 5. Logları kontrol et
docker-compose logs -f
```

### Standalone Docker ile

```bash
# Production build
docker build -t retro-board .

# Çalıştır
docker run -p 5000:5000 \
  -e DATABASE_URL=your_db_url \
  -e BOARD_CREATE_KEY=your_secret_key \
  retro-board
```

### Manuel Deployment

1. **Backend Kurulumu:**
   ```bash
   cd backend
   npm install --production
   cp .env.example .env
   # .env dosyasını düzenle
   npm start
   ```

2. **Frontend Build:**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # .env dosyasını düzenle
   npm run build
   # build/ klasörünü backend/public/ klasörüne kopyala
   ```

3. **PostgreSQL Kurulumu:**
   - PostgreSQL 12+ yükle
   - Database ve kullanıcı oluştur
   - `DATABASE_URL` environment variable'ını ayarla

4. **Reverse Proxy (Nginx - Opsiyonel):**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Cloud Deployment (AWS, Azure, GCP, DigitalOcean)

1. **VPS/VM Oluştur**
2. **Docker ve Docker Compose yükle**
3. **Yukarıdaki Docker Compose adımlarını takip et**
4. **Domain ve SSL sertifikası yapılandır** (Let's Encrypt önerilir)

---

## 🔐 Production'da .env Dosyaları Yönetimi

### ⚠️ Önemli: .env Dosyaları GitHub'a Pushlanamazdır!

Güvenlik nedeniyle `.env` dosyaları `.gitignore`'da olmalıdır. Production deployment için:

### Yöntem 1: CI/CD Secrets (GitHub Actions)

1. **GitHub Secrets Tanımlama:**
   ```
   Repository → Settings → Secrets and variables → Actions → New secret
   ```

2. **Deployment Workflow:**
   ```yaml
   # .github/workflows/deploy.yml
   - name: Create .env files
     run: |
       echo "DATABASE_URL=${{ secrets.DATABASE_URL }}" >> backend/.env
       echo "JWT_SECRET=${{ secrets.JWT_SECRET }}" >> backend/.env
       echo "REACT_APP_API_URL=${{ secrets.REACT_APP_API_URL }}" >> frontend/.env
   ```

### Yöntem 2: Production Sunucuda Manuel Oluşturma

```bash
# Production sunucuya SSH bağlantısı
ssh user@production-server

# Proje dizinine git
cd /app/retro-board-app

# Backend .env oluştur
cp backend/.env.example backend/.env
nano backend/.env  # Gerçek değerleri gir

# Frontend .env oluştur
cp frontend/.env.example frontend/.env
nano frontend/.env  # Gerçek değerleri gir

# Docker Compose ile başlat
docker-compose up -d
```

### Yöntem 3: Docker Compose Environment Variables

```yaml
# docker-compose.prod.yml
services:
  retro-board-app:
    environment:
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      PORT: 5000
```

```bash
# .env dosyasını docker-compose ile kullan
export DATABASE_URL="postgresql://..."
export JWT_SECRET="your-secret"
docker-compose -f docker-compose.prod.yml up -d
```

### .env.example Dosyaları

Projeye `.env.example` dosyaları eklenmiştir. Deployment sırasında:

```bash
# Backend
cp backend/.env.example backend/.env
# Ardından gerçek değerleri düzenleyin

# Frontend
cp frontend/.env.example frontend/.env
# Ardından gerçek değerleri düzenleyin
```

---

## 🔍 Geliştirici Notları

### Veri Yönetimi
- Doğrudan veritabanından veri çekimi (cache yok)
- Gerçek zamanlı veri senkronizasyonu
- Otomatik duplicate kullanıcı temizleme

### Güvenlik
- Davet kodu doğrulama
- Admin yetki kontrolü
- SQL injection koruması
- CORS yapılandırması

### Performans
- Optimize edilmiş veritabanı sorguları
- WebSocket bağlantı yönetimi
- Otomatik bağlantı yeniden kurma

### Kullanıcı Deneyimi
- Gerçek zamanlı güncellemeler
- Responsive tasarım
- Error handling
- Loading states
- Toast notifications
 
