export interface NavItem {
  title: string;
  href: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface DesktopSidebarProps {
  pathname: string;
}

export interface SidebarNavContentProps {
  pathname: string;
  onNavigate?: () => void;
}

export interface SidebarSectionProps {
  section: NavSection;
  pathname: string;
  onNavigate?: () => void;
}

export interface SidebarNavItemProps {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}
