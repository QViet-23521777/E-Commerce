import AdminSidebar from "@/components/AdminSidebar";

export default function AdminHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface-container-lowest">
      <AdminSidebar />
      <main className="flex-1 min-w-0 lg:overflow-y-auto pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
