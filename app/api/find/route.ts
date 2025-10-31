// /api/delivery/find/route.ts

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get("line_user_id");
    const phone = searchParams.get("phone");

    // ต้องส่งอย่างน้อย 1 parameter
    if (!lineUserId && !phone) {
      return NextResponse.json({ error: "กรุณาส่ง line_user_id หรือ phone ใน query parameter" }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection("item_delivery");

    // สร้าง query filter
    interface QueryFilter {
      line_user_id?: string;
      phone?: string;
      $or?: Array<{ line_user_id?: string; phone?: string }>;
    }

    let query: QueryFilter = {};

    // ค้นหาข้อมูล - ใช้ $or ถ้ามีทั้ง 2 parameters
    if (lineUserId && phone) {
      query = { $or: [{ line_user_id: lineUserId }, { phone }] };
    } else if (lineUserId) {
      query = { line_user_id: lineUserId };
    } else if (phone) {
      query = { phone };
    }

    const results = await collection.find(query).sort({ createdAt: -1 }).toArray();

    if (results.length === 0) {
      return NextResponse.json({ message: "ไม่พบข้อมูล", data: [] }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "พบข้อมูล",
        count: results.length,
        data: results,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("/api/delivery/find GET error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { line_user_id, phone } = body;

    // ต้องส่งอย่างน้อย 1 parameter
    if (!line_user_id && !phone) {
      return NextResponse.json({ error: "กรุณาส่ง line_user_id หรือ phone" }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection("item-delivery");

    // สร้าง query filter
    interface QueryFilter {
      line_user_id?: string;
      phone?: string;
      $or?: Array<{ line_user_id?: string; phone?: string }>;
    }

    let query: QueryFilter = {};

    // ค้นหาข้อมูล - ใช้ $or ถ้ามีทั้ง 2 parameters
    if (line_user_id && phone) {
      query = { $or: [{ line_user_id: line_user_id }, { phone: phone }] };
    } else if (line_user_id) {
      query = { line_user_id: line_user_id };
    } else if (phone) {
      query = { phone: phone };
    }

    const results = await collection.find(query).toArray();

    if (results.length === 0) {
      return NextResponse.json({ message: "ไม่พบข้อมูล", data: [] }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "พบข้อมูล",
        count: results.length,
        data: results,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("/api/delivery/find POST error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
