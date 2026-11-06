import type { PropsWithChildren } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminMobileNav } from './AdminMobileNav';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';
export function AdminLayout({ children }: PropsWithChildren) {
  return <div className="role-layout role-layout--admin"><AdminSidebar /><div className="role-layout__main"><AdminTopbar /><main>{children ?? <Outlet />}</main><AdminMobileNav /></div></div>;
}
