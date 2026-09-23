// prisma/seed.js — Seed database dari data JSON yang ada
// Jalankan: npx prisma db seed

'use strict';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ─────────────────────────────────────────────
  // 1. ADMIN CONFIG
  // ─────────────────────────────────────────────
  let adminJson = { username: 'admin', password: 'admin123', siteName: 'Expressa Content Manager' };
  try {
    const raw = fs.readFileSync(path.join(__dirname, '../data/admin-config.json'), 'utf8');
    adminJson = JSON.parse(raw);
  } catch (e) {}

  const passwordHash = await bcrypt.hash(adminJson.password || 'admin123', 10);

  await prisma.adminConfig.upsert({
    where: { username: adminJson.username || 'admin' },
    update: { passwordHash, siteName: adminJson.siteName || 'Expressa Content Manager' },
    create: {
      username: adminJson.username || 'admin',
      passwordHash,
      siteName: adminJson.siteName || 'Expressa Content Manager',
    },
  });
  console.log('✅ AdminConfig seeded');

  // ─────────────────────────────────────────────
  // 2. SITE CONTENT
  // ─────────────────────────────────────────────
  let contentData = {};
  try {
    const raw = fs.readFileSync(path.join(__dirname, '../data/content.json'), 'utf8');
    contentData = JSON.parse(raw);
  } catch (e) {}

  await prisma.siteContent.upsert({
    where: { key: 'main' },
    update: { data: contentData },
    create: { key: 'main', data: contentData },
  });
  console.log('✅ SiteContent seeded');

  // ─────────────────────────────────────────────
  // 3. ARTICLES
  // ─────────────────────────────────────────────
  let articles = [];
  try {
    const raw = fs.readFileSync(path.join(__dirname, '../data/articles.json'), 'utf8');
    const parsed = JSON.parse(raw);
    articles = Array.isArray(parsed) ? parsed : (parsed.articles || []);
  } catch (e) {}

  for (const a of articles) {
    await prisma.article.upsert({
      where: { slug: a.slug },
      update: {
        title:       a.title,
        excerpt:     a.excerpt     || '',
        content:     a.content     || '',
        coverImage:  a.coverImage  || '',
        category:    a.category    || 'Insight',
        tags:        Array.isArray(a.tags) ? a.tags : [],
        author:      a.author      || 'Tim Expressa',
        status:      a.status      || 'draft',
        publishedAt: a.publishedAt ? new Date(a.publishedAt) : null,
        createdAt:   a.createdAt   ? new Date(a.createdAt)   : new Date(),
      },
      create: {
        slug:        a.slug,
        title:       a.title,
        excerpt:     a.excerpt     || '',
        content:     a.content     || '',
        coverImage:  a.coverImage  || '',
        category:    a.category    || 'Insight',
        tags:        Array.isArray(a.tags) ? a.tags : [],
        author:      a.author      || 'Tim Expressa',
        status:      a.status      || 'draft',
        publishedAt: a.publishedAt ? new Date(a.publishedAt) : null,
        createdAt:   a.createdAt   ? new Date(a.createdAt)   : new Date(),
      },
    });
  }
  console.log(`✅ Articles seeded: ${articles.length} artikel`);

  // ─────────────────────────────────────────────
  // 4. CONSULTATIONS
  // ─────────────────────────────────────────────
  let consultations = [];
  try {
    const raw = fs.readFileSync(path.join(__dirname, '../consultations.json'), 'utf8');
    consultations = JSON.parse(raw || '[]');
  } catch (e) {}

  for (const c of consultations) {
    // Cek dulu apakah sudah ada berdasarkan createdAt + phone
    const existing = await prisma.consultation.findFirst({
      where: { phone: c.phone, createdAt: new Date(c.createdAt) },
    });
    if (!existing) {
      await prisma.consultation.create({
        data: {
          name:      c.name,
          email:     c.email    || '-',
          phone:     c.phone,
          company:   c.company  || '-',
          service:   c.service  || 'Umum / Belum Ditentukan',
          message:   c.message  || '',
          createdAt: new Date(c.createdAt),
        },
      });
    }
  }
  console.log(`✅ Consultations seeded: ${consultations.length} leads`);

  console.log('\n🎉 Seed selesai!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
