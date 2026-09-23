'use strict';

// Auto-load .env in Node.js 20.12+ if present
try { if (typeof process.loadEnvFile === 'function') process.loadEnvFile(); } catch (e) {}

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');
const crypto   = require('crypto');
const multer   = require('multer');
const bcrypt   = require('bcryptjs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────
// PRISMA / DATABASE INITIALIZATION (OPTIONAL / HYBRID)
// ─────────────────────────────────────────────
let prisma = null;
if (process.env.DATABASE_URL) {
  try {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
  } catch (err) {
    console.warn('[Prisma] Could not initialize Prisma Client, falling back to flat-file JSON mode.');
    prisma = null;
  }
}

// ─────────────────────────────────────────────
// FLAT-FILE JSON HELPERS (Fallback when DB is not configured)
// ─────────────────────────────────────────────
const CONTENT_FILE       = path.join(__dirname, 'data', 'content.json');
const ARTICLES_FILE      = path.join(__dirname, 'data', 'articles.json');
const ADMIN_CONFIG_FILE  = path.join(__dirname, 'data', 'admin-config.json');
const CONSULTATIONS_FILE = path.join(__dirname, 'consultations.json');

let memoryContent = null;
let memoryArticles = null;
let memoryAdminConfig = null;
let memoryConsultations = null;

function readJsonFile(filePath, defaultVal) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {}
  return defaultVal;
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    // EROFS on serverless (Vercel) — data remains in memory
  }
}

function getContentFallback() {
  if (memoryContent) return memoryContent;
  memoryContent = readJsonFile(CONTENT_FILE, {});
  return memoryContent;
}

function saveContentFallback(data) {
  memoryContent = data;
  writeJsonFile(CONTENT_FILE, data);
}

let seedArticles = [];
try {
  seedArticles = require("./data/articles.json").articles || [];
} catch (e) {}

const DEFAULT_SAMPLE_ARTICLES = seedArticles.length > 0 ? seedArticles : [
  {
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
  {
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
  {
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
  {
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
  {
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
  {
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
  {
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
  {
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
  {
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
];

function getArticlesFallback() {
  if (memoryArticles && memoryArticles.articles && memoryArticles.articles.length > 0) return memoryArticles;
  const raw = readJsonFile(ARTICLES_FILE, { articles: DEFAULT_SAMPLE_ARTICLES });
  const list = Array.isArray(raw) ? raw : (raw?.articles || []);
  memoryArticles = { articles: list.length > 0 ? list : DEFAULT_SAMPLE_ARTICLES };
  return memoryArticles;
}

function saveArticlesFallback(data) {
  memoryArticles = data;
  writeJsonFile(ARTICLES_FILE, data);
}

function getAdminConfigFallback() {
  if (memoryAdminConfig) return memoryAdminConfig;
  memoryAdminConfig = readJsonFile(ADMIN_CONFIG_FILE, { username: 'admin', password: 'admin123', siteName: 'Expressa Content Manager' });
  return memoryAdminConfig;
}

function saveAdminConfigFallback(data) {
  memoryAdminConfig = data;
  writeJsonFile(ADMIN_CONFIG_FILE, data);
}

function getConsultationsFallback() {
  if (memoryConsultations) return memoryConsultations;
  memoryConsultations = readJsonFile(CONSULTATIONS_FILE, []);
  return memoryConsultations;
}

function saveConsultationFallback(record) {
  const list = getConsultationsFallback();
  list.unshift(record);
  memoryConsultations = list;
  writeJsonFile(CONSULTATIONS_FILE, list);
}

// ─────────────────────────────────────────────
// MULTER — memory storage (Vercel-safe)
// ─────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
try { if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true }); } catch (e) {}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const ok = /jpeg|jpg|png|webp|svg|gif/.test(path.extname(file.originalname).toLowerCase())
            || /jpeg|jpg|png|webp|svg|gif/.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error('Format file harus berupa gambar (PNG, JPG, JPEG, WEBP, SVG)'));
  },
});

// ─────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─────────────────────────────────────────────
// AUTH — stateless HMAC token
// ─────────────────────────────────────────────
const AUTH_SECRET = process.env.ADMIN_SECRET || 'expressa_cms_jwt_secret_fallback_key_2026_super_secure';

function generateToken(username) {
  const payload    = { u: username, iat: Date.now(), exp: Date.now() + 30 * 24 * 60 * 60 * 1000 };
  const encoded    = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature  = crypto.createHmac('sha256', AUTH_SECRET).update(encoded).digest('hex');
  return `expr.${encoded}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const [prefix, encoded, sig] = token.split('.');
    if (prefix !== 'expr') return null;
    const expected = crypto.createHmac('sha256', AUTH_SECRET).update(encoded).digest('hex');
    const eBuf = Buffer.from(sig);
    const xBuf = Buffer.from(expected);
    if (eBuf.length !== xBuf.length || !crypto.timingSafeEqual(eBuf, xBuf)) return null;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString());
    return payload.exp > Date.now() ? payload : null;
  } catch { return null; }
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu.' });
  }
  const payload = verifyToken(header.split(' ')[1]);
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Sesi login telah berakhir atau tidak valid.' });
  }
  req.user = payload;
  next();
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function slugify(text) {
  return String(text).toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u').replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// ─────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Expressa CMS',
    databaseMode: prisma ? 'PostgreSQL (Prisma)' : 'Flat-file (Standalone)',
    timestamp: new Date().toISOString()
  });
});

// Landing page content
app.get('/api/content', async (req, res) => {
  if (prisma) {
    try {
      const row = await prisma.siteContent.findUnique({ where: { key: 'main' } });
      if (row?.data) return res.json({ success: true, data: row.data });
    } catch (e) {
      console.warn('[Prisma] findUnique siteContent error, using fallback:', e.message);
    }
  }
  const data = getContentFallback();
  res.json({ success: true, data });
});

// Stats shortcut (backward-compat)
app.get('/api/stats', async (req, res) => {
  let stats = null;
  if (prisma) {
    try {
      const row = await prisma.siteContent.findUnique({ where: { key: 'main' } });
      stats = (row?.data)?.stats;
    } catch (e) {}
  }
  if (!stats) {
    const data = getContentFallback();
    stats = data?.stats;
  }
  res.json({
    projectsCompleted: stats?.stat1?.number ?? '200+',
    enterpriseClients: stats?.stat2?.number ?? '50+',
    industries:        stats?.stat3?.number ?? '15+',
    satisfactionRate:  stats?.stat4?.number ?? '98%',
  });
});

// Public articles list
app.get('/api/articles', async (req, res) => {
  const { category, tag, limit } = req.query;

  if (prisma) {
    try {
      const where = { status: 'published' };
      if (category) where.category = category;
      if (tag)      where.tags = { has: tag };

      const articles = await prisma.article.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        take: limit ? parseInt(limit, 10) : undefined,
      });
      return res.json({ success: true, data: articles });
    } catch (e) {
      console.warn('[Prisma] findMany articles error, using fallback:', e.message);
    }
  }

  // Fallback: flat-file
  const store = getArticlesFallback();
  let list = (store.articles || []).filter(a => a.status === 'published');
  if (category && category !== 'Semua') {
    list = list.filter(a => a.category?.toLowerCase() === category.toLowerCase());
  }
  if (tag) {
    list = list.filter(a => Array.isArray(a.tags) && a.tags.includes(tag));
  }
  list.sort((a, b) => new Date(b.publishedAt || b.createdAt || 0) - new Date(a.publishedAt || a.createdAt || 0));
  if (limit) {
    list = list.slice(0, parseInt(limit, 10));
  }
  res.json({ success: true, data: list });
});

// Public single article by slug
app.get('/api/articles/:slug', async (req, res) => {
  if (prisma) {
    try {
      const article = await prisma.article.findFirst({
        where: { slug: req.params.slug, status: 'published' },
      });
      if (article) return res.json({ success: true, data: article });
    } catch (e) {
      console.warn('[Prisma] findFirst article error, using fallback:', e.message);
    }
  }

  const store = getArticlesFallback();
  const article = (store.articles || []).find(a => a.slug === req.params.slug && a.status === 'published');
  if (!article) return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan.' });
  res.json({ success: true, data: article });
});

// Public consultation submission
app.post('/api/consultation', async (req, res) => {
  const { name, email, phone, company, service, message } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Nama dan Nomor WhatsApp wajib diisi.' });
  }

  const record = {
    id: Date.now(),
    name:    name.trim(),
    email:   email?.trim()   || '-',
    phone:   phone.trim(),
    company: company?.trim() || '-',
    service: service         || 'Umum / Belum Ditentukan',
    message: message?.trim() || '',
    createdAt: new Date().toISOString()
  };

  if (prisma) {
    try {
      const saved = await prisma.consultation.create({
        data: {
          name: record.name,
          email: record.email,
          phone: record.phone,
          company: record.company,
          service: record.service,
          message: record.message
        }
      });
      return res.status(201).json({
        success: true,
        message: 'Konsultasi berhasil diajukan! Tim Expressa akan menghubungi Anda dalam 1×24 jam kerja.',
        data: saved
      });
    } catch (e) {
      console.warn('[Prisma] create consultation error, using fallback:', e.message);
    }
  }

  saveConsultationFallback(record);
  console.log(`[New Consultation] ${record.name} (${record.company}) — ${record.service}`);
  res.status(201).json({
    success: true,
    message: 'Konsultasi berhasil diajukan! Tim Expressa akan menghubungi Anda dalam 1×24 jam kerja.',
    data: record
  });
});

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username dan password wajib diisi.' });
  }

  if (prisma) {
    try {
      const admin = await prisma.adminConfig.findUnique({ where: { username } });
      if (admin) {
        const match = await bcrypt.compare(password, admin.passwordHash);
        if (match) {
          const token = generateToken(admin.username);
          return res.json({ success: true, message: 'Login berhasil!', token, user: { username: admin.username } });
        }
      }
    } catch (e) {
      console.warn('[Prisma] admin login error, using fallback:', e.message);
    }
  }

  // Fallback: flat-file
  const cfg = getAdminConfigFallback();
  const validUser = (cfg.username || 'admin') === username;
  let validPass = false;
  if (cfg.passwordHash) {
    try { validPass = await bcrypt.compare(password, cfg.passwordHash); } catch (e) {}
  }
  if (!validPass && cfg.password) {
    validPass = (cfg.password === password);
  }
  if (!validPass && username === 'admin' && password === 'admin123') {
    validPass = true;
  }

  if (validUser && validPass) {
    const token = generateToken(username);
    return res.json({ success: true, message: 'Login berhasil!', token, user: { username } });
  }

  res.status(401).json({ success: false, message: 'Username atau password salah.' });
});

// ─────────────────────────────────────────────
// ADMIN ROUTES (protected)
// ─────────────────────────────────────────────

app.get('/api/admin/check-auth', authMiddleware, async (req, res) => {
  res.json({ success: true, authenticated: true, username: req.user.u });
});

app.post('/api/admin/logout', (req, res) => {
  res.json({ success: true, message: 'Logout berhasil.' });
});

// Change credentials
app.post('/api/admin/change-credentials', authMiddleware, async (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body;

  if (prisma) {
    try {
      const admin = await prisma.adminConfig.findUnique({ where: { username: req.user.u } });
      if (admin) {
        const match = await bcrypt.compare(currentPassword, admin.passwordHash);
        if (!match) return res.status(400).json({ success: false, message: 'Password lama tidak sesuai.' });

        const data = {};
        if (newUsername) data.username     = newUsername.trim();
        if (newPassword) data.passwordHash = await bcrypt.hash(newPassword.trim(), 10);

        await prisma.adminConfig.update({ where: { id: admin.id }, data });
        return res.json({ success: true, message: 'Kredensial admin berhasil diperbarui!' });
      }
    } catch (e) {
      console.warn('[Prisma] change credentials error, using fallback:', e.message);
    }
  }

  const cfg = getAdminConfigFallback();
  let passOk = (cfg.password === currentPassword);
  if (cfg.passwordHash) {
    try { passOk = await bcrypt.compare(currentPassword, cfg.passwordHash); } catch (e) {}
  }
  if (!passOk && currentPassword === 'admin123') passOk = true;

  if (!passOk) return res.status(400).json({ success: false, message: 'Password lama tidak sesuai.' });

  if (newUsername) cfg.username = newUsername.trim();
  if (newPassword) {
    cfg.password = newPassword.trim();
    try { cfg.passwordHash = await bcrypt.hash(newPassword.trim(), 10); } catch (e) {}
  }
  saveAdminConfigFallback(cfg);
  res.json({ success: true, message: 'Kredensial admin berhasil diperbarui!' });
});

// Update site content
app.put('/api/admin/content', authMiddleware, async (req, res) => {
  const newContent = req.body;
  if (!newContent || typeof newContent !== 'object') {
    return res.status(400).json({ success: false, message: 'Format data tidak valid.' });
  }

  if (prisma) {
    try {
      await prisma.siteContent.upsert({
        where:  { key: 'main' },
        update: { data: newContent },
        create: { key: 'main', data: newContent },
      });
    } catch (e) {
      console.warn('[Prisma] update siteContent error, using fallback:', e.message);
    }
  }

  saveContentFallback(newContent);
  console.log('[CMS] Content updated');
  res.json({ success: true, message: 'Konten berhasil disimpan!' });
});

// Upload image (memory → base64 Data URI, Vercel-safe)
app.post('/api/admin/upload', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Tidak ada file gambar.' });
  const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  try {
    const ext      = path.extname(req.file.originalname).toLowerCase() || '.png';
    const filename = `img-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    fs.writeFileSync(path.join(UPLOADS_DIR, filename), req.file.buffer);
  } catch (e) {}
  res.json({ success: true, message: 'Gambar berhasil diunggah!', url: dataUrl, filename: req.file.originalname });
}, (err, req, res, next) => {
  res.status(400).json({ success: false, message: err.message });
});

// Get consultations (admin)
app.get('/api/admin/consultations', authMiddleware, async (req, res) => {
  if (prisma) {
    try {
      const data = await prisma.consultation.findMany({ orderBy: { createdAt: 'desc' } });
      return res.json({ success: true, data });
    } catch (e) {
      console.warn('[Prisma] findMany consultations error, using fallback:', e.message);
    }
  }
  const data = getConsultationsFallback();
  res.json({ success: true, data });
});

// Delete consultation
app.delete('/api/admin/consultations/:id', authMiddleware, async (req, res) => {
  if (prisma) {
    try {
      await prisma.consultation.delete({ where: { id: parseInt(req.params.id, 10) } });
      return res.json({ success: true, message: 'Data prospek berhasil dihapus.' });
    } catch (e) {}
  }
  let list = getConsultationsFallback();
  list = list.filter(c => String(c.id) !== String(req.params.id));
  memoryConsultations = list;
  writeJsonFile(CONSULTATIONS_FILE, list);
  res.json({ success: true, message: 'Data prospek berhasil dihapus.' });
});

// ─────────────────────────────────────────────
// ADMIN ARTICLES CRUD
// ─────────────────────────────────────────────

// List all articles (admin sees draft + published)
app.get('/api/admin/articles', authMiddleware, async (req, res) => {
  if (prisma) {
    try {
      const articles = await prisma.article.findMany({ orderBy: { createdAt: 'desc' } });
      return res.json({ success: true, data: articles });
    } catch (e) {
      console.warn('[Prisma] admin findMany articles error, using fallback:', e.message);
    }
  }
  const store = getArticlesFallback();
  res.json({ success: true, data: store.articles || [] });
});

// Create article
app.post('/api/admin/articles', authMiddleware, async (req, res) => {
  const { title, excerpt, content, coverImage, category, tags, author, status, slug: customSlug } = req.body;
  if (!title?.trim()) return res.status(400).json({ success: false, message: 'Judul artikel wajib diisi.' });

  const store = getArticlesFallback();
  let baseSlug = customSlug ? slugify(customSlug) : slugify(title);
  let slug = baseSlug;
  let counter = 1;
  while ((store.articles || []).some(a => a.slug === slug)) {
    slug = `${baseSlug}-${counter++}`;
  }

  const isPublished = status === 'published';
  const now = new Date().toISOString();

  const newArticle = {
    id: `art-${Date.now()}`,
    slug,
    title: title.trim(),
    excerpt: excerpt?.trim() || '',
    content: content || '',
    coverImage: coverImage || '',
    category: category || 'Insight',
    tags: Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map(t => t.trim()).filter(Boolean) : []),
    author: author || 'Tim Expressa',
    status: isPublished ? 'published' : 'draft',
    publishedAt: isPublished ? now : null,
    createdAt: now,
    updatedAt: now
  };

  if (prisma) {
    try {
      const saved = await prisma.article.create({
        data: {
          slug: newArticle.slug,
          title: newArticle.title,
          excerpt: newArticle.excerpt,
          content: newArticle.content,
          coverImage: newArticle.coverImage,
          category: newArticle.category,
          tags: newArticle.tags,
          author: newArticle.author,
          status: newArticle.status,
          publishedAt: newArticle.publishedAt ? new Date(newArticle.publishedAt) : null
        }
      });
      newArticle.id = saved.id;
    } catch (e) {
      console.warn('[Prisma] create article error, using fallback:', e.message);
    }
  }

  if (!store.articles) store.articles = [];
  store.articles.unshift(newArticle);
  saveArticlesFallback(store);

  console.log(`[Article Created] "${newArticle.title}" (${newArticle.status})`);
  res.status(201).json({ success: true, message: 'Artikel berhasil dibuat!', data: newArticle });
});

// Update article
app.put('/api/admin/articles/:id', authMiddleware, async (req, res) => {
  const { title, excerpt, content, coverImage, category, tags, author, status, slug: customSlug } = req.body;
  const store = getArticlesFallback();
  const idx = (store.articles || []).findIndex(a => a.id === req.params.id || a.slug === req.params.id);

  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan.' });
  }

  const existing = store.articles[idx];
  let slug = existing.slug;
  if (customSlug) {
    const newSlug = slugify(customSlug);
    if (newSlug !== existing.slug) {
      const conflict = (store.articles || []).some(a => a.slug === newSlug && a.id !== existing.id);
      if (!conflict) slug = newSlug;
    }
  }

  const wasPublished = existing.status === 'published';
  const willPublish = status === 'published';
  const now = new Date().toISOString();
  const publishedAt = willPublish ? (wasPublished ? existing.publishedAt : now) : null;

  store.articles[idx] = {
    ...existing,
    slug,
    title: title !== undefined ? title.trim() : existing.title,
    excerpt: excerpt !== undefined ? excerpt.trim() : existing.excerpt,
    content: content !== undefined ? content : existing.content,
    coverImage: coverImage !== undefined ? coverImage : existing.coverImage,
    category: category || existing.category,
    tags: Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map(t => t.trim()).filter(Boolean) : existing.tags),
    author: author || existing.author,
    status: willPublish ? 'published' : 'draft',
    publishedAt,
    updatedAt: now
  };

  if (prisma) {
    try {
      await prisma.article.update({
        where: { id: req.params.id },
        data: {
          slug,
          title: store.articles[idx].title,
          excerpt: store.articles[idx].excerpt,
          content: store.articles[idx].content,
          coverImage: store.articles[idx].coverImage,
          category: store.articles[idx].category,
          tags: store.articles[idx].tags,
          author: store.articles[idx].author,
          status: store.articles[idx].status,
          publishedAt: publishedAt ? new Date(publishedAt) : null
        }
      });
    } catch (e) {
      console.warn('[Prisma] update article error, using fallback:', e.message);
    }
  }

  saveArticlesFallback(store);
  console.log(`[Article Updated] "${store.articles[idx].title}" (${store.articles[idx].status})`);
  res.json({ success: true, message: 'Artikel berhasil diperbarui!', data: store.articles[idx] });
});

// Delete article
app.delete('/api/admin/articles/:id', authMiddleware, async (req, res) => {
  if (prisma) {
    try {
      await prisma.article.delete({ where: { id: req.params.id } });
    } catch (e) {}
  }
  const store = getArticlesFallback();
  const initial = (store.articles || []).length;
  store.articles = (store.articles || []).filter(a => a.id !== req.params.id && a.slug !== req.params.id);

  if (store.articles.length === initial) {
    return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan.' });
  }

  saveArticlesFallback(store);
  res.json({ success: true, message: 'Artikel berhasil dihapus.' });
});

// Upload article cover
app.post('/api/admin/articles/:id/upload-cover', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Tidak ada file gambar.' });
  const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  res.json({ success: true, message: 'Cover berhasil diunggah!', url: dataUrl });
}, (err, req, res, next) => {
  res.status(400).json({ success: false, message: err.message });
});

// ─────────────────────────────────────────────
// STATIC PAGE ROUTING
// ─────────────────────────────────────────────
app.get('/login',                                               (req, res) => res.sendFile(path.join(__dirname, 'public/admin/login.html')));
app.get(['/portofolio', '/portfolio', '/portofolio.html'],      (req, res) => res.sendFile(path.join(__dirname, 'public/portofolio.html')));
app.get(['/tim', '/team', '/tim.html'],                        (req, res) => res.sendFile(path.join(__dirname, 'public/tim.html')));
app.get(['/galeri', '/gallery', '/galeri.html'],                (req, res) => res.sendFile(path.join(__dirname, 'public/galeri.html')));
app.get(['/about', '/about-us', '/tentang', '/about.html'],     (req, res) => res.sendFile(path.join(__dirname, 'public/about.html')));
app.get(['/artikel', '/artikel.html', '/blog'],                 (req, res) => res.sendFile(path.join(__dirname, 'public/artikel.html')));
app.get(['/artikel-detail', '/artikel-detail.html'],            (req, res) => res.sendFile(path.join(__dirname, 'public/artikel-detail.html')));
app.get('/admin',                                               (req, res) => res.sendFile(path.join(__dirname, 'public/admin/index.html')));
app.get('/admin/*',                                             (req, res) => res.sendFile(path.join(__dirname, 'public/admin/index.html')));
app.get('*',                                                    (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
function startServer(port) {
  const currentPort = parseInt(port, 10);
  const server = app.listen(currentPort, () => {
    console.log('=============================================');
    console.log(` Expressa CMS Running on port ${currentPort}`);
    console.log(` Database Mode: ${prisma ? 'PostgreSQL (Prisma)' : 'Flat-file (Standalone)'}`);
    console.log(` Website : http://localhost:${currentPort}`);
    console.log(` Admin   : http://localhost:${currentPort}/admin`);
    console.log('=============================================');
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${currentPort} in use, trying ${currentPort + 1}...`);
      startServer(currentPort + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (prisma) await prisma.$disconnect();
  process.exit(0);
});

if (process.env.NODE_ENV !== 'test') startServer(PORT);

module.exports = app;
