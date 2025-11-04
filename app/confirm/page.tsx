"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLiff } from "@/components/providers/LiffProvider";
import useDeliveryData from "@/hooks/useDeliveryData";
import {
  Loader2,
  Package,
  User,
  MapPin,
  MapPinned,
  Phone,
  Calendar,
  Image as ImageIcon,
  Send,
  Edit,
  Clock,
  CheckCircle2,
  Truck,
} from "lucide-react";
import { EditAddressModal } from "@/components/EditAddressModal";
import { motion } from "framer-motion";
import Image from "next/image";
import liff from "@line/liff";

const ConfirmPageContent: React.FC = () => {
  const { lineUserId } = useLiff();
  const { data, isLoading, isError, error } = useDeliveryData(lineUserId);
  console.log(data);
  const [isSending, setIsSending] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Package className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">ไม่พบข้อมูล</h2>
            <p className="text-gray-600 text-center">
              {error instanceof Error ? error.message : "ไม่พบข้อมูลการจัดส่งของคุณในระบบ"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <Package className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">ไม่พบข้อมูล</h2>
            <p className="text-gray-600 text-center">ยังไม่มีข้อมูลการจัดส่งของคุณในระบบ</p>
          </div>
        </div>
      </div>
    );
  }

  // แสดงข้อมูลล่าสุด (first item)
  const delivery = data.data[0];

  const sendFlexMessage = async () => {
    setIsSending(true);
    try {
      // สร้าง address/location box ตาม locationType
      const locationBox =
        delivery.locationType === "home"
          ? {
              type: "box" as const,
              layout: "baseline" as const,
              contents: [
                {
                  type: "text" as const,
                  text: "ที่อยู่:",
                  color: "#aaaaaa",
                  size: "sm" as const,
                  flex: 1,
                },
                {
                  type: "text" as const,
                  text: `${delivery.addressDetails || ""}, ${delivery.subDistrict || ""}, ${delivery.district || ""}, ${
                    delivery.province || ""
                  } ${delivery.postalCode || ""}`.trim(),
                  wrap: true,
                  color: "#666666",
                  size: "sm" as const,
                  flex: 5,
                },
              ],
            }
          : {
              type: "box" as const,
              layout: "baseline" as const,
              contents: [
                {
                  type: "text" as const,
                  text: "รับที่:",
                  color: "#aaaaaa",
                  size: "sm" as const,
                  flex: 1,
                },
                {
                  type: "text" as const,
                  text: "ร้าน OK Mobile (15 ธ.ค. 68 เป็นต้นไป)",
                  wrap: true,
                  color: "#666666",
                  size: "sm" as const,
                  flex: 5,
                },
              ],
            };

      const flexMessage = {
        type: "flex" as const,
        altText: "ข้อมูลการจัดส่ง",
        contents: {
          type: "bubble" as const,
          body: {
            type: "box" as const,
            layout: "vertical" as const,
            contents: [
              {
                type: "text" as const,
                text: "📦 ข้อมูลการจัดส่ง",
                weight: "bold" as const,
                size: "lg" as const,
                color: "#1e40af",
              },
              {
                type: "box" as const,
                layout: "vertical" as const,
                margin: "md" as const,
                spacing: "sm" as const,
                contents: [
                  {
                    type: "box" as const,
                    layout: "baseline" as const,
                    contents: [
                      {
                        type: "text" as const,
                        text: "รหัส:",
                        color: "#aaaaaa",
                        size: "sm" as const,
                        flex: 1,
                      },
                      {
                        type: "text" as const,
                        text: delivery.trackingId || "N/A",
                        wrap: true,
                        color: "#1e40af",
                        size: "sm" as const,
                        flex: 5,
                        weight: "bold" as const,
                      },
                    ],
                  },
                  {
                    type: "box" as const,
                    layout: "baseline" as const,
                    contents: [
                      {
                        type: "text" as const,
                        text: "ชื่อ:",
                        color: "#aaaaaa",
                        size: "sm" as const,
                        flex: 1,
                      },
                      {
                        type: "text" as const,
                        text: delivery.customerName,
                        wrap: true,
                        color: "#666666",
                        size: "sm" as const,
                        flex: 5,
                      },
                    ],
                  },
                  {
                    type: "box" as const,
                    layout: "baseline" as const,
                    contents: [
                      {
                        type: "text" as const,
                        text: "เบอร์:",
                        color: "#aaaaaa",
                        size: "sm" as const,
                        flex: 1,
                      },
                      {
                        type: "text" as const,
                        text: delivery.phone,
                        wrap: true,
                        color: "#666666",
                        size: "sm" as const,
                        flex: 5,
                      },
                    ],
                  },
                  locationBox,
                  {
                    type: "box" as const,
                    layout: "baseline" as const,
                    contents: [
                      {
                        type: "text" as const,
                        text: "วันที่:",
                        color: "#aaaaaa",
                        size: "sm" as const,
                        flex: 1,
                      },
                      {
                        type: "text" as const,
                        text: new Date(delivery.createdAt).toLocaleDateString("th-TH"),
                        wrap: true,
                        color: "#666666",
                        size: "sm" as const,
                        flex: 5,
                      },
                    ],
                  },
                ],
              },
            ],
          },
          footer: {
            type: "box" as const,
            layout: "vertical" as const,
            spacing: "sm" as const,
            contents: [
              {
                type: "button" as const,
                style: "primary" as const,
                height: "sm" as const,
                action: {
                  type: "uri" as const,
                  label: "ดูข้อมูลการจัดส่ง",
                  uri: "https://liff.line.me/2007338329-1LxVpq5O/confirm",
                },
              },
            ],
          },
        },
      };
      await liff.sendMessages([flexMessage]);
      alert("ส่งข้อมูลไปยังแชทเรียบร้อยแล้ว");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("เกิดข้อผิดพลาดในการส่งข้อมูล");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white sm:py-10 ">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto"
      >
        <div className="bg-white overflow-hidden sm:shadow-lg sm:rounded-lg">
          {/* Header */}
          <div className=" bg-linear-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-8 h-8" />
              <h1 className="text-2xl font-bold">ข้อมูลการจัดส่ง</h1>
            </div>
            <p className="text-blue-100 text-sm">รายละเอียดข้อมูลการจัดส่งของคุณ</p>
          </div>

          <div className="p-6 space-y-6">
            {/* แจ้งเตือนการจัดส่ง */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-linear-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 rounded-lg p-5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h3 className="text-md font-bold text-orange-900 mb-2">📦 แจ้งเตือนสำคัญ - ส่งคืนกล่องสินค้า</h3>
                  <div className="text-sm text-orange-800 space-y-2">
                    <p className="leading-relaxed">
                      ลงทะเบียนส่งคืนกล่องสินค้า เนื่องจากร้านค้ากำลังอยู่ในระหว่างการรีโนเวท{" "}
                      <b>
                        <u>ตั้งแต่วันที่ 1 พฤศจิกายน - 12 ธันวาคม 2568</u>
                      </b>
                    </p>

                    <p className="leading-relaxed">
                      ทางร้านจะเริ่มดำเนินการจัดส่งสินค้าในวันที่{" "}
                      <span className="font-semibold text-orange-900">15 ธันวาคม 2568 เป็นต้นไป</span>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Tracking ID Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="bg-linear-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-blue-100 mb-1">รหัสอ้างอิง (Tracking ID)</p>
                    <p className="text-2xl font-bold ">{delivery.trackingId || "N/A"}</p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* สถานะการจัดส่ง / ข้อมูลรับสินค้า - Modern Design */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
              className="relative overflow-hidden"
            >
              {delivery.locationType === "store" ? (
                <div className="relative bg-white border border-indigo-200 rounded-2xl shadow-lg overflow-hidden">
                  {/* Gradient Background Overlay */}
                  <div className="absolute inset-0 bg-linear-to-br from-indigo-50 via-blue-50 to-indigo-100 opacity-60"></div>

                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400 rounded-full blur-2xl opacity-20 -ml-12 -mb-12"></div>

                  <div className="relative p-6">
                    <div className="flex items-start gap-5">
                      {/* Content Section */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* Icon Section */}
                          <div className="shrink-0">
                            <div className="relative">
                              <div className="w-16 h-16 bg-linear-to-br from-indigo-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-6 transition-transform">
                                <MapPinned className="w-8 h-8 text-white animate-pulse" />
                              </div>
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full animate-ping opacity-75"></div>
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full"></div>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900">ร้าน OK Mobile</h3>
                            <p className="text-sm text-gray-600 mt-1">รับสินค้าได้ตั้งแต่ 15 ธันวาคม 2568</p>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          <div className="flex justify-center items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border-2 border-indigo-200/50">
                            <div>
                              <p className="text-base text-black font-bold">
                                <a
                                  href="https://www.google.com/maps/place/OK+Mobile+Shop+%E0%B8%AA%E0%B8%B2%E0%B8%82%E0%B8%B2+%E0%B8%AB%E0%B9%89%E0%B8%B2%E0%B8%87%E0%B9%80%E0%B8%8B%E0%B9%87%E0%B8%99%E0%B9%80%E0%B8%95%E0%B8%AD%E0%B8%A3%E0%B9%8C%E0%B8%A7%E0%B8%B1%E0%B8%99/@13.7639334,100.5391967,21z/data=!4m6!3m5!1s0x30e29fcf8d4ea5a5:0x23cc79f7dccc9f87!8m2!3d13.7638505!4d100.5393062!16s%2Fg%2F11gy9m3fcg?entry=ttu&g_ep=EgoyMDI1MTAyOS4yIKXMDSoASAFQAw%3D%3D"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  กดที่นี่เพื่อเปิด Google Map
                                </a>
                              </p>
                            </div>
                            <div className="p-1 border bg-gray-100 rounded-lg flex items-center justify-center">
                              <MapPinned className="w-8 h-8 text-blue-600" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : delivery.status === "pending" ? (
                <div className="relative bg-white border border-amber-200 rounded-2xl shadow-lg overflow-hidden">
                  {/* Gradient Background Overlay */}
                  <div className="absolute inset-0 bg-linear-to-br from-amber-50 via-orange-50 to-amber-100 opacity-60"></div>

                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-400 rounded-full blur-2xl opacity-20 -ml-12 -mb-12"></div>

                  <div className="relative p-6">
                    <div className="flex items-start gap-5">
                      {/* Content Section */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* Icon Section */}
                          <div className="shrink-0">
                            <div className="relative">
                              <div className="w-16 h-16 bg-linear-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-6 transition-transform">
                                <Clock className="w-8 h-8 text-white animate-pulse" />
                              </div>
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full animate-ping opacity-75"></div>
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full"></div>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900">รอดำเนินการจัดส่ง</h3>
                            <span className="inline-flex items-center px-3 py-1 bg-linear-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-md">
                              <span className="w-1.5 h-1.5 bg-white rounded-full mr-2 animate-pulse"></span>
                              รอจัดส่ง
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          <div className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-amber-200/50">
                            <div className="shrink-0 w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                              <Package className="w-4 h-4 text-amber-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                บันทึกเรียบร้อยแล้ว{" "}
                                <span className="text-orange-600 font-bold">เริ่มจัดส่งตั้งแต่ 15 ธันวาคม 2568</span>{" "}
                                เป็นต้นไป
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative bg-white border border-green-200 rounded-2xl shadow-lg overflow-hidden">
                  {/* Gradient Background Overlay */}
                  <div className="absolute inset-0 bg-linear-to-br from-green-50 via-emerald-50 to-teal-100 opacity-60"></div>

                  <div className="relative p-6">
                    <div className="flex items-start gap-5">
                      {/* Icon Section */}

                      {/* Content Section */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="shrink-0">
                            <div className="relative">
                              <div className="w-16 h-16 bg-linear-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform">
                                <CheckCircle2 className="w-8 h-8 text-white" />
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900">จัดส่งเรียบร้อยแล้ว</h3>
                            <span className="inline-flex items-center px-2 py-1 bg-linear-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full shadow-md">
                              <CheckCircle2 className="w-3 h-3 mr-1.5" />
                              กำลังจัดส่ง
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          <div className="flex items-start gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-green-200/50">
                            <div className="shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <Truck className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">สินค้าอยู่ในการจัดส่ง</p>
                              <p className="text-xs text-gray-600 mt-0.5">ส่งมอบสินค้าให้กับผู้จัดส่งแล้ว</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* ข้อมูลส่วนตัว */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                <User className="w-5 h-5 text-blue-600" />
                ข้อมูลส่วนตัว
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">ชื่อ-นามสกุล</p>
                  <p className="text-gray-800 font-medium">{delivery.customerName}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    เบอร์ติดต่อ
                  </p>
                  <p className="text-gray-800 font-medium">{delivery.phone}</p>
                </div>
              </div>
            </section>

            {/* ข้อมูลที่อยู่ - แสดงเฉพาะเมื่อ locationType === 'home' */}
            {delivery.locationType === "home" && (
              <section>
                <div className="flex items-center justify-between mb-4 border-b pb-2">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    ข้อมูลที่อยู่
                  </h2>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    แก้ไข
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">รายละเอียดที่อยู่</p>
                    <p className="text-gray-800">{delivery.addressDetails}</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">ตำบล/แขวง</p>
                      <p className="text-sm text-gray-800 font-medium">{delivery.subDistrict}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">อำเภอ/เขต</p>
                      <p className="text-sm text-gray-800 font-medium">{delivery.district}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">จังหวัด</p>
                      <p className="text-sm text-gray-800 font-medium">{delivery.province}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">รหัสไปรษณีย์</p>
                      <p className="text-sm text-gray-800 font-medium">{delivery.postalCode}</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* สลิปโอนเงิน */}
            {delivery.slipImageUrl && (
              <section>
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                  <ImageIcon className="w-5 h-5 text-purple-600" />
                  สลิปโอนเงิน
                </h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="relative inline-block">
                    <Image
                      src={delivery.slipImageUrl}
                      alt="สลิปโอนเงิน"
                      width={300}
                      height={400}
                      className="rounded-lg shadow-md object-cover"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* วันที่บันทึก */}
            <section>
              <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">วันที่บันทึกข้อมูล</p>
                  <p className="text-gray-800 font-medium">
                    {new Date(delivery.createdAt).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </section>

            {/* ID อ้างอิง */}
            <section>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">รหัสอ้างอิง</p>
                <p className="text-sm text-gray-600 font-mono break-all">{delivery._id}</p>
              </div>
            </section>

            {/* ปุ่มส่งข้อมูลไปยังแชท */}
            <section>
              <button
                onClick={sendFlexMessage}
                disabled={isSending}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                <span>{isSending ? "กำลังส่ง..." : "ส่งข้อมูลไปยังแชท"}</span>
              </button>
            </section>
          </div>
        </div>
      </motion.div>

      {/* Edit Address Modal - แสดงเฉพาะเมื่อ locationType === 'home' */}
      {delivery.locationType === "home" && (
        <EditAddressModal
          open={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          deliveryId={delivery._id}
          initialData={{
            postalCode: delivery.postalCode || "",
            province: delivery.province || "",
            district: delivery.district || "",
            subDistrict: delivery.subDistrict || "",
            addressDetails: delivery.addressDetails || "",
          }}
        />
      )}
    </div>
  );
};

export default function ConfirmPage() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ConfirmPageContent />
    </QueryClientProvider>
  );
}
