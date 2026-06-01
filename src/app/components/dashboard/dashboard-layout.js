import { Fragment, useState, useEffect } from "react";
import { Dialog, Menu, Transition } from "@headlessui/react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import {
  Bars3BottomLeftIcon,
  XMarkIcon,
  UserIcon,
  BuildingOfficeIcon,
  ChartBarSquareIcon,
} from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";

const userNavigation = [
  { title: "Sign out", href: "/logout", active: true },
];

function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
}

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const windowSize = useWindowSize();
  const currentUser = useSelector((state) => state.session.currentUser);
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    if (windowSize.width <= 768) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  };

  const navigation = [
    {
      name: "Companies",
      href: "/dashboard/companies",
      icon: BuildingOfficeIcon,
    },
    {
      name: "Ops Center",
      href: "/dashboard/ops",
      icon: ChartBarSquareIcon,
    },
  ];

  return (
    <div className="min-h-full">
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-40 md:hidden"
          onClose={setSidebarOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 z-40 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-white pt-16 pb-4">
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon className="h-6 w-6 text-gray-400" />
                  </button>
                </div>
                <div className="mt-5 h-0 flex-1 overflow-y-auto">
                  <nav className="space-y-1 px-2">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={handleClick}
                        className={classNames(
                          location.pathname === item.href ||
                            (item.href === "/dashboard/ops" &&
                              location.pathname.startsWith("/dashboard/ops"))
                            ? "bg-gray-50 text-blue-400"
                            : "text-gray-400 hover:text-blue-400 hover:bg-gray-50",
                          "group flex items-center gap-2 rounded-xl p-2 text-sm font-semibold cursor-pointer transition-all duration-300"
                        )}
                      >
                        <item.icon className="h-6 w-6 shrink-0" />
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
            <div className="w-14 flex-shrink-0" aria-hidden="true" />
          </div>
        </Dialog>
      </Transition.Root>

      <div
        className="hidden md:fixed md:top-16 md:bottom-0 md:flex md:flex-col transition-all duration-300 z-50"
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
        style={{ width: collapsed ? "4rem" : "16rem" }}
      >
        <div className="flex flex-grow flex-col overflow-y-auto bg-white pt-5 rounded-xl shadow-xl">
          <div className="mt-5 flex flex-1 flex-col">
            <nav className="flex-1 space-y-1 px-2 pb-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={classNames(
                    location.pathname === item.href ||
                      (item.href === "/dashboard/ops" &&
                        location.pathname.startsWith("/dashboard/ops"))
                      ? "bg-gray-50 text-blue-400"
                      : "text-gray-400 hover:text-blue-400 hover:bg-gray-50",
                    "group flex items-center gap-2 rounded-xl p-2 text-sm font-semibold cursor-pointer transition-all duration-300"
                  )}
                >
                  <item.icon className="h-6 w-6 shrink-0" />
                  <span
                    className={classNames(
                      "overflow-hidden transition-all duration-300",
                      collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                    )}
                  >
                    {item.name}
                  </span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="sticky top-0 z-50 flex h-16 flex-shrink-0 bg-white shadow pl-0 pr-4 items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              type="button"
              className="text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3BottomLeftIcon className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
          </div>

          <div className="flex items-center space-x-4">
            <Menu as="div" className="relative">
              <div>
                <Menu.Button className="flex items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                  <span className="sr-only">Open user menu</span>
                  <UserIcon className="h-8 w-8 rounded-full" />
                </Menu.Button>
              </div>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  {userNavigation.map((item) => (
                    <Menu.Item key={item.title}>
                      {({ active }) => (
                        <Link
                          to={item.href}
                          className={classNames(
                            active ? "bg-gray-100" : "",
                            "block px-4 py-2 text-sm text-gray-700"
                          )}
                        >
                          {item.title}
                        </Link>
                      )}
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>

        <main className="mb-0 sm:mb-20">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

