import DeliveryPage from "@/components/(delivery)/DeliveryPage"; // (แนะนำ) ใช้ path alias
// หรือใช้ relative path: import DeliveryPage from "../components/DeliveryPage";

export default function Home() {
  return (
    <main className="min-h-screen">
      <DeliveryPage />
    </main>
  );
}
