---
title: ลองเล่น Dark Glassmorphism ใน Next.js
date: 2026-02-27
locale: th
translationKey: dark-glassmorphism-nextjs
canonicalLocale: th
category: Design
excerpt: พามาดูว่าเทรนด์การออกแบบ UI แบบโปร่งแสง พอกลายมาเป็น Dark Mode แล้วจะดูลึกลับและพรีเมียมขนาดไหน พร้อมตัวอย่างโค้ดไปลองเล่นกัน
tags:
  - glassmorphism
  - nextjs
  - tailwindcss
  - vibe-coding
coverImage: https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=1200&h=630&fit=crop
publish: true
---

## ทำไมถึงต้อง Dark Glassmorphism?

การออกแบบแนว **Glassmorphism** หรือ UI แบบกระจกฝ้า ฮิตมาสักพักใหญ่ๆ แล้วตั้งแต่ iOS นำมาใช้ แต่พอเราเอามาปรับเป็น **Dark Mode** มันให้ความรู้สึกที่ต่างออกไปอย่างสิ้นเชิง

จากที่ดูสว่างและมินิมอล มันกลายเป็นความรู้สึกที่ *เท่ ลึกลับ และดูเป็นเทคโนโลยีแห่งอนาคต* (Cyberpunk นิดๆ)

### องค์ประกอบหลักของ Glassmorphism

1. **Background Blur:** ฉากหลังต้องเบลอจัดๆ (ประมาณ `backdrop-blur-xl` หรือ `20px` ขึ้นไป)
2. **Translucency:** ต้องมีความโปร่งแสง ให้เห็นสีสันหรือลูกแก้ว (Ambient Orbs) สลัวๆ อยู่ด้านหลัง
3. **Thin Borders:** ขอบต้องบางเฉียบ ประมาณ `1px` และมีค่า Opacity ต่ำๆ (เช่น สีขาว 10%) เพื่อเลียนแบบขอบกระจกที่สะท้อนแสง
4. **Subtle Shadow:** เงาต้องนุ่มและลึก เพื่อยกลอยตัวการ์ดขึ้นมาจากพื้นหลัง

---

## ตัวอย่างโค้ด Tailwind CSS

เราสามารถสร้าง Glass Card สวยๆ ได้ง่ายๆ ด้วย Tailwind CSS แบบนี้ครับ:

```css
/* ใน globals.css หรือกำหนดเป็น utility class */
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}
```
![image](https://pub-ae83c12b8f3a4f61aab4e9bf3f4b7443.r2.dev/4a465b6eb17b4e3fa3d9be00291bd0a1.webp)
