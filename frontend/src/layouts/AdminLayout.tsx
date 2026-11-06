
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/navigation/Sidebar";

export function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar items={[]} role="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}

