// /api/delivery/[id]/route.ts

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface UpdateDeliveryPayload {
  customerName?: string;
  phone?: string;
  addressDetails?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
}

// GET - ค้นหาข้อมูลโดยใช้ MongoDB ObjectId
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;

    // ตรวจสอบว่า id เป็น valid ObjectId หรือไม่
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ObjectId format" }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection("item_delivery");

    const delivery = await collection.findOne({ _id: new ObjectId(id) });

    if (!delivery) {
      return NextResponse.json({ error: "ไม่พบข้อมูลการจัดส่ง" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "พบข้อมูล",
        data: delivery,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("/api/delivery/[id] GET error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT - อัปเดตข้อมูลโดยใช้ MongoDB ObjectId
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;

    // ตรวจสอบว่า id เป็น valid ObjectId หรือไม่
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ObjectId format" }, { status: 400 });
    }

    const body: UpdateDeliveryPayload = await request.json();

    // ตรวจสอบว่ามีข้อมูลที่จะอัปเดตหรือไม่
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json({ error: "ไม่มีข้อมูลที่จะอัปเดต" }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection("item_delivery");

    // สร้าง update object โดยเอาเฉพาะ field ที่ส่งมา
    const updateData: UpdateDeliveryPayload = {};
    const allowedFields: (keyof UpdateDeliveryPayload)[] = [
      "customerName",
      "phone",
      "addressDetails",
      "subDistrict",
      "district",
      "province",
      "postalCode",
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // อัปเดตข้อมูล
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "ไม่พบข้อมูลที่จะอัปเดต" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "อัปเดตข้อมูลสำเร็จ",
        data: result,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("/api/delivery/[id] PUT error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
