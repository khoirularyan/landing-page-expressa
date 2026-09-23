// artikel-detail.js — Single article page untuk /artikel-detail.html
(function () {
  'use strict';

  // ──────────────────────────────────────────
  // DOM refs
  // ──────────────────────────────────────────
  const loadingEl         = document.getElementById('article-loading');
  const contentEl         = document.getElementById('article-content');
  const errorEl           = document.getElementById('article-error');
  const coverEl           = document.getElementById('article-cover');
  const coverWrapEl       = document.getElementById('article-cover-wrap') || (coverEl ? coverEl.parentElement : null);
  const categoryEl        = document.getElementById('article-category');
  const titleEl           = document.getElementById('article-title');
  const authorEl          = document.getElementById('article-author');
  const dateEl            = document.getElementById('article-date');
  const readTimeEl        = document.getElementById('article-read-time');
  const bodyEl            = document.getElementById('article-body');
  const tagsEl            = document.getElementById('article-tags');
  const breadcrumbTitleEl = document.getElementById('breadcrumb-title');
  const relatedEl         = document.getElementById('related-articles');
  const relatedGridEl     = document.getElementById('related-articles-grid') || document.getElementById('related-grid');

  // ──────────────────────────────────────────
  // Embedded Fallback Articles (Zero-Config offline & fallback)
  // ──────────────────────────────────────────
  const FALLBACK_ARTICLES = {
  "membangun-erp-kustom-untuk-efisiensi-bisnis-modern": {
    "id": "art-1790001000001",
    "slug": "membangun-erp-kustom-untuk-efisiensi-bisnis-modern",
    "title": "Membangun ERP Kustom untuk Efisiensi Bisnis Modern",
    "excerpt": "Bagaimana sistem ERP yang dirancang presisi mengikuti alur kerja internal dapat menekan biaya operasional hingga 40% dan mengeliminasi redudansi data bisnis.",
    "content": "<h2>Mengapa ERP Kustom Diperlukan di Era Digital?</h2><p>Banyak perusahaan terjebak dalam paket perangkat lunak siap pakai yang memaksa organisasi mengubah standar operasional mereka. Di Expressa, kami percaya bahwa <strong>teknologi yang harus beradaptasi dengan alur bisnis Anda</strong>, bukan sebaliknya.</p><blockquote>Efisiensi terbaik lahir dari sistem yang mempercepat interaksi manusia dan mengotomasi proses berulang secara presisi.</blockquote><h3>Tantangan Umum Sistem Kaku (Off-the-Shelf)</h3><ul><li><strong>Biaya Lisensi Membengkak:</strong> Biaya per-user yang terus naik seiring bertambahnya karyawan lapangan.</li><li><strong>Fitur Terlalu Kompleks atau Kurang:</strong> Banyak modul yang tidak terpakai namun memperlambat alur kerja.</li><li><strong>Kesulitan Integrasi:</strong> Sulit dihubungkan dengan mesin pabrik, IoT, atau aplikasi kasir lokal.</li></ul><h3>Solusi Kustom dari Expressa</h3><p>Dengan membangun sistem ERP yang dirancang khusus, setiap modul—mulai dari manajemen persediaan (inventory), pencatatan invoice otomatis, hingga hierarki persetujuan manajerial—dapat berjalan selaras dengan kebutuhan nyata tim di lapangan.</p><h3>Mengukur ROI dari Sistem Kustom</h3><p>Investasi awal dalam ERP kustom memang terlihat lebih besar dibanding solusi siap pakai. Namun, dalam jangka panjang, penghematan dari eliminasi lisensi berulang, integrasi yang seamless, dan produktivitas yang meningkat akan memberikan return on investment yang signifikan.</p><h3>Proses Implementasi di Expressa</h3><p>Kami memulai dengan fase discovery mendalam: wawancara dengan stakeholder, observasi proses bisnis aktual, dan identifikasi pain points. Setelah itu, kami merancang prototype interaktif yang dapat diuji langsung oleh tim internal Anda sebelum development penuh dimulai.</p>",
    "coverImage": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    "category": "Insight",
    "tags": [
      "ERP",
      "Digitalisasi",
      "Manajemen Bisnis",
      "Automasi"
    ],
    "author": "Tim Engineering Expressa",
    "status": "published",
    "publishedAt": "2026-09-20T08:00:00.000Z",
    "createdAt": "2026-09-20T08:00:00.000Z",
    "updatedAt": "2026-09-20T08:00:00.000Z"
  },
  "studi-kasus-automasi-multi-gudang-alat-kesehatan": {
    "id": "art-1790001000002",
    "slug": "studi-kasus-automasi-multi-gudang-alat-kesehatan",
    "title": "Studi Kasus: Automasi Multi-Gudang pada Distribusi Alat Kesehatan",
    "excerpt": "Kisah sukses implementasi sistem pelacakan stok real-time antar cabang yang memangkas waktu rekonsiliasi bulanan dari 5 hari menjadi hitungan menit.",
    "content": "<h2>Latar Belakang Proyek</h2><p>Klien kami yang bergerak di sektor distribusi alat kesehatan mengelola lebih dari 20 cabang dan gudang transit di berbagai provinsi. Permasalahan utama yang dihadapi adalah <em>stock discrepancy</em> (selisih stok fisik dan sistem) serta keterlambatan rekonsiliasi laporan bulanan.</p><h3>Langkah Implementasi Solusi</h3><ol><li><strong>Sistem Barcode & QR Code:</strong> Setiap perpindahan barang (inbound/outbound/transfer) wajib discan menggunakan aplikasi mobile handheld.</li><li><strong>Validasi Otoritas Bertingkat:</strong> Koreksi stok hanya dapat disetujui oleh Kepala Cabang dengan audit trail yang jelas.</li><li><strong>Dashboard Analisis Stok Kritis:</strong> Memberikan peringatan dini sebelum stok alat kesehatan penting menipis.</li></ol><blockquote>Hasilnya, akurasi stok meningkat hingga 99.4% dan waktu rekonsiliasi bulanan berkurang hingga 90%.</blockquote><h3>Teknologi yang Digunakan</h3><p>Sistem ini dibangun menggunakan stack modern: backend Node.js dengan PostgreSQL untuk database transaksional, Redis untuk caching real-time, dan aplikasi mobile native untuk Android menggunakan React Native. Semua komunikasi data dienkripsi end-to-end untuk menjaga keamanan informasi sensitif.</p><h3>Hasil dan Dampak Bisnis</h3><p>Setelah 6 bulan implementasi penuh, klien melaporkan penurunan kerugian akibat kehilangan barang hingga 75%, serta peningkatan kepuasan pelanggan karena akurasi pengiriman yang meningkat drastis. Tim gudang juga melaporkan bahwa pekerjaan mereka menjadi lebih mudah dan transparan.</p>",
    "coverImage": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
    "category": "Studi Kasus",
    "tags": [
      "Studi Kasus",
      "Gudang",
      "Supply Chain",
      "Distribusi"
    ],
    "author": "Danu - Lead Solutions Architect",
    "status": "published",
    "publishedAt": "2026-09-18T10:30:00.000Z",
    "createdAt": "2026-09-18T10:30:00.000Z",
    "updatedAt": "2026-09-18T10:30:00.000Z"
  },
  "mengapa-aplikasi-mobile-operasional-perlu-offline-first": {
    "id": "art-1790001000003",
    "slug": "mengapa-aplikasi-mobile-operasional-perlu-offline-first",
    "title": "Mengapa Aplikasi Mobile Operasional Perlu Pendekatan Offline-First?",
    "excerpt": "Menghadapi kendala sinyal di lapangan dengan arsitektur database sync agar tim operasional tetap dapat mencatat data tanpa hambatan.",
    "content": "<h2>Tantangan Lapangan: Koneksi Internet Tidak Selalu Stabil</h2><p>Saat tim operasional melakukan audit lapangan, pengecekan pipa pabrik, atau pengiriman barang ke daerah pelosok, sinyal seluler sering kali hilang atau tidak stabil. Aplikasi berbasis web biasa akan mengalami <em>network timeout</em> dan menyebabkan hilangnya data input.</p><h3>Keunggulan Arsitektur Offline-First</h3><p>Dengan menerapkan penyimpanan lokal terenkripsi di perangkat (SQLite / IndexedDB) dan mekanisme sinkronisasi cerdas dengan server pusat ketika koneksi kembali tersedia:</p><ul><li>Petugas dapat terus bekerja dan menyimpan data tanpa jeda.</li><li>Sistem otomatis menyelesaikan konflik data (conflict resolution).</li><li>Menghemat konsumsi baterai dan paket data perangkat lapangan.</li></ul><h3>Implementasi Teknis</h3><p>Kami menggunakan kombinasi teknologi modern seperti PouchDB atau WatermelonDB untuk sinkronisasi data lokal, dengan strategi conflict resolution berbasis timestamp dan user priority. Setiap transaksi dicatat dengan unique identifier yang memastikan tidak ada data yang hilang atau duplikat.</p><h3>Best Practices untuk Offline-First Apps</h3><p>Beberapa hal penting yang perlu diperhatikan: selalu tampilkan status koneksi kepada user, berikan feedback visual saat data sedang sync, dan pastikan ada mekanisme retry otomatis jika sinkronisasi gagal. User experience yang baik adalah kunci adopsi aplikasi mobile di lapangan.</p>",
    "coverImage": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80",
    "category": "Tutorial",
    "tags": [
      "Mobile App",
      "Offline First",
      "Arsitektur",
      "IoT"
    ],
    "author": "Khoirul - Mobile Developer",
    "status": "published",
    "publishedAt": "2026-09-15T14:15:00.000Z",
    "createdAt": "2026-09-15T14:15:00.000Z",
    "updatedAt": "2026-09-15T14:15:00.000Z"
  },
  "expressa-rilis-fitur-integrasi-whatsapp-gateway": {
    "id": "art-1790001000004",
    "slug": "expressa-rilis-fitur-integrasi-whatsapp-gateway",
    "title": "Expressa Rilis Fitur Integrasi Notifikasi WhatsApp Gateway Otomatis",
    "excerpt": "Pemberitahuan invoice jatuh tempo, status pesanan, dan verifikasi OTP kini terkirim otomatis ke WhatsApp pelanggan dengan integrasi API resmi.",
    "content": "<h2>Komunikasi Bisnis yang Lebih Cepat dan Personal</h2><p>Email notifikasi sering kali berakhir di folder spam atau terlambat dibaca oleh klien. Melalui integrasi modul <strong>WhatsApp Gateway API</strong> yang kini tersedia di seluruh solusi ERP Expressa, bisnis dapat mengirimkan notifikasi penting secara instan.</p><h3>Fitur Utama:</h3><ul><li>Notifikasi invoice & pengingat jatuh tempo otomatis.</li><li>Kirim resi pengiriman dan tracking link langsung ke nomor WhatsApp pelanggan.</li><li>Template pesan resmi yang dapat disesuaikan dari panel admin CMS.</li><li>Dukungan untuk media attachment (PDF invoice, gambar produk).</li><li>Two-way messaging untuk customer service interaktif.</li></ul><h3>Kepatuhan dan Keamanan</h3><p>Semua integrasi kami menggunakan WhatsApp Business API resmi yang fully compliant dengan regulasi privasi data. Kami juga menyediakan opt-in/opt-out mechanism yang sesuai dengan best practice komunikasi bisnis.</p><h3>Cara Kerja Integrasi</h3><p>Sistem kami terhubung langsung dengan WhatsApp Business API melalui webhook yang secure. Setiap event bisnis (seperti pembayaran diterima, pesanan dikirim, atau invoice jatuh tempo) akan men-trigger notifikasi otomatis dengan template yang sudah Anda kustomisasi sebelumnya.</p>",
    "coverImage": "https://images.unsplash.com/photo-1611746872915-64382b5c76da?auto=format&fit=crop&w=1200&q=80",
    "category": "Update",
    "tags": [
      "Update",
      "WhatsApp API",
      "Notifikasi",
      "Integrasi"
    ],
    "author": "Tim Expressa",
    "status": "published",
    "publishedAt": "2026-09-12T09:00:00.000Z",
    "createdAt": "2026-09-12T09:00:00.000Z",
    "updatedAt": "2026-09-12T09:00:00.000Z"
  },
  "memahami-microservices-vs-monolith-untuk-startup": {
    "id": "art-1790001000005",
    "slug": "memahami-microservices-vs-monolith-untuk-startup",
    "title": "Microservices vs Monolith: Pilihan Arsitektur untuk Startup yang Berkembang",
    "excerpt": "Panduan lengkap memilih arsitektur sistem yang tepat untuk bisnis Anda. Kapan saatnya beralih dari monolith ke microservices?",
    "content": "<h2>Dilema Arsitektur di Era Modern</h2><p>Setiap founder dan CTO pasti pernah menghadapi pertanyaan ini: apakah kami harus memulai dengan microservices sejak awal, atau membangun monolith dulu dan scale nanti? Tidak ada jawaban yang mutlak benar untuk semua kasus, namun ada guideline yang bisa membantu.</p><h3>Keunggulan Monolith</h3><ul><li><strong>Simplicity:</strong> Satu codebase, satu deployment, mudah di-debug dan di-trace.</li><li><strong>Development Speed:</strong> Tim kecil bisa bergerak cepat tanpa overhead koordinasi antar service.</li><li><strong>Cost Effective:</strong> Infrastruktur lebih sederhana, biaya hosting lebih rendah di tahap awal.</li></ul><h3>Kapan Microservices Masuk Akal?</h3><p>Microservices bukan silver bullet. Arsitektur ini baru memberikan value ketika:</p><ul><li>Tim engineering Anda sudah berkembang (>20 developers)</li><li>Ada bagian sistem yang butuh scale independent</li><li>Anda punya engineering culture yang mature dengan CI/CD dan monitoring yang solid</li></ul><blockquote>Premature optimization is the root of all evil. Mulailah dengan monolith yang well-structured, lalu extract microservices ketika bottleneck sudah jelas teridentifikasi.</blockquote><h3>Strategi Migrasi Bertahap</h3><p>Jika Anda memutuskan untuk migrasi dari monolith ke microservices, lakukan secara bertahap: identifikasi bounded context yang jelas, extract service yang paling critical atau paling sering bottleneck terlebih dahulu, dan pastikan observability Anda sudah kuat sebelum memecah sistem.</p><h3>Tools dan Teknologi</h3><p>Untuk microservices, pertimbangkan: Docker untuk containerization, Kubernetes untuk orchestration, message broker seperti RabbitMQ atau Kafka untuk async communication, dan distributed tracing tools seperti Jaeger atau Zipkin. Jangan lupa API Gateway untuk unified entry point.</p>",
    "coverImage": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
    "category": "Insight",
    "tags": [
      "Arsitektur",
      "Microservices",
      "Startup",
      "Engineering"
    ],
    "author": "Rizky - CTO Expressa",
    "status": "published",
    "publishedAt": "2026-09-10T07:00:00.000Z",
    "createdAt": "2026-09-10T07:00:00.000Z",
    "updatedAt": "2026-09-10T07:00:00.000Z"
  },
  "implementasi-real-time-dashboard-dengan-websocket": {
    "id": "art-1790001000006",
    "slug": "implementasi-real-time-dashboard-dengan-websocket",
    "title": "Implementasi Real-Time Dashboard dengan WebSocket dan Server-Sent Events",
    "excerpt": "Tutorial membangun dashboard monitoring yang update secara real-time tanpa polling, hemat bandwidth dan responsif.",
    "content": "<h2>Mengapa Real-Time Matters?</h2><p>Dalam aplikasi monitoring, supply chain, atau trading, data yang terlambat 5 detik bisa berarti kehilangan peluang atau terlambat mendeteksi masalah. Real-time dashboard memberikan visibilitas instan terhadap kondisi bisnis Anda.</p><h3>Pilihan Teknologi: WebSocket vs SSE</h3><p><strong>WebSocket</strong> cocok untuk komunikasi bi-directional (client dan server sama-sama bisa push data). <strong>Server-Sent Events (SSE)</strong> lebih sederhana untuk use case di mana hanya server yang push data ke client.</p><h3>Implementasi WebSocket dengan Node.js</h3><p>Kami menggunakan library Socket.io yang memberikan fallback otomatis dan reconnection handling:</p><pre><code>const io = require('socket.io')(server);\n\nio.on('connection', (socket) => {\n  console.log('Client connected');\n  \n  // Emit data setiap ada update\n  socket.emit('dashboard-update', data);\n  \n  socket.on('disconnect', () => {\n    console.log('Client disconnected');\n  });\n});</code></pre><h3>Best Practices untuk Performance</h3><ul><li>Gunakan Redis untuk pub/sub pattern jika Anda punya multiple server instances</li><li>Throttle update frequency (tidak perlu kirim data setiap milidetik jika human eye tidak bisa process)</li><li>Implement heartbeat mechanism untuk detect stale connections</li><li>Compress data payload dengan JSON.stringify optimization</li></ul><h3>Security Considerations</h3><p>Jangan lupa authentication pada WebSocket connection! Gunakan JWT token yang di-pass saat handshake, dan validate setiap message untuk prevent injection attacks. Implement rate limiting untuk avoid abuse.</p><h3>Monitoring dan Debugging</h3><p>Gunakan tools seperti Socket.io Admin UI untuk monitor active connections, atau build custom dashboard untuk track message latency dan connection health. Logging yang baik sangat penting untuk troubleshooting production issues.</p>",
    "coverImage": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    "category": "Tutorial",
    "tags": [
      "Real-Time",
      "WebSocket",
      "Dashboard",
      "Node.js"
    ],
    "author": "Andi - Backend Engineer",
    "status": "published",
    "publishedAt": "2026-09-08T13:00:00.000Z",
    "createdAt": "2026-09-08T13:00:00.000Z",
    "updatedAt": "2026-09-08T13:00:00.000Z"
  },
  "keamanan-api-dengan-oauth2-dan-jwt": {
    "id": "art-1790001000007",
    "slug": "keamanan-api-dengan-oauth2-dan-jwt",
    "title": "Keamanan API: Implementasi OAuth2 dan JWT untuk Autentikasi Modern",
    "excerpt": "Panduan praktis mengamankan REST API Anda dengan standar industri OAuth2 dan JSON Web Tokens.",
    "content": "<h2>Mengapa API Security Itu Krusial?</h2><p>API adalah gateway ke data dan logic bisnis Anda. Satu vulnerability bisa berarti data breach yang merugikan reputasi dan finansial perusahaan. Mari kita bahas best practice untuk securing modern APIs.</p><h3>OAuth2: The Industry Standard</h3><p>OAuth2 adalah protokol authorization yang memisahkan konsep authentication dari resource access. Ada beberapa flow yang bisa dipilih tergantung use case:</p><ul><li><strong>Authorization Code Flow:</strong> Untuk web applications dengan backend</li><li><strong>Implicit Flow:</strong> Untuk SPAs (deprecated, gunakan PKCE)</li><li><strong>Client Credentials:</strong> Untuk server-to-server communication</li><li><strong>Password Grant:</strong> Untuk first-party mobile apps</li></ul><h3>JWT: Stateless Authentication</h3><p>JSON Web Token memungkinkan stateless authentication. Server tidak perlu menyimpan session, semua informasi ada di token yang di-sign secara cryptographic.</p><pre><code>// Generate JWT\nconst token = jwt.sign(\n  { userId: user.id, role: user.role },\n  process.env.JWT_SECRET,\n  { expiresIn: '1h' }\n);\n\n// Verify JWT\nconst decoded = jwt.verify(token, process.env.JWT_SECRET);</code></pre><h3>Security Best Practices</h3><ul><li>Gunakan HTTPS untuk semua API endpoints</li><li>Implement rate limiting untuk prevent brute force</li><li>Validate dan sanitize semua input</li><li>Gunakan short-lived access tokens + long-lived refresh tokens</li><li>Store JWT secret di environment variables, never hardcode</li><li>Implement proper CORS policy</li></ul><h3>Token Refresh Strategy</h3><p>Access token sebaiknya berumur pendek (15-60 menit). Gunakan refresh token untuk mendapatkan access token baru tanpa user perlu login ulang. Refresh token disimpan secara secure (HttpOnly cookie di web, Keychain di iOS, KeyStore di Android).</p><h3>Monitoring dan Logging</h3><p>Track failed authentication attempts, log semua access ke sensitive endpoints, dan setup alerting untuk suspicious activities. Combine dengan tools seperti Elastic Stack atau Datadog untuk centralized logging.</p>",
    "coverImage": "https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=1200&q=80",
    "category": "Tutorial",
    "tags": [
      "Security",
      "API",
      "OAuth2",
      "JWT"
    ],
    "author": "Budi - Security Engineer",
    "status": "published",
    "publishedAt": "2026-09-05T09:30:00.000Z",
    "createdAt": "2026-09-05T09:30:00.000Z",
    "updatedAt": "2026-09-05T09:30:00.000Z"
  },
  "optimasi-query-database-untuk-aplikasi-skala-besar": {
    "id": "art-1790001000008",
    "slug": "optimasi-query-database-untuk-aplikasi-skala-besar",
    "title": "Optimasi Query Database untuk Aplikasi Skala Besar",
    "excerpt": "Teknik proven untuk mempercepat query database hingga 100x lipat dengan indexing, query optimization, dan caching strategy.",
    "content": "<h2>Ketika Database Menjadi Bottleneck</h2><p>Aplikasi Anda sudah grow, user bertambah, data membengkak, dan tiba-tiba response time melambat drastis. 90% kasus performance issue di production bersumber dari database query yang tidak optimal. Mari kita bedah solusinya.</p><h3>1. Indexing: Your First Line of Defense</h3><p>Index adalah struktur data yang mempercepat pencarian. Tanpa index, database harus scan seluruh table (table scan), yang sangat lambat untuk table besar.</p><pre><code>-- Buat index untuk kolom yang sering di-query\nCREATE INDEX idx_users_email ON users(email);\nCREATE INDEX idx_orders_user_date ON orders(user_id, created_at);</code></pre><p><strong>Tips:</strong> Index mempercepat read tapi memperlambat write. Jangan over-index.</p><h3>2. Query Optimization</h3><p>Gunakan EXPLAIN untuk analyze query execution plan. Cari tahu apakah query Anda menggunakan index atau melakukan full table scan.</p><ul><li>Hindari SELECT *, ambil kolom yang dibutuhkan saja</li><li>Gunakan WHERE clause yang selective</li><li>Hindari OR di WHERE clause jika bisa diganti dengan IN</li><li>Pertimbangkan denormalization untuk query yang complex</li></ul><h3>3. Caching Strategy</h3><p>Implementasi multi-layer caching:</p><ul><li><strong>Application Level:</strong> Cache hasil query di memory (Redis/Memcached)</li><li><strong>Database Level:</strong> Query result cache bawaan database</li><li><strong>CDN Level:</strong> Untuk static assets dan API responses</li></ul><h3>4. Connection Pooling</h3><p>Membuat database connection itu expensive. Gunakan connection pooling untuk reuse connections yang sudah ada.</p><pre><code>const pool = new Pool({\n  host: 'localhost',\n  database: 'mydb',\n  max: 20, // max connections\n  idleTimeoutMillis: 30000\n});</code></pre><h3>5. Read Replicas dan Sharding</h3><p>Untuk scale lebih jauh, pertimbangkan:</p><ul><li><strong>Read Replicas:</strong> Route read queries ke replica, write ke master</li><li><strong>Sharding:</strong> Partition data horizontally berdasarkan key (misalnya user_id)</li></ul><blockquote>Premature optimization is bad, but knowing when to optimize is crucial. Monitor query performance dari hari pertama.</blockquote>",
    "coverImage": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&q=80",
    "category": "Tutorial",
    "tags": [
      "Database",
      "Performance",
      "Optimization",
      "Backend"
    ],
    "author": "Siti - Database Specialist",
    "status": "published",
    "publishedAt": "2026-09-03T11:00:00.000Z",
    "createdAt": "2026-09-03T11:00:00.000Z",
    "updatedAt": "2026-09-03T11:00:00.000Z"
  },
  "studi-kasus-digitalisasi-umkm-warung-tradisional": {
    "id": "art-1790001000009",
    "slug": "studi-kasus-digitalisasi-umkm-warung-tradisional",
    "title": "Studi Kasus: Digitalisasi UMKM dari Warung Tradisional ke Omnichannel Modern",
    "excerpt": "Perjalanan transformasi digital warung kelontong menjadi bisnis omnichannel dengan sistem inventory terintegrasi dan penjualan online.",
    "content": "<h2>Klien: Warung Bu Ani</h2><p>Warung Bu Ani adalah toko kelontong di Surabaya yang sudah berdiri 15 tahun. Dengan kompetisi dari minimarket modern dan e-commerce, Bu Ani ingin bertransformasi digital namun tidak tahu harus mulai dari mana.</p><h3>Tantangan yang Dihadapi</h3><ul><li>Pencatatan stok masih manual di buku, sering salah hitung</li><li>Tidak ada sistem kasir digital, sulit tracking penjualan harian</li><li>Pelanggan mulai beralih ke minimarket yang lebih modern</li><li>Ingin berjualan online tapi takut ribet</li></ul><h3>Solusi yang Kami Bangun</h3><p>Kami merancang sistem yang sederhana namun powerful:</p><ol><li><strong>POS System:</strong> Aplikasi kasir di tablet dengan barcode scanner untuk pencatatan yang cepat dan akurat</li><li><strong>Inventory Management:</strong> Sistem stok otomatis yang update real-time, alert ketika barang hampir habis</li><li><strong>Online Store:</strong> Website sederhana untuk pemesanan online dengan WhatsApp integration</li><li><strong>Customer Loyalty:</strong> Program poin digital untuk retain pelanggan setia</li></ol><h3>Proses Implementasi</h3><p>Kami tidak langsung deploy semua fitur. Tahap 1 (bulan 1-2) fokus ke POS system untuk stabilkan operasional harian. Tahap 2 (bulan 3-4) baru implement inventory management. Tahap 3 (bulan 5-6) launch online store.</p><p>Yang penting: training intensif ke Bu Ani dan karyawan. Kami datang seminggu penuh untuk hands-on training sampai mereka comfortable menggunakan sistem.</p><h3>Hasil Setelah 1 Tahun</h3><ul><li>Pendapatan naik 60% (kombinasi efisiensi + online sales)</li><li>Stok accuracy 98% (sebelumnya sering salah hitung 10-15%)</li><li>Customer retention naik 40% berkat loyalty program</li><li>Bu Ani bisa monitor bisnis dari rumah via dashboard mobile</li></ul><blockquote>Teknologi itu bukan hanya untuk perusahaan besar. UMKM pun bisa mendapat manfaat besar jika implementasinya disesuaikan dengan kebutuhan dan kemampuan mereka.</blockquote><h3>Pelajaran yang Dipetik</h3><p>Kunci sukses digitalisasi UMKM: jangan overwhelm dengan fitur yang terlalu kompleks, fokus ke pain points utama, training yang intensif, dan support after-sales yang responsif. Teknologi adalah tools, bukan tujuan.</p>",
    "coverImage": "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1200&q=80",
    "category": "Studi Kasus",
    "tags": [
      "UMKM",
      "Digitalisasi",
      "Studi Kasus",
      "Retail"
    ],
    "author": "Dewi - Business Consultant",
    "status": "published",
    "publishedAt": "2026-09-01T08:00:00.000Z",
    "createdAt": "2026-09-01T08:00:00.000Z",
    "updatedAt": "2026-09-01T08:00:00.000Z"
  }
};

  // ──────────────────────────────────────────
  // Get slug from URL
  // ──────────────────────────────────────────
  function getSlug() {
    const params = new URLSearchParams(window.location.search);
    return params.get('slug') || '';
  }

  // ──────────────────────────────────────────
  // Fetch article
  // ──────────────────────────────────────────
  async function fetchArticle(slug) {
    try {
      const res = await fetch('/api/articles/' + encodeURIComponent(slug));
      if (res.ok) {
        const json = await res.json();
        if (json.data) return json.data;
      }
    } catch (e) {
      console.warn('[Article Detail] API fetch failed, trying fallback:', e.message);
    }
    return FALLBACK_ARTICLES[slug] || null;
  }

  // ──────────────────────────────────────────
  // Fetch related articles
  // ──────────────────────────────────────────
  async function fetchRelated(category, excludeSlug) {
    try {
      const res = await fetch('/api/articles?category=' + encodeURIComponent(category) + '&limit=4');
      if (res.ok) {
        const json = await res.json();
        const list = (json.data || []).filter(a => a.slug !== excludeSlug);
        if (list.length > 0) return list.slice(0, 3);
      }
    } catch (e) {}

    // Fallback related articles
    const all = Object.values(FALLBACK_ARTICLES);
    const sameCat = all.filter(a => (a.category || '').toLowerCase() === (category || '').toLowerCase() && a.slug !== excludeSlug);
    if (sameCat.length > 0) return sameCat.slice(0, 3);
    return all.filter(a => a.slug !== excludeSlug).slice(0, 3);
  }

  // ──────────────────────────────────────────
  // Render article
  // ──────────────────────────────────────────
  function renderArticle(article) {
    // Update page title
    document.title = `${article.title} | Expressa`;

    // Cover
    if (coverEl && article.coverImage) {
      coverEl.src = article.coverImage;
      coverEl.alt = article.title;
      coverEl.classList.remove('hidden');
      if (coverWrapEl) coverWrapEl.classList.remove('hidden');
    } else if (coverWrapEl && !article.coverImage) {
      coverWrapEl.classList.add('hidden');
    }

    // Breadcrumb
    if (breadcrumbTitleEl) breadcrumbTitleEl.textContent = article.title;

    // Category
    if (categoryEl) {
      categoryEl.textContent = article.category || 'Insight';
    }

    // Title
    if (titleEl) titleEl.textContent = article.title;

    // Author
    if (authorEl) authorEl.textContent = article.author || 'Tim Expressa';

    // Date
    if (dateEl) dateEl.textContent = formatDate(article.publishedAt || article.createdAt);

    // Read time (estimate: 200 words/min)
    if (readTimeEl) {
      const wordCount = (article.content || '').replace(/<[^>]+>/g, '').split(/\s+/).length;
      const mins = Math.max(1, Math.round(wordCount / 200));
      readTimeEl.textContent = `${mins} menit baca`;
    }

    // Body HTML
    if (bodyEl) bodyEl.innerHTML = article.content || '<p>Konten belum tersedia.</p>';

    // Tags
    if (tagsEl) {
      const tags = Array.isArray(article.tags) ? article.tags : (article.tags ? String(article.tags).split(',') : []);
      if (tags.length > 0) {
        tagsEl.innerHTML = tags.map(tag =>
          `<span class="inline-block bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-3 py-1 rounded-full">${escHtml(tag.trim())}</span>`
        ).join('');
        if (tagsEl.parentElement) tagsEl.parentElement.classList.remove('hidden');
      } else if (tagsEl.parentElement) {
        tagsEl.parentElement.classList.add('hidden');
      }
    }

    // Show content, hide loading
    if (loadingEl) loadingEl.classList.add('hidden');
    if (contentEl) contentEl.classList.remove('hidden');

    if (window.lucide) window.lucide.createIcons();
  }

  // ──────────────────────────────────────────
  // Render related articles
  // ──────────────────────────────────────────
  function renderRelated(articles) {
    if (!relatedGridEl || !articles || articles.length === 0) {
      if (relatedEl) relatedEl.classList.add('hidden');
      return;
    }

    relatedGridEl.innerHTML = articles.map(a => {
      const date = formatDate(a.publishedAt || a.createdAt);
      const coverSrc = a.coverImage || '';
      const coverImg = coverSrc
        ? `<img src="${escHtml(coverSrc)}" alt="${escHtml(a.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\'w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20\'><i data-lucide=\'file-text\' class=\'w-10 h-10 text-blue-300 dark:text-blue-600\'></i></div>'; if(window.lucide)window.lucide.createIcons();">`
        : `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"><i data-lucide="file-text" class="w-10 h-10 text-blue-300 dark:text-blue-600"></i></div>`;

      return `
      <article class="group bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
        <a href="/artikel-detail?slug=${escHtml(a.slug)}" class="block h-36 bg-slate-100 dark:bg-slate-700 overflow-hidden">
          ${coverImg}
        </a>
        <div class="p-4">
          <span class="inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2">${escHtml(a.category || 'Insight')}</span>
          <h4 class="text-sm font-bold text-slate-900 dark:text-white mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            <a href="/artikel-detail?slug=${escHtml(a.slug)}">${escHtml(a.title)}</a>
          </h4>
          <span class="text-xs text-slate-400">${date}</span>
        </div>
      </article>`;
    }).join('');

    if (relatedEl) relatedEl.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  // ──────────────────────────────────────────
  // Show error
  // ──────────────────────────────────────────
  function showError() {
    if (loadingEl) loadingEl.classList.add('hidden');
    if (errorEl) errorEl.classList.remove('hidden');
    if (relatedEl) relatedEl.classList.add('hidden');
  }

  // ──────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────
  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return ''; }
  }

  function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ──────────────────────────────────────────
  // Init
  // ──────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', async () => {
    const slug = getSlug();
    if (!slug) { showError(); return; }

    const article = await fetchArticle(slug);
    if (!article) { showError(); return; }

    renderArticle(article);

    // Load related articles async
    const related = await fetchRelated(article.category, article.slug);
    renderRelated(related);
  });
})();
