import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  UserGroupIcon, 
  ArchiveBoxIcon, 
  ScissorsIcon, 
  UserIcon, 
  ChartBarIcon, 
  Cog6ToothIcon,
  BellIcon,
  MagnifyingGlassIcon,
  DocumentChartBarIcon,
  TruckIcon
} from '@heroicons/react/24/outline';

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { 
      name: 'Fabric Income', 
      to: '/fabric-income', 
      icon: UserGroupIcon,
      subItems: [
        { name: 'Fabric Income List', to: '/fabric-income' },
        { name: 'Add Fabric Income', to: '/fabric-income/new' }
      ]
    },
    { 
      name: 'Fabric Stock', 
      to: '/stock', 
      icon: ArchiveBoxIcon
    },
    { 
      name: 'Cutting', 
      to: '/cutting', 
      icon: ScissorsIcon,
      subItems: [
        { name: 'Cutting List', to: '/cutting' },
        { name: 'Before Cutting', to: '/cutting/before' },
        { name: 'Cutting Stock', to: '/cutting/stock' },
        { name: 'Inline Stock', to: '/cutting/inline-stock' }
      ]
    },
    { 
      name: 'Worker Process', 
      to: '/process', 
      icon: UserIcon,
      subItems: [
        { name: 'Output', to: '/process/output' }
      ]
    },
    { 
      name: 'Delivery', 
      to: '/delivery', 
      icon: TruckIcon,
      subItems: [
        { name: 'Delivery List', to: '/delivery' },
        { name: 'New Delivery', to: '/delivery/new' }
      ]
    },
    { 
      name: 'Reports', 
      to: '/reports', 
      icon: DocumentChartBarIcon,
      subItems: [
        { name: 'Output Reports', to: '/reports' },
        { name: 'Delivery Reports', to: '/reports/delivery' }
      ]
    }
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const [expandedItems, setExpandedItems] = useState(() => {
    // Initially expand the item that matches the current path
    return navigation.reduce((acc, item) => {
      if (item.subItems && item.subItems.some(subItem => location.pathname === subItem.to || location.pathname.startsWith(subItem.to + '/'))) {
        acc[item.name] = true;
      }
      return acc;
    }, {});
  });

  const toggleExpand = (name) => {
    setExpandedItems(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-center h-16 px-4 bg-gray-900">
          <Link to="/" className="text-xl font-bold tracking-wider">
            Fabric Management
          </Link>
        </div>

        <nav className="mt-5 px-2 space-y-1" aria-label="Main Navigation">
          {navigation.map((item) => (
            <div key={item.name}>
              {item.subItems ? (
                <div className="space-y-1">
                  <button
                    onClick={() => toggleExpand(item.name)}
                    className={`${
                      isActive(item.to) ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    } group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus-visible:ring focus-visible:ring-opacity-50 focus-visible:ring-white`}
                    aria-expanded={expandedItems[item.name]}
                  >
                    <item.icon className="mr-3 flex-shrink-0 h-5 w-5" aria-hidden="true" />
                    <span className="flex-1 text-left">{item.name}</span>
                    <svg 
                      className={`${expandedItems[item.name] ? 'transform rotate-90' : ''} w-5 h-5 transition-transform`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {expandedItems[item.name] && (
                    <div className="pl-10 space-y-1">
                      {item.subItems.map(subItem => (
                        <NavLink
                          key={subItem.name}
                          to={subItem.to}
                          className={({ isActive }) => 
                            `${isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'} 
                            block px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out`
                          }
                          aria-current={isActive(subItem.to) ? 'page' : undefined}
                        >
                          {subItem.name}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <NavLink
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) => 
                    `${isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} 
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out`
                  }
                  aria-current={isActive(item.to) ? 'page' : undefined}
                >
                  <item.icon className="mr-3 flex-shrink-0 h-5 w-5" aria-hidden="true" />
                  {item.name}
                </NavLink>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between h-16 px-4">
            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Search */}
            <div className="flex-1 max-w-3xl mx-4 relative">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Search for fabric, lot number, vendor..."
                  onClick={() => setSearchOpen(true)}
                  onBlur={() => setSearchOpen(false)}
                  aria-label="Search"
                />
              </div>
              {/* Dropdown search results would go here */}
            </div>

            {/* Right side icons */}
            <div className="flex items-center space-x-4">
              {/* Notification bell */}
              <button
                type="button"
                className="p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                aria-label="View notifications"
              >
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-6 w-6" aria-hidden="true" />
                {/* Notification badge */}
                <span className="absolute top-3 right-3 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-xs font-medium text-white">3</span>
              </button>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  type="button"
                  className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  id="user-menu-button"
                  aria-expanded="false"
                  aria-haspopup="true"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
                    RM
                  </div>
                </button>
                {/* Profile dropdown menu would go here */}
              </div>
            </div>
          </div>
        </div>

        {/* Main content wrapper */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout; 