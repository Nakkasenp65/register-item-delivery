"use client";

import { ChevronDown, Copy, File, ImageIcon, Paperclip, Upload, X, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import jsQR from "jsqr";

interface SlipSectionProps {
  setAttachment: (file: File | null) => void;
  setPreviewUrl: (url: string | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  attachment: File | null;
  previewUrl: string | null;
  isLoading?: boolean;
}

export default function SlipSection({
  setAttachment,
  setPreviewUrl,
  fileInputRef,
  attachment,
  previewUrl,
  isLoading = false,
}: SlipSectionProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [qrWarning, setQrWarning] = useState(false);

  const detectQRCode = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new window.Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        if (imageData) {
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          resolve(!!code);
        } else {
          resolve(false);
        }
      };

      img.onerror = () => resolve(false);
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAttachment(file);

    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // ตรวจสอบ QR code
      const hasQR = await detectQRCode(file);
      setQrWarning(!hasQR);
    } else {
      setPreviewUrl(null);
      setQrWarning(false); // PDF ไม่ต้องตรวจสอบ QR
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/") || file.type === "application/pdf") {
        setAttachment(file);
        if (file.type.startsWith("image/")) {
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);

          // ตรวจสอบ QR code
          const hasQR = await detectQRCode(file);
          setQrWarning(!hasQR);
        } else {
          setPreviewUrl(null);
          setQrWarning(false); // PDF ไม่ต้องตรวจสอบ QR
        }
        // Update the file input
        if (fileInputRef.current) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInputRef.current.files = dataTransfer.files;
        }
      }
    }
  };

  const handleRemoveFile = () => {
    setAttachment(null);
    setPreviewUrl(null);
    setQrWarning(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText("209-3-12208-1");
  };

  {
    /* ========== Section: File Attachment ========== */
  }
  return (
    <section>
      <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2 flex items-center gap-3">
        <Paperclip className="w-6 h-6 text-purple-600" />
        สลิปโอนเงินเพื่อยืนยัน
      </h2>

      <div className="mt-4 bg-linear-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500 rounded-lg p-4 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-orange-100">
              <span className="inline-block w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-orange-900 text-xl mb-1">ค่าจัดส่ง</h3>
            <p className="text-sm text-orange-800 leading-relaxed">
              โอนค่าจัดส่ง <span className="font-bold text-orange-900">100 บาท</span> ไปยังบัญชีที่ระบุ
              และแนบหลักฐานสลิปการโอนเงิน
            </p>
          </div>
        </div>
      </div>

      {/* Bank Transfer Information */}
      <div className="py-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
            <Image
              src="https://lh3.googleusercontent.com/d/1fHHAJhVwsAsMaoVcTv8pJhxYGJbDrz0Z"
              alt="KBank"
              width={40}
              height={40}
            />
            <div>
              <h3 className="font-bold text-gray-800">ธนาคารกสิกรไทย</h3>
              <p className="text-sm text-gray-700">ชื่อบัญชี: นัมเบอร์วันมันนี่</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-gray-100 p-2">
            <span className="text-bg-dark font-bold tracking-wider">209-3-12208-1</span>
            <button
              type="button"
              onClick={handleCopy}
              className="bg-primary-pink flex items-center gap-1 rounded-lg px-2 py-2 text-xs text-black transition hover:text-white hover:bg-pink-700"
            >
              <Copy className="w-3 h-3" />
              คัดลอก
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 flex w-full items-center justify-center gap-2 text-sm font-semibold text-gray-600"
        >
          <ChevronDown className={`transform transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
          <span>แสดงขั้นตอน</span>
        </button>

        {isExpanded && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            <ol className="list-inside list-decimal space-y-2 pl-2">
              <li>เปิดแอปพลิเคชันธนาคาร</li>
              <li>เลือกเมนู &quot;โอนเงิน&quot;</li>
              <li>เลือกธนาคารปลายทาง &quot;กสิกรไทย&quot;</li>
              <li>กรอกเลขที่บัญชี: 209-3-12208-1</li>
              <li>ระบุจำนวนเงินตามที่แจ้ง</li>
              <li>ตรวจสอบข้อมูลผู้รับ และยืนยันการโอน</li>
              <li>บันทึกสลิปการโอนเงิน</li>
              <li>กลับมาที่หน้านี้เพื่อแนบหลักฐาน</li>
            </ol>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          id="attachment"
          name="attachment"
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Upload Area */}
        {!attachment ? (
          <div
            onClick={handleClickUpload}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
                      relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                      transition-all duration-300 ease-in-out
                      ${
                        isDragOver
                          ? "border-blue-400 bg-blue-50 scale-105"
                          : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                      }
                    `}
          >
            <div className="flex flex-col items-center space-y-4">
              <div
                className={`
                        p-4 rounded-full transition-colors duration-300
                        ${isDragOver ? "bg-blue-100" : "bg-gray-100"}
                      `}
              >
                <Upload
                  className={`
                          w-8 h-8 transition-colors duration-300
                          ${isDragOver ? "text-blue-500" : "text-gray-500"}
                        `}
                />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-700 mb-1">อัปโหลดไฟล์ที่นี่</p>
                <p className="text-sm text-gray-500">ลากไฟล์มาวาง หรือ คลิกเพื่อเลือกไฟล์</p>
                <p className="text-xs text-gray-400 mt-2">รองรับ: รูปภาพ (JPG, PNG, GIF) หรือ PDF</p>
              </div>
            </div>
          </div>
        ) : (
          /* File Preview */
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-start space-x-4">
              {/* File Icon */}
              <div className="shrink-0">
                {previewUrl ? (
                  <div className="relative">
                    <ImageIcon className="w-12 h-12 text-blue-500" />
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                      <File className="w-3 h-3 text-white" />
                    </div>
                  </div>
                ) : (
                  <File className="w-12 h-12 text-red-500" />
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{attachment.name}</p>
                <p className="text-xs text-gray-500">
                  {(attachment.size / 1024 / 1024).toFixed(2)} MB • {attachment.type || "Unknown type"}
                </p>
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={handleRemoveFile}
                className="shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                title="ลบไฟล์"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image Preview */}
            {previewUrl && (
              <div className="mt-4">
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-xs max-h-32 rounded-lg shadow-sm border border-gray-200 object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1">
                    <ImageIcon className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            )}

            {/* QR Warning */}
            {qrWarning && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span className="text-sm">กรุณาอัปโหลดภาพสลิปที่ถูกต้อง</span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
