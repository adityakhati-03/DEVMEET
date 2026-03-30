'use client';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import { ReactNode } from 'react';

// Pages where sidebar should NOT appear
const PUBLIC_PATHS = ['/', '/sign-in', '/sign-up'];

export default function SidebarWrapper({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname() || '';

  const isPublic = PUBLIC_PATHS.includes(pathname);
  const showSidebar = !!session && !isPublic;

  if (!showSidebar) return <>{children}</>;

  return (
    <div style={{ display: 'flex', minHeight: '100%' }}>
      <Sidebar />
      <div style={{ marginLeft: '68px', flex: 1, width: 'calc(100% - 68px)', overflowX: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}
