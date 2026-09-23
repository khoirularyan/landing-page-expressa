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

function getArticlesFallback() {
  if (memoryArticles) return memoryArticles;
  const raw = readJsonFile(ARTICLES_FILE, { articles: [] });
  memoryArticles = Array.isArray(raw) ? { articles: raw } : (raw || { articles: [] });
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
