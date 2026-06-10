import ShopSidebar from "@/components/ShopSidebar";

export default function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-surface-container-low">
      <ShopSidebar />
      <div className="flex-1 flex flex-col min-w-0 pt-14 lg:pt-0 overflow-auto">
        {children}
      </div>
    </div>
  );
}
