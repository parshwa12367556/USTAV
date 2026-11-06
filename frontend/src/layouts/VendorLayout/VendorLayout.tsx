import type { PropsWithChildren } from 'react';
import { Outlet } from 'react-router-dom';
import { VendorMobileNav } from './VendorMobileNav';
import { VendorSidebar } from './VendorSidebar';
import { VendorTopbar } from './VendorTopbar';
export function VendorLayout({ children, title }: PropsWithChildren<{ title?: string }>) {
  return <div className="role-layout role-layout--vendor"><VendorSidebar /><div className="role-layout__main"><VendorTopbar title={title} /><main>{children ?? <Outlet />}</main><VendorMobileNav /></div></div>;
}
