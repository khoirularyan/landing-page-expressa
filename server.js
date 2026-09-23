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
const { PrismaClient } = require('@prisma/client');

const app    = express();
const prisma = new PrismaClient();
const PORT   = process.env.PORT || 3000;

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
const AUTH_SECRET = process.env.ADMIN_SECRET;
if (!AUTH_SECRET) {
  console.error('[ERROR] ADMIN_SECRET env var tidak diset! Server tidak bisa dijalankan tanpa secret key.');
  console.error('[ERROR] Buat file .env dan isi ADMIN_SECRET dengan string random minimal 32 karakter.');
  process.exit(1);
}

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
  res.json({ status: 'ok', app: 'Expressa CMS', timestamp: new Date().toISOString() });
});

// Landing page content
app.get('/api/content', async (req, res) => {
  try {
    const row = await prisma.siteContent.findUnique({ where: { key: 'main' } });
    res.json({ success: true, data: row?.data ?? {} });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Gagal mengambil konten.' });
  }
});

// Stats shortcut (backward-compat)
app.get('/api/stats', async (req, res) => {
  try {
    const row = await prisma.siteContent.findUnique({ where: { key: 'main' } });
    const stats = (row?.data)?.stats;
    res.json({
      projectsCompleted: stats?.stat1?.number ?? '200+',
      enterpriseClients: stats?.stat2?.number ?? '50+',
      industries:        stats?.stat3?.number ?? '15+',
      satisfactionRate:  stats?.stat4?.number ?? '98%',
    });
  } catch (e) {
    res.json({ projectsCompleted: '200+', enterpriseClients: '50+', industries: '15+', satisfactionRate: '98%' });
  }
});

// Public articles list
app.get('/api/articles', async (req, res) => {
  try {
    const { category, tag, limit } = req.query;
    const where = { status: 'published' };
    if (category) where.category = category;
    if (tag)      where.tags = { has: tag };

    const articles = await prisma.article.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit ? parseInt(limit, 10) : undefined,
    });
    res.json({ success: true, data: articles });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Gagal mengambil artikel.' });
  }
});

// Public single article by slug
app.get('/api/articles/:slug', async (req, res) => {
  try {
    const article = await prisma.article.findFirst({
      where: { slug: req.params.slug, status: 'published' },
    });
    if (!article) return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan.' });
    res.json({ success: true, data: article });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Gagal mengambil artikel.' });
  }
});

// Public consultation submission
app.post('/api/consultation', async (req, res) => {
  const { name, email, phone, company, service, message } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Nama dan Nomor WhatsApp wajib diisi.' });
  }
  try {
    const record = await prisma.consultation.create({
      data: {
        name:    name.trim(),
        email:   email?.trim()   || '-',
        phone:   phone.trim(),
        company: company?.trim() || '-',
        service: service         || 'Umum / Belum Ditentukan',
        message: message?.trim() || '',
      },
    });
    console.log(`[New Consultation] ${record.name} (${record.company}) — ${record.service}`);
    res.status(201).json({
      success: true,
      message: 'Konsultasi berhasil diajukan! Tim Expressa akan menghubungi Anda dalam 1×24 jam kerja.',
      data: record,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Gagal menyimpan konsultasi.' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username dan password wajib diisi.' });
  }
  try {
    const admin = await prisma.adminConfig.findUnique({ where: { username } });
    if (!admin) return res.status(401).json({ success: false, message: 'Username atau password salah.' });

    const match = await bcrypt.compare(password, admin.passwordHash);
    if (!match) return res.status(401).json({ success: false, message: 'Username atau password salah.' });

    const token = generateToken(admin.username);
    res.json({ success: true, message: 'Login berhasil!', token, user: { username: admin.username } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error saat login.' });
  }
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
  try {
    const admin = await prisma.adminConfig.findUnique({ where: { username: req.user.u } });
    if (!admin) return res.status(404).json({ success: false, message: 'Akun tidak ditemukan.' });

    const match = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!match) return res.status(400).json({ success: false, message: 'Password lama tidak sesuai.' });

    const data = {};
    if (newUsername) data.username     = newUsername.trim();
    if (newPassword) data.passwordHash = await bcrypt.hash(newPassword.trim(), 10);

    await prisma.adminConfig.update({ where: { id: admin.id }, data });
    res.json({ success: true, message: 'Kredensial admin berhasil diperbarui!' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Gagal memperbarui kredensial.' });
  }
});

// Update site content
app.put('/api/admin/content', authMiddleware, async (req, res) => {
  const newContent = req.body;
  if (!newContent || typeof newContent !== 'object') {
    return res.status(400).json({ success: false, message: 'Format data tidak valid.' });
  }
  try {
    await prisma.siteContent.upsert({
      where:  { key: 'main' },
      update: { data: newContent },
      create: { key: 'main', data: newContent },
    });
    console.log('[CMS] Content updated');
    res.json({ success: true, message: 'Konten berhasil disimpan!' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Gagal menyimpan konten.' });
  }
});

// Upload image (memory → base64 Data URI, Vercel-safe)
app.post('/api/admin/upload', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Tidak ada file gambar.' });
  const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  // Optionally save locally in non-serverless env
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
  try {
    const data = await prisma.consultation.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Gagal mengambil data konsultasi.' });
  }
});

// Delete consultation
app.delete('/api/admin/consultations/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.consultation.delete({ where: { id: parseInt(req.params.id, 10) } });
    res.json({ success: true, message: 'Data prospek berhasil dihapus.' });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });
    console.error(e);
    res.status(500).json({ success: false, message: 'Gagal menghapus data.' });
  }
});

// ─────────────────────────────────────────────
// ADMIN ARTICLES CRUD
// ─────────────────────────────────────────────

// List all articles (admin sees draft + published)
app.get('/api/admin/articles', authMiddleware, async (req, res) => {
  try {
    const articles = await prisma.article.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: articles });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Gagal mengambil artikel.' });
  }
});

// Create article
app.post('/api/admin/articles', authMiddleware, async (req, res) => {
  const { title, excerpt, content, coverImage, category, tags, author, status, slug: customSlug } = req.body;
  if (!title?.trim()) return res.status(400).json({ success: false, message: 'Judul artikel wajib diisi.' });

  // Generate unique slug
  let baseSlug = customSlug ? slugify(customSlug) : slugify(title);
  let slug     = baseSlug;
  let counter  = 1;
  while (await prisma.article.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const isPublished  = status === 'published';
  const now          = new Date();

  try {
    const article = await prisma.article.create({
      data: {
        slug,
        title:       title.trim(),
        excerpt:     excerpt?.trim()  || '',
        content:     content          || '',
        coverImage:  coverImage       || '',
        category:    category         || 'Insight',
        tags:        Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map(t => t.trim()).filter(Boolean) : []),
        author:      author           || 'Tim Expressa',
        status:      isPublished ? 'published' : 'draft',
        publishedAt: isPublished ? now : null,
      },
    });
    console.log(`[Article Created] "${article.title}" (${article.status})`);
    res.status(201).json({ success: true, message: 'Artikel berhasil dibuat!', data: article });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Gagal membuat artikel.' });
  }
});

// Update article
app.put('/api/admin/articles/:id', authMiddleware, async (req, res) => {
  const { title, excerpt, content, coverImage, category, tags, author, status, slug: customSlug } = req.body;

  try {
    const existing = await prisma.article.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan.' });

    // Slug update: hanya jika customSlug berbeda dan tidak konflik
    let slug = existing.slug;
    if (customSlug) {
      const newSlug = slugify(customSlug);
      if (newSlug !== existing.slug) {
        const conflict = await prisma.article.findFirst({ where: { slug: newSlug, NOT: { id: req.params.id } } });
        if (!conflict) slug = newSlug;
      }
    }

    const wasPublished  = existing.status === 'published';
    const willPublish   = status === 'published';
    const publishedAt   = willPublish ? (wasPublished ? existing.publishedAt : new Date()) : null;

    const updated = await prisma.article.update({
      where: { id: req.params.id },
      data: {
        slug,
        title:       title       !== undefined ? title.trim()      : existing.title,
        excerpt:     excerpt     !== undefined ? excerpt.trim()     : existing.excerpt,
        content:     content     !== undefined ? content            : existing.content,
        coverImage:  coverImage  !== undefined ? coverImage         : existing.coverImage,
        category:    category    || existing.category,
        tags:        Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map(t => t.trim()).filter(Boolean) : existing.tags),
        author:      author      || existing.author,
        status:      willPublish ? 'published' : 'draft',
        publishedAt,
      },
    });
    console.log(`[Article Updated] "${updated.title}" (${updated.status})`);
    res.json({ success: true, message: 'Artikel berhasil diperbarui!', data: updated });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan.' });
    console.error(e);
    res.status(500).json({ success: false, message: 'Gagal memperbarui artikel.' });
  }
});

// Delete article
app.delete('/api/admin/articles/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.article.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Artikel berhasil dihapus.' });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan.' });
    console.error(e);
    res.status(500).json({ success: false, message: 'Gagal menghapus artikel.' });
  }
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
    console.log(' Expressa CMS — PostgreSQL + Prisma v6');
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
  await prisma.$disconnect();
  process.exit(0);
});

if (process.env.NODE_ENV !== 'test') startServer(PORT);

module.exports = app;
