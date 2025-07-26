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
- **Süre Belirleme**: 1, 3, 5, 10, 15, 30 dakika seçenekleri
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
- **Memory Cache**: Aktif board'lar için hızlı erişim
- **Cache Invalidation**: Otomatik cache temizleme
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
- **Railway**: Cloud deployment platformu
- **Memory Cache**: Performans optimizasyonu

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
DATABASE_URL=postgres://user:password@host:port/database
PORT=5000
BOARD_CREATE_KEY=your_secret_key_here
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
```

### Production Örneği (Railway)
```env
DATABASE_URL=postgres://user:password@host:port/database
PORT=5000
BOARD_CREATE_KEY=your_production_key
FRONTEND_URL=https://your-domain.railway.app
REACT_APP_API_URL=https://your-domain.railway.app
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
- `timerStarted` - Zamanlayıcı başladı
- `timerEnded` - Zamanlayıcı bitti
- `userLeft` - Kullanıcı ayrıldı
- `userRemoved` - Kullanıcı atıldı
- `error` - Hata mesajı

---

## 🚀 Deployment

### Railway (Önerilen)
1. Railway hesabı oluştur
2. GitHub repo'yu bağla
3. PostgreSQL servisi ekle
4. Environment variables'ları ayarla
5. Deploy et

### Docker ile
```bash
# Production build
docker build -t retro-board .

# Çalıştır
docker run -p 5000:5000 -e DATABASE_URL=your_db_url retro-board
```

### Manuel Deployment
1. Backend'i sunucuya yükle
2. PostgreSQL kur ve yapılandır
3. Environment variables'ları ayarla
4. Frontend'i build et ve serve et
5. Reverse proxy yapılandır (nginx)

---

## 🔍 Geliştirici Notları

### Cache Sistemi
- Board state cache süresi: 20 dakika
- Otomatik cache invalidation
- Memory-based cache sistemi

### Güvenlik
- Davet kodu doğrulama
- Admin yetki kontrolü
- SQL injection koruması
- CORS yapılandırması

### Performans
- Lazy loading
- Optimized queries
- Memory cache
- Connection pooling

### Kullanıcı Deneyimi
- Gerçek zamanlı güncellemeler
- Responsive tasarım
- Error handling
- Loading states
- Toast notifications

---

## 🐛 Bilinen Sorunlar ve Çözümler

### Nickname Çakışması
- **Sorun**: Aynı nickname ile katılım
- **Çözüm**: Otomatik hata mesajı ve localStorage temizleme

### Board Bulunamadı
- **Sorun**: Geçersiz board ID
- **Çözüm**: Otomatik yönlendirme ve hata mesajı

### Bağlantı Kopması
- **Sorun**: Socket bağlantısı kopması
- **Çözüm**: Otomatik yeniden bağlanma

---

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

---

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

---

## 📞 İletişim

Sorularınız için issue açabilir veya pull request gönderebilirsiniz.
 
