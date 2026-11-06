
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/navigation/Sidebar";

export function VendorLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar items={[]} role="vendor" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}

