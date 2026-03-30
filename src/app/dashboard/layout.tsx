// Dashboard layout — sidebar is now handled globally by SidebarWrapper in root layout.
// This file just passes children through cleanly.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
