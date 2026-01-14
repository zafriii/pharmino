"use client";

import React, { useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Button from "../shared ui/Button";
import { useOptimizedNavigation } from "@/hooks/useOptimizedNavigation";

// Optimized icon imports - only import what we need
import { 
  CiGrid42, 
  CiCircleList 
} from "react-icons/ci";
import { BsBoxSeam, BsInboxesFill } from "react-icons/bs";
import { 
  LuCreditCard, 
  LuUsersRound, 
  LuChevronDown, 
  LuChevronUp 
} from "react-icons/lu";
import { RiFileDamageFill } from "react-icons/ri";
import { GiMedicines } from "react-icons/gi";
import { MdOutlineInventory2, MdOutlineMedicalServices } from "react-icons/md";
import { FiPieChart } from "react-icons/fi";
import { HiOutlineLogout } from "react-icons/hi";
import { GoHistory } from "react-icons/go";
import { TbHttpPost } from "react-icons/tb";

interface SidebarProps {
  isOpen: boolean;
}

interface MenuItem {
  name: string;
  iconName: string;
  path: string;
  isGroup?: boolean;
  subItems?: MenuItem[]; 
}

// Icon mapping for better performance
const iconMap = {
  dashboard: CiGrid42,
  pos: TbHttpPost,
  sales: MdOutlineMedicalServices,
  payments: LuCreditCard,
  users: LuUsersRound,
  products: GiMedicines,
  purchases: BsBoxSeam,
  list: CiCircleList,
  history: GoHistory,
  inbox: BsInboxesFill,
  inventory: MdOutlineInventory2,
  damage: RiFileDamageFill,
  analytics: FiPieChart,
  chevronDown: LuChevronDown,
  chevronUp: LuChevronUp,
  logout: HiOutlineLogout,
};

// Memoized menu items - won't recreate on every render
const getMenuItems = (): MenuItem[] => [
  { name: "Dashboard", iconName: "dashboard", path: "/overview" },
  { name: "Point Of Sale (POS)", iconName: "pos", path: "/admin/sale/pos" },
  { name: "All Sales", iconName: "sales", path: "/admin/sale/all-sale" },
  { name: "Payments", iconName: "payments", path: "/admin/payments" },
  { name: "User & roles", iconName: "users", path: "/admin/hr/directory" },
  { name: "Products", iconName: "products", path: "/admin/product-management/products" },
  {
    name: "Purchases",
    iconName: "purchases",
    path: "/admin/purchase/purchase-list", 
    isGroup: true,
    subItems: [
      { name: "Purchase List", iconName: "list", path: "/admin/purchase/purchase-list" },
      { name: "Purchase History", iconName: "history", path: "/admin/purchase/purchase-history/ordered-items" },
      { name: "Received Products", iconName: "inbox", path: "/admin/purchase/received-products" },
    ],
  },
  { name: "Inventory", iconName: "inventory", path: "/admin/inventory" },
  { name: "Damage Records", iconName: "damage", path: "/admin/damage-records" },   
  { name: "Analytics", iconName: "analytics", path: "/admin/expenses" },
];

// Memoized Icon component
const Icon = React.memo<{ name: string; size?: number; className?: string }>(
  ({ name, size = 20, className = "" }) => {
    const IconComponent = iconMap[name as keyof typeof iconMap];
    return IconComponent ? <IconComponent size={size} className={className} /> : null;
  }
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { prefetch } = useOptimizedNavigation();

  // State for Order Management sub-menu
  const [isOrdersExpanded, setIsOrdersExpanded] = React.useState(false);

  // Memoized menu items
  const menuItems = useMemo(() => getMenuItems(), []);

  // Aggressive prefetching for instant navigation
  React.useEffect(() => {
    const criticalRoutes = [
      "/admin/sale/pos",
      "/admin/sale/all-sale",
    ];
    
    const importantRoutes = [
      "/overview",
      "/admin/payments",
      "/admin/product-management/products",
      "/admin/inventory"
    ];
    
    // Prefetch critical routes immediately
    criticalRoutes.forEach(route => {
      prefetch(route);
    });
    
    // Prefetch important routes with slight delay
    setTimeout(() => {
      importantRoutes.forEach(route => {
        prefetch(route);
      });
    }, 100);
    
    // Preload POS data in background
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        // Preload products for POS
        fetch('/api/admin/products/optimized?page=1&limit=50&status=ACTIVE', {
          method: 'GET',
          credentials: 'include'
        }).catch(() => {}); // Silent fail
        
        // Preload categories
        fetch('/api/admin/categories', {
          method: 'GET', 
          credentials: 'include'
        }).catch(() => {}); // Silent fail
      }, 200);
    }
  }, [prefetch]);

  // Memoized path checks for better performance
  const hrPaths = useMemo(() => [
    "/admin/hr/directory", 
    "/admin/hr/payroll", 
    "/admin/hr/attendance", 
    "/admin/hr/authentication"
  ], []);

  const orderSubPaths = useMemo(() => [
    "/counter/orders/all-orders", 
    "/counter/orders/active-orders", 
    "/counter/orders/delivered-orders"
  ], []);

  const isHRActive = useMemo(() => 
    hrPaths.some((p) => pathname.startsWith(p)), 
    [hrPaths, pathname]
  );

  const isAnyOrderSubPathActive = useMemo(() => 
    orderSubPaths.some((p) => pathname.startsWith(p)), 
    [orderSubPaths, pathname]
  );

  const [loggingOut, setLoggingOut] = React.useState(false);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await authClient.signOut();
      router.push("/signin");
    } catch (err) {
      alert("Failed to log out. Try again.");
    } finally {
      setLoggingOut(false);
    }
  }, [router]);

  const toggleOrdersExpanded = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsOrdersExpanded(prev => !prev);
  }, []);
  
  // Memoized function to render a single menu item
  const renderMenuItem = useCallback((item: MenuItem, index: number, isSubItem = false) => {
    // Check if this is the HR item and use the HR active state
    const isActive = item.path === "/admin/hr/directory" 
      ? isHRActive 
      : pathname.startsWith(item.path);
    
    // Determine base classes
    const baseClasses = "mt-1 flex items-center px-4 py-2 rounded-full transition-all duration-200 group";
    
    // Determine path and styling
    const pathClasses = isActive
      ? "bg-[#4a90e2] text-white shadow-lg shadow-emerald-100"
      : "text-[#27272A] hover:bg-[#F1F5F9] hover:text-[#4a90e2]";
      
    // Additional styling for sub-items
    const subItemClasses = isSubItem ? "ml-4 text-sm" : "";

    if (item.isGroup) {
      return (
        <div key={index}>
          <div 
            onClick={toggleOrdersExpanded}
            className={`${baseClasses} text-[#27272A] hover:bg-[#F1F5F9] hover:text-[#4a90e2] cursor-pointer`}
          >
            <span className="text-[#27272A] group-hover:text-[#4a90e2]">
              <Icon name={item.iconName} size={20} />
            </span>
            <span className="ml-3">{item.name}</span>
            <span className="ml-auto">
              <Icon 
                name={isOrdersExpanded || isAnyOrderSubPathActive ? "chevronUp" : "chevronDown"} 
                size={16} 
              />
            </span>
          </div>
          
          {(isOrdersExpanded || isAnyOrderSubPathActive) && item.subItems && (
            <div className="mt-1 space-y-1">
              {item.subItems.map((subItem, subIndex) => renderMenuItem(subItem, subIndex, true))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link 
        key={index} 
        href={item.path}
        className={`${baseClasses} ${pathClasses} ${subItemClasses}`}
      >
        <span
          className={`${
            isActive ? "text-white" : "text-[#27272A] group-hover:text-[#4a90e2]"
          }`}
        >
          <Icon name={item.iconName} size={isSubItem ? 18 : 20} />
        </span>
        <span className="ml-3">{item.name}</span>
      </Link>
    );
  }, [pathname, isHRActive, isOrdersExpanded, isAnyOrderSubPathActive, toggleOrdersExpanded]);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 bg-white transition-transform duration-300 
      ${isOpen ? "translate-x-0" : "-translate-x-full"} w-70 flex flex-col h-screen`}
    >
      {/* Logo */}
      <div className="h-17 flex items-center px-8">
        <h1 className="text-[28px] font-bold text-[#4a90e2]">
          Pharmino
        </h1>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-0 custom-scrollbar">
        {menuItems.map((item, index) => renderMenuItem(item, index))}
      </nav>

      {/* Logout */}
      <div className="p-5">
        <Button onClick={handleLogout} disabled={loggingOut} variant="secondary">
          <span className="ml-4">{loggingOut ? "Logging out..." : "Log Out"}</span>
          <span className="ml-auto mr-3 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow">
            <Icon name="logout" size={20} className="text-[#27272A]" />
          </span>
        </Button>
      </div>
    </aside>
  );
};

// export default Sidebar;

export default React.memo(Sidebar);