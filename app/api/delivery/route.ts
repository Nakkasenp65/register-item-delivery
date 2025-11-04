// /api/delivery/route.ts

import { NextResponse } from "next/server";
import getDb from "../../../lib/mongodb";
import { uploadSlip } from "../../../lib/uploadSlip";
import crypto from "crypto";

/**
 * ฟังก์ชันสำหรับสร้าง Tracking ID ที่ไม่ซ้ำกันในรูปแบบ RET-XXXXXXXX
 * @returns {string} Tracking ID เช่น "RET-A8C1B7F2"
 */
function generateTrackingId(): string {
  const prefix = "RET-";

  // 1. สร้างข้อมูลสุ่มขนาด 4 bytes (จะแปลงได้เป็น 8 hex characters)
  const randomBytes = crypto.randomBytes(4);

  // 2. แปลงเป็น string เลขฐาน 16 และทำให้เป็นตัวพิมพ์ใหญ่
  const hexString = randomBytes.toString("hex").toUpperCase();

  // 3. นำมารวมกันแล้วส่งค่ากลับ
  return `${prefix}${hexString}`;
}

interface DeliveryPayload {
  customerName: string;
  line_user_id: string;
  phone: string;
  addressDetails: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
  slipImageUrl: string;
  trackingId: string;
  createdAt: Date;
  status: string;
}

export async function POST(request: Request) {
  try {
    // 2. รับ FormData จาก Client
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const dataString = formData.get("data") as string | null;

    if (!dataString) {
      return NextResponse.json({ error: "กรุณาส่ง 'data'" }, { status: 400 });
    }

    // 3. Parse ข้อมูล JSON (body)
    const body = JSON.parse(dataString);
    console.log(body);

    // 4. ดึง identifier (เช่น userId) ออกมาจาก body
    const identifier = body.line_user_id;
    if (!identifier) {
      return NextResponse.json({ error: "Missing identifier (line_user_id) in data body" }, { status: 400 });
    }

    // 5. ตรวจสอบว่าเป็นการรับที่หน้าร้านหรือส่งถึงบ้าน
    const locationType = body.locationType;
    let slipImageUrl = "";

    // 6. ถ้าเป็นการส่งถึงบ้าน (home) ต้องมีไฟล์สลิป
    if (locationType === "home") {
      if (!file) {
        return NextResponse.json({ error: "กรุณาส่งสลิปการโอนเงินสำหรับการส่งถึงบ้าน" }, { status: 400 });
      }

      // แปลง File (Web API) เป็น Buffer ที่ uploadSlip ต้องการ
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      console.log(buffer);

      // เรียกใช้ Service อัปโหลด
      const uploadedFileData = await uploadSlip(
        {
          buffer: buffer,
          originalname: file.name,
          mimetype: file.type,
        },
        identifier
      );

      slipImageUrl = uploadedFileData.url;
    }

    // 7. บันทึกข้อมูลลง MongoDB
    const db = await getDb();
    const collection = db.collection("item_delivery");

    // Generate tracking ID แบบไม่ซ้ำกันในรูปแบบ RET-XXXXXXXX
    const trackingId = generateTrackingId();

    const toInsert = {
      ...body,
      // เก็บข้อมูลไฟล์จาก GDrive (ถ้ามี)
      slipImageUrl: slipImageUrl || null,
      trackingId: trackingId,
      createdAt: new Date(),
    } as DeliveryPayload;

    console.log("Payload: ", toInsert);
    console.log("Generated Tracking ID: ", trackingId);

    const result = await collection.insertOne(toInsert);

    // 8. ตอบกลับ Client ว่าสำเร็จ
    return NextResponse.json(
      {
        insertedId: result.insertedId,
        slipUrl: slipImageUrl || null,
        trackingId: trackingId,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("/api/delivery POST error:", err);
    // (ถ้า err มาจาก uploadSlip มันจะเป็น ApiError ที่เราสร้างไว้)
    if (err && typeof err === "object" && "statusCode" in err && err.statusCode === 400) {
      const errorMessage = "message" in err && typeof err.message === "string" ? err.message : "Bad Request";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
