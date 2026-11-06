import type { PropsWithChildren } from 'react';
import { Outlet } from 'react-router-dom';
import { FamilyMobileNav } from './FamilyMobileNav';
import { FamilySidebar } from './FamilySidebar';
import { FamilyTopbar } from './FamilyTopbar';
export function FamilyLayout({ children, title }: PropsWithChildren<{ title?: string }>) {
  return <div className="role-layout role-layout--family"><FamilySidebar /><div className="role-layout__main"><FamilyTopbar title={title} /><main>{children ?? <Outlet />}</main><FamilyMobileNav /></div></div>;
}
