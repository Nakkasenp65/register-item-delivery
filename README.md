# Register Item Delivery

เว็บแอปพลิเคชันสำหรับลงทะเบียนจัดส่งสินค้า โดยใช้ Next.js, React, และ LINE LIFF สำหรับการ authentication และส่งข้อความ

## ฟีเจอร์หลัก

- 📱 **Responsive Design**: รองรับทั้ง desktop และ mobile
- 🔐 **LINE LIFF Integration**: เข้าสู่ระบบอัตโนมัติผ่าน LINE
- 📍 **Location Autocomplete**: ค้นหาที่อยู่แบบ real-time จากฐานข้อมูล Supabase
- 📷 **QR Code Detection**: ตรวจสอบ QR code ในสลิปโอนเงินก่อนส่งข้อมูล
- 📄 **Multi-page Form**: ฟอร์มลงทะเบียนแบบหลายหน้า พร้อม animation
- 💬 **LINE Flex Message**: ส่งข้อมูลการจัดส่งไปยังแชท LINE
- 🗄️ **MongoDB Storage**: เก็บข้อมูลการจัดส่งอย่างปลอดภัย
- ☁️ **External Image Upload**: อัปโหลดสลิปไปยัง cloud storage

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Animation**: Framer Motion
- **State Management**: React Query
- **Authentication**: LINE LIFF
- **Database**: MongoDB
- **Location Data**: Supabase
- **Image Processing**: jsQR (QR detection)
- **HTTP Client**: Axios

## การติดตั้งและรัน

### Prerequisites

- Node.js 18+
- npm หรือ yarn
- MongoDB database
- Supabase project
- LINE Developers account (สำหรับ LIFF)

### 1. Clone Repository

```bash
git clone <repository-url>
cd register-item-delivery
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

สร้างไฟล์ `.env.local` ใน root directory และใส่ค่าต่อไปนี้:

```env
# Supabase (สำหรับข้อมูลสถานที่)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# MongoDB (ฐานข้อมูลหลัก)
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=your_database_name

# External Upload API (สำหรับอัปโหลดไฟล์สลิป)
UPLOAD_IMAGE_API_URL=your_image_upload_api_endpoint

# LINE LIFF (สำหรับ authentication และส่งข้อความ)
NEXT_PUBLIC_LIFF_ID=your_line_liff_id
NEXT_PUBLIC_SERVER_OPTION=dev_or_prod
NEXT_PUBLIC_ACCESS_TOKEN=your_line_access_token_for_dev_mode
```

### 4. Run Development Server

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) ใน browser

## Environment Variables คำอธิบาย

| Variable                        | Description                              | Required      |
| ------------------------------- | ---------------------------------------- | ------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL ของ Supabase project                 | ✅            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anonymous key สำหรับเข้าถึง Supabase     | ✅            |
| `MONGODB_URI`                   | Connection string ของ MongoDB            | ✅            |
| `MONGODB_DB`                    | ชื่อ database ใน MongoDB                 | ✅            |
| `UPLOAD_IMAGE_API_URL`          | Endpoint ของ API สำหรับอัปโหลดไฟล์รูปภาพ | ✅            |
| `NEXT_PUBLIC_LIFF_ID`           | LIFF ID จาก LINE Developers Console      | ✅            |
| `NEXT_PUBLIC_SERVER_OPTION`     | `"dev"` หรือ `"prod"`                    | ✅            |
| `NEXT_PUBLIC_ACCESS_TOKEN`      | Access token สำหรับ LINE API (dev mode)  | ❌ (dev only) |

## โครงสร้างโปรเจค

```
register-item-delivery/
├── app/
│   ├── api/
│   │   ├── delivery/
│   │   │   └── route.ts          # API สำหรับบันทึกข้อมูลจัดส่ง
│   │   └── find/
│   │       └── route.ts          # API สำหรับค้นหาข้อมูล
│   ├── confirm/
│   │   └── page.tsx              # หน้าแสดงข้อมูลการจัดส่ง
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # หน้าแรก (redirect ไป DeliveryPage)
├── components/
│   ├── providers/
│   │   ├── LiffProvider.tsx      # LINE LIFF context provider
│   │   └── Provider.tsx          # React Query provider
│   ├── ui/                       # shadcn/ui components
│   └── (delivery)/
│       ├── DeliveryPage.tsx      # ฟอร์มลงทะเบียนหลัก
│       └── SlipSection.tsx       # คอมโพเนนต์อัปโหลดสลิป
├── hooks/
│   ├── useDeliveryData.ts        # Hook สำหรับดึงข้อมูลจัดส่ง
│   └── useLocationSuggestion.ts  # Hook สำหรับค้นหาที่อยู่
├── lib/
│   ├── mongodb.ts                # MongoDB connection
│   ├── supabase.ts               # Supabase client
│   └── uploadSlip.ts             # Service สำหรับอัปโหลดไฟล์
└── ...
```

## API Endpoints

### POST /api/delivery

บันทึกข้อมูลการจัดส่งและอัปโหลดสลิป

**Request**: FormData ประกอบด้วย

- `file`: ไฟล์รูปภาพสลิป
- `data`: JSON string ของข้อมูลจัดส่ง

**Response**:

```json
{
  "insertedId": "mongodb_object_id",
  "slipUrl": "uploaded_image_url"
}
```

### GET /api/find

ค้นหาข้อมูลการจัดส่ง

**Query Parameters**:

- `line_user_id`: LINE user ID
- `phone`: เบอร์โทรศัพท์

**Response**:

```json
{
  "message": "พบข้อมูล",
  "count": 1,
  "data": [...]
}
```

## การใช้งาน

1. **เข้าสู่ระบบ**: เปิดแอปผ่าน LINE LIFF
2. **กรอกข้อมูล**: ใส่ชื่อ เบอร์โทร และที่อยู่ (มี autocomplete)
3. **อัปโหลดสลิป**: เลือกไฟล์รูปภาพและตรวจสอบ QR code อัตโนมัติ
4. **ส่งข้อมูล**: บันทึกข้อมูลและอัปโหลดไฟล์
5. **ยืนยัน**: ดูข้อมูลที่บันทึกและส่งไปยังแชท LINE

## การ Deploy

### Vercel (แนะนำ)

1. Push code ไป GitHub
2. Connect repository กับ Vercel
3. เพิ่ม Environment Variables ใน Vercel dashboard
4. Deploy

### Manual Deploy

```bash
npm run build
npm start
```

## การพัฒนาเพิ่มเติม

- เพิ่ม unit tests ด้วย Jest
- เพิ่ม end-to-end tests ด้วย Playwright
- เพิ่ม monitoring และ logging
- เพิ่ม caching layer สำหรับ performance

## License

MIT License

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request
