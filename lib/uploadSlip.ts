// lib/uploadService.ts
// (นี่คือโค้ดของคุณ เติม imports ที่จำเป็นเข้าไป)

import axios from "axios";
import FormData from "form-data"; // <-- import จาก 'form-data'
import httpStatus from "http-status"; // (สมมติว่าคุณมี http-status)
// import { ApiError } from "@/utils/ApiError"; // (สมมติว่าคุณมี ApiError)

interface ResponseUploadData {
  message: string;
  data: {
    fileId: string;
    fileName: string;
    url: string;
  };
}

// --- ถ้าไม่มี ApiError หรือ httpStatus ก็ใช้ Error ธรรมดาได้ครับ ---
// (ตัวอย่างแบบง่าย)
class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

// FileObject Interface (ควรประกาศไว้)
interface IFileObject {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

export const uploadSlip = async (fileObject: IFileObject, identifier: string) => {
  const uploadApiUrl = process.env.UPLOAD_IMAGE_API_URL;

  // 1. ตรวจสอบว่ามีไฟล์และ buffer อยู่จริง
  if (!fileObject || !fileObject.buffer) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No file buffer provided for upload.");
  }

  // 2. สร้าง instance ของ FormData จาก library
  const formData = new FormData();

  // 3. (สำคัญมาก) Append Buffer ของไฟล์เข้าไป
  formData.append("myFile", fileObject.buffer, {
    filename: fileObject.originalname,
    contentType: fileObject.mimetype,
  });

  // 4. Append userId เข้าไปตามปกติ
  formData.append("userId", identifier); // 'identifier' คือ userId ที่ส่งมา

  try {
    if (!uploadApiUrl) {
      throw new Error("UPLOAD_IMAGE_API_URL is not defined in .env");
    }

    console.log(`Uploading slip for identifier: ${identifier} to ${uploadApiUrl}`);

    // 5. ส่ง Request ด้วย axios พร้อมกับ Header ที่ถูกต้อง
    const { data } = await axios.post<ResponseUploadData>(uploadApiUrl, formData, {
      headers: {
        ...formData.getHeaders(), // <-- ใช้ getHeaders() จาก 'form-data'
      },
    });

    // 6. ตรวจสอบ Response
    if (!data.data || !data.data.url) {
      throw new Error("Invalid response format from image upload service");
    }

    // คืนค่าเฉพาะส่วน data ที่มี fileId, fileName, url
    return data.data; // (เช่น { fileId: '...', fileName: '...', url: '...' })
  } catch (error: any) {
    console.error("Error uploading slip:", error.response?.data || error.message);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Could not upload slip image.");
  }
};
