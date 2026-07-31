# Rubjai — เว็บบันทึกรายรับรายจ่าย

เว็บบันทึกรายรับรายจ่ายส่วนตัว ล็อกอินด้วย Google และ **แยกข้อมูลรายบุคคล** (ใครล็อกอิน เห็นเฉพาะข้อมูลตัวเอง)

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS**
- **Firebase Authentication** (Google Sign-In)
- **Firebase Firestore** (ฐานข้อมูล) — สลิป/ใบเสร็จเก็บใน Firestore (ฟรี ไม่ต้องใช้ Storage)
- ไอคอนใช้ `lucide-react` (ไม่ใช้อิโมจิ) โลโก้เป็น SVG เจนเอง
- ธีมสีชมพูพาสเทล + ขาว, รองรับ **โหมดมืด** และ **มือถือ (PWA ติดตั้งได้)**

## ฟีเจอร์

- บันทึก **รายรับ/รายจ่าย** พร้อมวันที่ หมวดหมู่ หมายเหตุ + **ยอดคงเหลือสะสม**
- **แก้ไข/ลบ** รายการ (ลบมี modal ยืนยัน)
- **ค้นหา + กรอง** ตามคำค้น/ประเภท/หมวด/บัญชี + **เลือกเดือน**
- **กราฟ**: โดนัทสัดส่วนรายจ่าย + แนวโน้ม 6 เดือน
- **Export CSV** (รองรับภาษาไทยใน Excel)
- **งบรายสัปดาห์** (จ–อา) + แนะนำใช้ได้วันละเท่าไหร่ + เตือนงบเกิน 80%/100%
- **งบต่อหมวดหมู่** (ต่อเดือน)
- **บัญชี/กระเป๋าเงินหลายอัน** (เงินสด/ธนาคาร/บัตร)
- **หมวดหมู่กำหนดเอง**
- **รายการประจำ** (recurring) — ลงอัตโนมัติทุกเดือน (เงินเดือน/ค่าเช่า)
- **แนบสลิป/ใบเสร็จ** (Firebase Storage)
- **สรุปภาษีรายปี**
- **ตั้งค่า**: โหมดมืด, สกุลเงิน (THB/USD/EUR/JPY/GBP)

---

## 1. โครงสร้างข้อมูล (Firestore)

แยกข้อมูลต่อผู้ใช้ด้วย path:

```
users/{uid}/transactions/{transactionId}
```

แต่ละเอกสาร (transaction):

| ฟิลด์         | ชนิด    | ความหมาย                                             |
| ------------- | ------- | ---------------------------------------------------- |
| `date`        | string  | วันเดือนปี (รูปแบบ `YYYY-MM-DD`)                      |
| `description` | string  | รายการ / รายละเอียด                                   |
| `type`        | string  | `income` (รายรับ) หรือ `expense` (รายจ่าย)            |
| `category`    | string  | หมวดหมู่ (ดูด้านล่าง)                                 |
| `amount`      | number  | จำนวนเงิน (บาท)                                       |
| `note`        | string  | หมายเหตุ เช่น ช่องทางการจ่ายเงิน (เงินสด/โอน/บัตร)    |
| `createdAt`   | number  | timestamp ตอนบันทึก (ใช้เรียงลำดับ)                   |

> **ยอดเงินคงเหลือ** ไม่ได้เก็บในฐานข้อมูล แต่คำนวณสะสมจากรายรับ − รายจ่าย ตามวันที่ (แสดงในตารางประวัติ)

**หมวดหมู่รายรับ (income):** `salary` รายได้ประจำ · `side` รายได้เสริม · `invest` รายได้จากการลงทุน
**หมวดหมู่รายจ่าย (expense):** `fixed` รายจ่ายคงที่ · `variable` รายจ่ายผันแปร · `saving` รายจ่ายเพื่อการออม

### งบรายสัปดาห์ (budgets)

```
users/{uid}/budgets/{weekKey}
```

- `weekKey` = วันที่ **จันทร์** ของสัปดาห์นั้น รูปแบบ `YYYY-MM-DD` (เช่น `2026-08-03`)
- เอกสาร: `{ limit: number, updatedAt: number }`
- 1 สัปดาห์ = จันทร์–อาทิตย์ รายจ่ายที่ `date` ตกในช่วงนั้นถูกรวมเป็นยอด "ใช้ไป" ของสัปดาห์
- เดือนหนึ่งมี 4–6 สัปดาห์ (รวมสัปดาห์คาบเกี่ยวเดือนก่อน/ถัดไป) — ระบบสร้างให้อัตโนมัติ

ไม่ต้องสร้าง collection เอง — ระบบสร้างเอกสารให้อัตโนมัติเมื่อบันทึก/ตั้งงบครั้งแรก

---

## 2. ตั้งค่า Firebase (ทำครั้งเดียว)

เข้า [Firebase Console](https://console.firebase.google.com/) → เลือกโปรเจกต์ **rubjai-64b74**

### 2.1 เปิด Google Sign-In
1. เมนูซ้าย **Build → Authentication → Get started**
2. แท็บ **Sign-in method → Add new provider → Google → Enable**
3. เลือก support email → **Save**

### 2.2 เปิด Firestore
1. เมนูซ้าย **Build → Firestore Database → Create database**
2. เลือก location (เช่น `asia-southeast1`) → เริ่มแบบ **Production mode**

### 2.3 วาง Security Rules
แท็บ **Rules** วางเนื้อหาจากไฟล์ [`firestore.rules`](./firestore.rules) แล้ว **Publish**
กฎนี้บังคับให้ผู้ใช้เข้าถึงได้เฉพาะข้อมูลของ `uid` ตัวเองเท่านั้น (ครอบทุก subcollection: transactions, budgets, accounts, categories, recurring, categoryBudgets)

### 2.5 สลิป/ใบเสร็จ — ไม่ต้องเปิด Storage
แนบสลิปเก็บเป็นรูปย่อ (compressed JPEG base64) ใน Firestore เลย → **ใช้ได้ฟรีบน Spark plan ไม่ต้องผูกบัตร/ไม่ต้องเปิด Storage**
รูปถูกย่อฝั่ง client (กว้างสุด ~1000px) ให้เล็กพอเก็บใน document (จำกัด ~1MB)
ไฟล์ `storage.rules` ในโปรเจกต์ไม่จำเป็นแล้ว (เก็บไว้เผื่ออยากย้ายไป Storage ภายหลัง)

### 2.4 Authorized domains (สำคัญตอน deploy)
**Authentication → Settings → Authorized domains** ต้องมี:
- `localhost` (มีให้อยู่แล้ว — ใช้ตอนรันในเครื่อง)
- โดเมนจาก Vercel เช่น `your-app.vercel.app` (เพิ่มหลัง deploy — ดูข้อ 4)

ถ้าไม่เพิ่มโดเมน จะล็อกอิน Google บนเว็บจริงไม่ได้ (`auth/unauthorized-domain`)

---

## 3. รันในเครื่อง (local)

ไฟล์ `.env.local` ใส่ค่า config ให้แล้ว (จากที่คุณให้มา)

```bash
npm install
npm run dev
```

เปิด http://localhost:3000

---

## 4. Deploy บน Vercel

### 4.1 อัปโหลดโค้ด
push โฟลเดอร์นี้ขึ้น GitHub แล้วเชื่อมกับ Vercel (Import Project) หรือใช้ Vercel CLI

### 4.2 ใส่ Environment Variables ใน Vercel
ที่ Vercel → **Project → Settings → Environment Variables** เพิ่มทั้ง 7 ตัวนี้
(ค่าเดียวกับ `.env.local` — ก็อปได้เลย):

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAkuVBlkXmxm-pg1zUC-IJUTom12C9CkyA
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=rubjai-64b74.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=rubjai-64b74
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=rubjai-64b74.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=665041235009
NEXT_PUBLIC_FIREBASE_APP_ID=1:665041235009:web:e467a70c4e1510815faac0
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-8BDF5H4K5H
```

> ค่าเหล่านี้เป็น config ฝั่ง client ของ Firebase — เปิดเผยได้ตามปกติ ความปลอดภัยจริงมาจาก Security Rules (ข้อ 2.3)

### 4.3 หลัง deploy เสร็จ — เอา URL ไปใส่ 2 ที่

Vercel จะให้ URL เช่น `https://rubjai.vercel.app` นำไปใส่:

1. **Firebase → Authentication → Settings → Authorized domains**
   เพิ่ม `rubjai.vercel.app` (เฉพาะโดเมน ไม่ต้องใส่ `https://`)

2. **Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client**
   (โปรเจกต์เดียวกับ Firebase) ปกติ Firebase จัดการให้อัตโนมัติ
   ถ้าล็อกอินไม่ผ่าน ให้เพิ่มใน **Authorized JavaScript origins**: `https://rubjai.vercel.app`

deploy ใหม่ทุกครั้งที่ได้โดเมนใหม่ (เช่น preview branch) ก็เพิ่มโดเมนนั้นด้วย

---

## โครงสร้างโปรเจกต์

```
src/
  app/
    layout.tsx           ฟอนต์ไทย + AuthProvider
    page.tsx             หน้า Landing + ปุ่มล็อกอิน Google
    dashboard/page.tsx   หน้ารายการ (ต้องล็อกอิน)
    budget/page.tsx      หน้างบรายสัปดาห์ (ต้องล็อกอิน)
    icon.svg             favicon (โลโก้)
    globals.css          ธีมชมพูพาสเทล
  components/
    Logo.tsx             โลโก้ SVG (กระเป๋าเงิน + ลูกศรเข้า/ออก)
    Navbar.tsx           แถบบน + ปุ่มออกจากระบบ
    Navbar.tsx           แถบบน + แท็บ รายการ/งบรายสัปดาห์ + ออกจากระบบ
    SummaryCards.tsx     การ์ดสรุป รายรับ/รายจ่าย/คงเหลือ
    TransactionForm.tsx  ฟอร์มเพิ่มรายการ
    TransactionList.tsx  ตารางประวัติ + ยอดคงเหลือสะสม
    CategoryBreakdown.tsx สรุปตามหมวดหมู่
    WeekBudgetCard.tsx   การ์ดงบต่อสัปดาห์ (progress + แนะนำวันละเท่าไหร่)
  lib/
    firebase.ts          init Firebase (อ่านจาก env)
    auth-context.tsx     สถานะล็อกอิน + Google sign-in/out
    transactions.ts      อ่าน/เพิ่ม/ลบ ข้อมูล Firestore (realtime)
    budgets.ts           อ่าน/ตั้งงบรายสัปดาห์ (realtime)
    week.ts              คำนวณสัปดาห์ จ–อา ของเดือน
    categories.ts        นิยามหมวดหมู่
    types.ts             TypeScript types
    format.ts            format เงินบาท/วันที่ไทย
firestore.rules          กฎความปลอดภัย (คัดลอกไปวางใน Firebase)
```
