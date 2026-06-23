export type DashboardNavId = 'dashboard' | 'map';

export const DASHBOARD_NAV_ITEMS: Array<{
  id: DashboardNavId;
  label: string;
  icon: string;
  routeName: string;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: 'lucide:layout-dashboard', routeName: 'dashboard' },
  { id: 'map', label: 'Map', icon: 'lucide:map', routeName: 'map' },
];
