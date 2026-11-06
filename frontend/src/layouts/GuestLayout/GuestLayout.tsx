import type { PropsWithChildren } from 'react';
import { Link, Outlet } from 'react-router-dom';
export function GuestLayout({ children }: PropsWithChildren) {
  return <div className="guest-layout"><header><Link to="/" className="brand-word">utsav<span>.</span></Link></header><main>{children ?? <Outlet />}</main><footer>Made for moments that matter.</footer></div>;
}
