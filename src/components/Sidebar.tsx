import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Building2, 
  DollarSign, 
  FileText, 
  UserCog,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const [isOpen, setIsOpen] = React.useState(true);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Mobile menu button */}
      <button 
        className="fixed z-50 bottom-4 right-4 p-2 rounded-full bg-blue-600 text-white md:hidden shadow-lg"
        onClick={toggleSidebar}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside 
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-40 ${collapsed ? 'w-16' : 'w-64'} transition-all duration-300 ease-in-out bg-blue-700 text-white md:relative md:translate-x-0 group flex-shrink-0`}
      >
        <div className="h-16 px-4 border-b border-blue-600 flex items-center justify-between">
          <h1 className={`text-2xl font-bold transition-opacity duration-300 ${collapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
            PropManager
          </h1>
          <button
            onClick={onToggle}
            className={`p-1 rounded-lg hover:bg-blue-600 transition-colors hidden md:block ${collapsed ? 'mx-auto' : ''}`}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <NavLink 
                to="/" 
                className={({isActive}) => 
                  `flex items-center h-10 px-3 rounded-lg hover:bg-blue-600 transition-colors relative ${
                    isActive ? 'bg-blue-800' : ''
                  }`
                }
                end
              >
                <Home className={collapsed ? 'mx-auto' : 'mr-3'} size={20} />
                <span className={`transition-opacity duration-300 ${collapsed ? 'hidden' : 'block'}`}>
                  Dashboard
                </span>
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                    Dashboard
                  </div>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/tenants" 
                className={({isActive}) => 
                  `flex items-center h-10 px-3 rounded-lg hover:bg-blue-600 transition-colors relative ${
                    isActive ? 'bg-blue-800' : ''
                  }`
                }
              >
                <Users className={collapsed ? 'mx-auto' : 'mr-3'} size={20} />
                <span className={`transition-opacity duration-300 ${collapsed ? 'hidden' : 'block'}`}>
                  Tenants
                </span>
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                    Tenants
                  </div>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/owners" 
                className={({isActive}) => 
                  `flex items-center h-10 px-3 rounded-lg hover:bg-blue-600 transition-colors relative ${
                    isActive ? 'bg-blue-800' : ''
                  }`
                }
              >
                <UserCog className={collapsed ? 'mx-auto' : 'mr-3'} size={20} />
                <span className={`transition-opacity duration-300 ${collapsed ? 'hidden' : 'block'}`}>
                  Owners
                </span>
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                    Owners
                  </div>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/properties" 
                className={({isActive}) => 
                  `flex items-center h-10 px-3 rounded-lg hover:bg-blue-600 transition-colors relative ${
                    isActive ? 'bg-blue-800' : ''
                  }`
                }
              >
                <Building2 className={collapsed ? 'mx-auto' : 'mr-3'} size={20} />
                <span className={`transition-opacity duration-300 ${collapsed ? 'hidden' : 'block'}`}>
                  Properties
                </span>
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                    Properties
                  </div>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/transactions" 
                className={({isActive}) => 
                  `flex items-center h-10 px-3 rounded-lg hover:bg-blue-600 transition-colors relative ${
                    isActive ? 'bg-blue-800' : ''
                  }`
                }
              >
                <DollarSign className={collapsed ? 'mx-auto' : 'mr-3'} size={20} />
                <span className={`transition-opacity duration-300 ${collapsed ? 'hidden' : 'block'}`}>
                  Transactions
                </span>
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                    Transactions
                  </div>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/reports" 
                className={({isActive}) => 
                  `flex items-center h-10 px-3 rounded-lg hover:bg-blue-600 transition-colors relative ${
                    isActive ? 'bg-blue-800' : ''
                  }`
                }
              >
                <FileText className={collapsed ? 'mx-auto' : 'mr-3'} size={20} />
                <span className={`transition-opacity duration-300 ${collapsed ? 'hidden' : 'block'}`}>
                  Reports
                </span>
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                    Reports
                  </div>
                )}
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;