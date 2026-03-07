# 📚 Linkdinger Documentation

> เอกสารประกอบการเรียนรู้และพัฒนา Linkdinger
> ครอบคลุมทั้ง Backend, Frontend, และ CI/CD

---

## 🎯 เริ่มต้นที่ไหน?

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LINKDINGER LEARNING PATH                          │
└─────────────────────────────────────────────────────────────────────┘

     ผู้เริ่มต้น                ผู้มีพื้นฐาน               ผู้ชำนาญ
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│ ARCHITECTURE  │ ──▶  │  TUTORIALS    │ ──▶  │   CI/CD       │
│               │      │               │      │   GUIDE        │
│ • Overview    │      │ • Backend     │      │               │
│ • Data Flow   │      │ • Next.js     │      │ • GitHub      │
│ • Stack       │      │               │      │   Actions     │
└───────────────┘      └───────────────┘      │ • Vercel      │
                                              │ • Monitoring  │
                                              └───────────────┘
```

---

## 📖 เอกสารทั้งหมด

### 1. [ARCHITECTURE.md](./ARCHITECTURE.md) - สถาปัตยกรรมระบบ

**เนื้อหา:**

- Overview ของโปรเจกต์
- Backend Architecture (Python Daemon)
- Frontend Architecture (Next.js 14)
- Data Flow: Obsidian → R2 → Git → Blog
- External Services (R2, Redis, GitHub)
- CI/CD Pipeline Overview
- Advanced Concepts
- Troubleshooting

**เหมาะสำหรับ:**

- ผู้ที่ต้องการเข้าใจภาพรวมของระบบ
- ผู้ที่กำลังเริ่มต้นศึกษาโปรเจกต์

---

### 2. [BACKEND_TUTORIAL.md](./BACKEND_TUTORIAL.md) - สอน Backend

**เนื้อหา:**

- Backend คืออะไร?
- Python Backend พื้นฐาน
- File System Operations
- Event-Driven Programming
- Working with External APIs
- Database Basics (Redis)
- Authentication & Security
- Deployment & DevOps

**เหมาะสำหรับ:**

- ผู้ที่ต้องการเรียนรู้ Backend Development
- ผู้ที่ต้องการเข้าใจ Python Daemon

---

### 3. [NEXTJS_TUTORIAL.md](./NEXTJS_TUTORIAL.md) - สอน Next.js 14

**เนื้อหา:**

- Next.js คืออะไร?
- App Router พื้นฐาน
- Server Components
- Client Components
- Data Fetching
- Routing ขั้นสูง
- Styling with Tailwind
- Performance Optimization

**เหมาะสำหรับ:**

- ผู้ที่ต้องการเรียนรู้ Next.js 14
- ผู้ที่ต้องการเข้าใจ Server Components

---

### 4. [CICD_GUIDE.md](./CICD_GUIDE.md) - คู่มือ CI/CD

**เนื้อหา:**

- CI/CD คืออะไร?
- GitHub Actions Setup
- Vercel Deployment
- Cloudflare Pages Alternative
- Advanced Workflows
- Monitoring & Alerts

**เหมาะสำหรับ:**

- ผู้ที่ต้องการตั้งค่า CI/CD Pipeline
- ผู้ที่ต้องการ Deploy อัตโนมัติ

---

## 🔗 เอกสารอ้างอิงเพิ่มเติม

### Design System

- [Dark Glassmorphism](./Dark%20Glassmorphism-The%20Aesthetic.md) - Design System หลัก
- [UX/UI Principles](./uxui-principle.md) - Dev-Ready Design Spec
- [Blog Principles](./principle-blog.md) - Blog UX Best Practices
- [Design Inspiration](./inspireblog.md) - Design References

### Configuration

- [AGENTS.md](../AGENTS.md) - Agent Rules Standard
- [config.yaml](../config.yaml) - Main Configuration
- [.env.example](../.env.example) - Environment Template

---

## 🛠️ Quick Start

### รัน Backend Daemon

```bash
# Setup
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials

# Run
python linkdinger.py              # All services
python linkdinger.py --status     # Check status
```

### รัน Frontend Blog

```bash
cd blog
npm install
npm run dev    # Development
npm run build  # Production build
```

---

## 📊 Stack Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     LINKDINGER STACK                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  INPUT                                                      │
│  └── Obsidian (Markdown Editor)                            │
│                                                             │
│  BACKEND (Python Daemon)                                    │
│  ├── File Watcher (watchdog)                               │
│  ├── Image Processor (PIL)                                 │
│  ├── Git Sync (subprocess)                                 │
│  └── CMS Sync (file copy)                                  │
│                                                             │
│  STORAGE                                                    │
│  ├── Cloudflare R2 (Images - S3 compatible)                │
│  ├── Upstash Redis (View Counter)                          │
│  └── GitHub (Version Control)                              │
│                                                             │
│  FRONTEND (Next.js 14)                                      │
│  ├── App Router                                             │
│  ├── Server Components                                      │
│  ├── Tailwind CSS (Dark Glassmorphism)                     │
│  └── Static Generation                                      │
│                                                             │
│  DEPLOYMENT                                                 │
│  └── Vercel (Edge Network)                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ❓ คำถามที่พบบ่อย

### Q: Backend ใช้อะไร?

**A:** Python Daemon (ไม่ใช่ Next.js API Routes) ทำงานเป็น background process

### Q: Frontend ใช้อะไร?

**A:** Next.js 14 กับ App Router และ Server Components

### Q: เก็บรูปที่ไหน?

**A:** Cloudflare R2 (S3-compatible storage) ฟรี 10GB

### Q: นับ views ยังไง?

**A:** Upstash Redis ผ่าน REST API (ไม่ต้องมี Redis server)

### Q: Deploy ที่ไหน?

**A:** Vercel (แนะนำ) หรือ Cloudflare Pages

---

## 📝 การมีส่วนร่วม

หากต้องการเพิ่มเติมหรือแก้ไขเอกสาร:

1. Fork repository
2. สร้าง branch ใหม่
3. แก้ไขไฟล์ใน `docs/`
4. สร้าง Pull Request

---

*Last updated: March 2026*
