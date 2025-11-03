// /api/delivery/route.ts

import { NextResponse } from "next/server";
import getDb from "../../../lib/mongodb";
import { uploadSlip } from "../../../lib/uploadSlip";

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
  createdAt: Date;
  status: string;
}

export async function POST(request: Request) {
  try {
    // 2. รับ FormData จาก Client
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const dataString = formData.get("data") as string | null;

    if (!file || !dataString) {
      return NextResponse.json({ error: "กรุณาส่ง 'file' และ 'data'" }, { status: 400 });
    }

    // 3. Parse ข้อมูล JSON (body)
    const body = JSON.parse(dataString);
    console.log(body);

    // 4. ดึง identifier (เช่น userId) ออกมาจาก body
    // (ต้องแน่ใจว่าใน body ที่ส่งมามี 'userId' หรือ 'identifier' อะไรสักอย่าง)

    // **สมมติว่าชื่อ 'userId'**
    const identifier = body.line_user_id;
    if (!identifier) {
      return NextResponse.json({ error: "Missing identifier (line_user_id) in data body" }, { status: 400 });
    }

    // 5. แปลง File (Web API) เป็น Buffer ที่ uploadSlip ต้องการ
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log(buffer);

    // 6. เรียกใช้ Service อัปโหลด
    // (ส่ง object ให้ตรงกับที่ uploadSlip ต้องการ)
    const uploadedFileData = await uploadSlip(
      {
        buffer: buffer,
        originalname: file.name,
        mimetype: file.type,
      },
      identifier
    );

    // 7. (สำคัญ) เอา URL ที่ได้จาก GDrive (uploadedFileData.url) มาใช้
    // แทนการใช้ URL /uploads/ แบบเดิม
    const db = await getDb();
    const collection = db.collection("item_delivery");

    const toInsert = {
      ...body,
      // เก็บข้อมูลไฟล์จาก GDrive (fileId, url, etc.)
      slipImageUrl: uploadedFileData.url,
      createdAt: new Date(),
    } as DeliveryPayload;

    console.log("Payload: ", toInsert);

    const result = await collection.insertOne(toInsert);

    // 8. ตอบกลับ Client ว่าสำเร็จ พร้อม URL จาก GDrive
    return NextResponse.json(
      {
        insertedId: result.insertedId,
        slipUrl: uploadedFileData.url,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("/api/delivery POST error:", err);
    // (ถ้า err มาจาก uploadSlip มันจะเป็น ApiError ที่เราสร้างไว้)
    if ((err as any).statusCode === 400) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
