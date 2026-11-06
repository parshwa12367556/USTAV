import type { PropsWithChildren } from 'react';
import { Outlet } from 'react-router-dom';
import { PublicFooter } from './PublicFooter';
import { PublicNavbar } from './PublicNavbar';
export function PublicLayout({ children }: PropsWithChildren) {
  return <div className="public-layout"><PublicNavbar /><main>{children ?? <Outlet />}</main><PublicFooter /></div>;
}
