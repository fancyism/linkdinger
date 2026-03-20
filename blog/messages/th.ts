const messages = {
  HomePage: {
    latestEntry: "โพสต์ล่าสุด",
    welcomePrefix: "ยินดีต้อนรับสู่",
    welcomeDescription:
      "เครื่องมือและบทความที่ขับเคลื่อนด้วย AI เริ่มเขียนใน Obsidian แล้วโพสต์จะมาแสดงที่นี่",
    categoriesLabel: "หมวดหมู่:",
    trendingTitle: "กำลังมาแรง",
    trendingSubtitle: "อันดับยอดนิยม",
  },
  PaginatedHomePage: {
    newsletterTitle: "อยากให้อัปเดตถึงคุณเสมอ",
    newsletterBody:
      "รับแจ้งเมื่อมีโพสต์ใหม่ เนื้อหาเน้น ๆ ไม่มีสแปม และยกเลิกติดตามได้ทุกเมื่อ",
  },
  Navbar: {
    home: "หน้าแรก",
    blog: "บล็อก",
    products: "สินค้า",
    consultation: "ปรึกษา",
    about: "เกี่ยวกับ",
    search: "ค้นหา",
    openMenu: "เปิดเมนู",
    closeMenu: "ปิดเมนู",
    toggleTheme: "สลับธีม",
    switchToLight: "เปลี่ยนเป็นธีมสว่าง",
    switchToDark: "เปลี่ยนเป็นธีมมืด",
    language: "ภาษา",
    english: "EN",
    thai: "TH",
  },
  Footer: {
    tagline:
      "เครื่องมือและบทความที่ขับเคลื่อนด้วย AI ทุกคอมมิตขึ้น GitHub ให้คุณ fork และ remix ต่อได้ สร้างด้วยความหมกมุ่น",
    navigate: "เมนู",
    connect: "ติดตาม",
    home: "หน้าแรก",
    blog: "บล็อก",
    products: "สินค้า",
    consultation: "ปรึกษา",
    about: "เกี่ยวกับ",
    search: "ค้นหา",
    copyright: "Copyright {year} Linkdinger. สร้างด้วย Next.js",
    aesthetic: "Dark Glassmorphism / Peach Fuzz #FF6B35",
  },
  Newsletter: {
    emailPlaceholder: "your@email.com",
    emailLabel: "อีเมลสำหรับจดหมายข่าว",
    subscribe: "ติดตาม",
    subscribed: "ติดตามแล้ว",
  },
  CommandPalette: {
    label: "เมนูคำสั่ง",
    placeholder: "คุณกำลังมองหาอะไรอยู่?",
    empty: "ไม่พบผลลัพธ์",
    navigation: "การนำทาง",
    goHome: "ไปหน้าแรก",
    goBlog: "ไปหน้าบล็อก",
    posts: "โพสต์บล็อก",
  },
  SearchPage: {
    title: "ค้นหา",
    description: "ค้นหาโพสต์จากชื่อ เนื้อหา หรือแท็ก",
    metaDescription: "ค้นหาผ่านทุกโพสต์ในบล็อก",
  },
  SearchClient: {
    placeholder: "ค้นหาโพสต์จากชื่อ เนื้อหา หรือแท็ก...",
    ariaLabel: "ค้นหาโพสต์",
    results: 'พบ {count} ผลลัพธ์สำหรับ "{query}"',
    noResultsTitle: 'ไม่พบผลลัพธ์สำหรับ "{query}"',
    noResultsHint: "ลองเปลี่ยนคีย์เวิร์ดหรือตรวจสอบการสะกดอีกครั้ง",
    idleTitle: "เริ่มพิมพ์เพื่อค้นหาทุกโพสต์",
  },
  BlogPage: {
    title: "บล็อก",
    description: "{count} โพสต์ - บทความ บทเรียน และการสำรวจไอเดีย",
    metaDescription: "บทความ บทเรียน และการสำรวจไอเดีย",
  },
  BlogClient: {
    all: "ทั้งหมด",
    searchPlaceholder: "ค้นหาโพสต์...",
    clearSearch: "ล้างคำค้น",
    sortBy: "เรียงตาม:",
    latest: "ล่าสุด",
    popular: "ยอดนิยม",
    noPosts: "ยังไม่มีโพสต์",
    noPostsInCategory: 'ไม่มีโพสต์ในหมวด "{category}"',
    viewAllPosts: "ดูโพสต์ทั้งหมด",
    noPostsHint: "เพิ่มไฟล์ markdown ใน content/posts/ เพื่อเริ่มต้น",
  },
  TagCloud: {
    title: "แท็กยอดนิยม",
    showLess: "ย่อกลับ",
    viewAll: "ดูแท็กทั้งหมด {count} แท็ก",
    more: "+อีก {count}",
  },
  Pagination: {
    previous: "ก่อนหน้า",
    next: "ถัดไป",
    summary: "หน้า {current} จาก {total}",
  },
  AboutPage: {
    title: "เกี่ยวกับ",
    metaDescription:
      "อยู่ในโหมด vibe-coding เต็มตัว ลองของใหม่บนเว็บและวิ่งไล่ไอเดียสด ๆ อยู่เสมอ",
    introTitle: "สวัสดี ผม Affan",
    location: "กรุงเทพฯ / โลกออนไลน์",
    introLead:
      "ตอนนี้กำลังอินกับ vibe-coding ลองเทคเว็บใหม่ ๆ และวิ่งไล่ไอเดียสด ๆ อยู่ตลอด",
    introBody:
      "หลังจากสร้างซอฟต์แวร์ในรูปแบบเดิมมาหลายปี เว็บยุคใหม่ให้ความรู้สึกเหมือนผืนผ้าใบสำหรับประสบการณ์ที่มีมนตร์ ผมสร้างสิ่งที่ตัวเองตื่นเต้น ปล่อยเป็นโอเพนซอร์ส และเรียนรู้พร้อมบันทึกเส้นทางแบบเปิดเผย",
    githubActivity: "ความเคลื่อนไหวบน GitHub",
    followGithub: "ติดตาม @fancyism",
    newsletterTitle: "อยากให้อัปเดตถึงคุณเสมอ",
    newsletterBody:
      "โพสต์ใหม่ เรื่องราวระหว่างส่งงาน และลิงก์สายเนิร์ดส่งตรงถึงอีเมลของคุณ",
    newsletterMeta: "เดือนละประมาณสองครั้ง เน้นเนื้อ ๆ ไม่มีน้ำ",
    personDescription:
      "อยู่ในโหมด vibe-coding เต็มตัว ลองของใหม่บนเว็บและวิ่งไล่ไอเดียสด ๆ อยู่เสมอ",
    jobTitle: "วิศวกรซอฟต์แวร์และคนคลั่งเครื่องมือ AI",
  },
  ProductsPage: {
    title: "สินค้าดิจิทัล",
    metaDescription:
      "เครื่องมือ AI, prompt templates และ resource แบบพรีเมียมสำหรับสาย vibe-coder",
    heroTitlePrefix: "สินค้า",
    heroTitleHighlight: "ดิจิทัล",
    heroDescription:
      "ยกระดับ workflow ของคุณด้วยเทมเพลต คู่มือ และเครื่องมือที่ออกแบบมาสำหรับนักพัฒนาสาย AI-native โดยเฉพาะ",
    badgeBestseller: "ขายดี",
    badgeNew: "ใหม่",
    freePrice: "ฟรี",
    downloadNow: "ดาวน์โหลดเลย",
    getAccess: "รับสิทธิ์",
    product1Title: "คัมภีร์เขียน Prompt สำหรับ AI Coding",
    product1Description:
      "คู่มือ 50 หน้า พร้อมเทมเพลต copy-paste 20 แบบสำหรับ Claude 3.5 Sonnet และ GPT-4o ช่วยให้คุณ vibe-code ได้เหมือน senior engineer",
    product2Title: "Next.js Glassmorphism UI Kit",
    product2Description:
      "ชุดคอมโพเนนต์ React และ Tailwind เดียวกับที่ใช้สร้างบล็อกนี้จริง พร้อมแอนิเมชันและคอมโพเนนต์พรีเมียมมากกว่า 10 ชิ้น",
    product3Title: "คู่มือเซ็ตอัป Cursor + Windsurf",
    product3Description:
      "รวมไฟล์ตั้งค่าที่ผมใช้จริง กฎที่ปรับเอง และ workflow hacks สำหรับใช้ AI IDE สองตัวให้คุ้มที่สุด",
  },
  ConsultationPage: {
    title: "ปรึกษา",
    metaDescription:
      "จอง session แบบ 1-on-1 เพื่อยกระดับ AI workflow หรือวางสถาปัตยกรรม Next.js ของคุณ",
    heroTitlePrefix: "ปรึกษา",
    heroTitleHighlight: "1-on-1",
    heroDescription:
      "ติดปัญหาเรื่อง AI implementation หรืออยากได้มุมมองด้านสถาปัตยกรรมสำหรับแอป Next.js ของคุณ? มานั่ง pair program แล้วแก้ไปด้วยกัน",
    howItWorksTitle: "ขั้นตอนการทำงาน",
    step1Title: "จองเวลา",
    step1Body:
      "เลือกช่วงเวลาที่สะดวกผ่าน Calendly และชำระเงินอย่างปลอดภัยผ่าน Stripe",
    step2Title: "ส่ง context",
    step2Body:
      "ตอบคำถามสั้น ๆ ว่าคุณอยากไปให้ถึงเป้าหมายอะไร เพื่อให้ผมเตรียมตัวได้ตรงจุด",
    step3Title: "ลงมือแก้ไปด้วยกัน",
    step3Body:
      "เราจะขึ้น Google Meet แชร์หน้าจอ และไล่ปัญหาไปด้วยกันแบบเห็นภาพจริง",
    pricingBadge: "ยอดนิยม",
    pricingTitle: "วางกลยุทธ์ + Pairing",
    pricingPeriod: "/ ชั่วโมง",
    featureSession: "session โฟกัส 60 นาที",
    featureMeet: "บันทึกวิดีโอ Google Meet",
    featureNotes: "สรุป actionable หลังจบ session",
    bookCta: "จอง session",
    bookAriaLabel: "จองผ่าน Calendly",
  },
  PostPage: {
    notFound: "ไม่พบโพสต์",
    breadcrumbHome: "หน้าแรก",
    breadcrumbBlog: "บล็อก",
  },
  PostDetail: {
    backToIndex: "กลับไปที่ดัชนีโพสต์",
    readTime: "{minutes} นาทีอ่าน",
    readSuffix: "อ่าน",
    less: "ย่อ",
    shareLabel: "แชร์โพสต์นี้",
    relatedPosts: "โพสต์ที่เกี่ยวข้อง",
    moreTags: "+{count}",
  },
  SeriesNav: {
    keepReading: "อ่านต่อ",
    previous: "ก่อนหน้า",
    next: "ถัดไป",
  },
  ShareButtons: {
    share: "แชร์",
    copy: "คัดลอก",
    copyLink: "คัดลอกลิงก์",
    shared: "แชร์แล้ว",
    shareOnTwitter: "แชร์บน X",
    shareOnLinkedIn: "แชร์บน LinkedIn",
    shareOnFacebook: "แชร์บน Facebook",
    shareOnLine: "แชร์บน Line",
    tweet: "โพสต์",
    networkShare: "แชร์",
    facebook: "Facebook",
    line: "Line",
  },
  TableOfContents: {
    ariaLabel: "สารบัญของหน้านี้",
    title: "ในหน้านี้",
  },
  ViewCounter: {
    views: "{count} ครั้ง",
  },
  TagPage: {
    title: 'โพสต์ที่ติดแท็ก "{tag}"',
    description: "รวมโพสต์ทั้งหมดที่ติดแท็ก {tag}",
    backToBlog: "กลับไปที่บล็อก",
    count: "{count} โพสต์",
  },
} as const;

export default messages;
