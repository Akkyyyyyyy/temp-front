import { Home, UserRoundPlus, Calendar, Plus, DollarSign, Settings, HelpCircle, Camera, LogOut, Menu, Package } from "lucide-react";
import { useState } from "react";
import { LogoutModal } from "./LogoutModal";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AddProjectDialog } from "./AddProjectDialog";
import { TeamMember } from "./TeamMembers";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  onAddTeamMember: () => void;
  onShowTeamAvailability: () => void;
  onAddBooking: () => void;
  onShowFinancialManagement: () => void;
  onShowPackages: () => void;
  selectedDay?: number;
  setSelectedDay: (day: number) => void;
  teamMembers: TeamMember[];
  refreshMembers: () => void;
  onDialogCloseTrigger: number;
}

export function Sidebar({
  onAddTeamMember,
  onShowTeamAvailability,
  onAddBooking,
  onShowFinancialManagement,
  onShowPackages,
  selectedDay,
  setSelectedDay,
  teamMembers,
  refreshMembers,
  onDialogCloseTrigger
}: SidebarProps) {
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { logout, user } = useAuth();

  const sidebarItems = [
    { icon: Home, label: "Dashboard", active: true },
    { icon: UserRoundPlus, label: "Add Team Members", active: false },
    { icon: Calendar, label: "Calendar", active: false },
    { icon: Plus, label: "Add Booking", active: false },
    { icon: DollarSign, label: "Revenue", active: false },
    { icon: Package, label: "Packages", active: false },
    { icon: Settings, label: "Settings", active: false },
    { icon: HelpCircle, label: "Help", active: false },
  ];

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  const handleIconClick = (index: number) => {
    switch (index) {
      case 1:
        onAddTeamMember();
        break;
      case 2:
        onShowTeamAvailability();
        break;
      case 3:
        if (!selectedDay) setSelectedDay(1);
        onAddBooking();
        setIsOpen(true);
        break;
      case 4:
        onShowFinancialManagement();
        break;
      case 5:
        onShowPackages();
        break;
      default:
        break;
    }
  };

  // Mobile Navbar with Sheet
  const MobileNavbar = () => (
    <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-studio-dark border-b border-border/20 flex items-center justify-between px-4 z-50">
      {/* Logo */}
      <div className="flex gap-5">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-studio-gold to-studio-gold-light flex items-center justify-center">
          <Camera className="w-4 h-4 text-studio-dark" />
        </div>
        <div className="flex gap-5">
          <h1 className="text-2xl font-semibold text-foreground mb-1">The VIP Studio</h1>
          <div className="flex items-center gap-2">
            {/* <p className="text-muted-foreground text-sm">{companyDetails.name}</p> */}
            <span className={`text-xs font-medium ${user?.type === 'member' ? 'text-blue-600' : 'text-purple-600'}`}>
              {user?.type === 'member' ? 'Member' : 'Admin'}
            </span>
          </div>
        </div>
      </div>

      {/* Three-dot menu trigger */}
      <Sheet>
        <SheetTrigger asChild>
          <button className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-studio-gray-light/50">
            <Menu className="w-5 h-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-studio-dark border-r border-border/20 p-0">
          <div className="flex flex-col h-full py-6">
            {/* Logo in Sheet */}
            <div className="flex items-center justify-center mb-8">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-studio-gold to-studio-gold-light flex items-center justify-center">
                <Camera className="w-4 h-4 text-studio-dark" />
              </div>
              <span className="ml-2 text-white font-semibold">The VIP Studio</span>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 space-y-2 px-3">
              {sidebarItems.map((item, index) => (
                <button
                  key={index}
                  className={`group relative w-full h-12 rounded-lg flex items-center px-3 transition-all duration-200 ${item.active
                    ? 'bg-studio-gold text-studio-dark shadow-lg'
                    : 'text-muted-foreground hover:text-foreground hover:bg-studio-gray-light/50 hover:shadow-md'
                    }`}
                  onClick={() => handleIconClick(index)}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="ml-3 text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Logout Button */}
            <div className="mt-auto pt-4 border-t border-border/20 px-3">
              <button
                className="w-full h-12 rounded-lg flex items-center px-3 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
                onClick={() => {
                  // Close the sheet first
                  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                  setIsLogoutModalOpen(true);
                }}
              >
                <LogOut className="w-5 h-5" />
                <span className="ml-3 text-sm font-medium">Log Out</span>
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <div className="hidden lg:flex fixed left-0 top-0 h-full w-16 bg-studio-dark border-r border-border/20 flex-col items-center py-6 space-y-4 z-50">
      {/* Logo */}
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-studio-gold to-studio-gold-light flex items-center justify-center mb-2">
        <Camera className="w-5 h-5 text-studio-dark" />
      </div>

      {/* Navigation Items */}
      <div className="flex-1 space-y-2">
        {sidebarItems.map((item, index) => (
          <button
            key={index}
            className={`group relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${item.active
              ? 'bg-studio-gold text-studio-dark shadow-lg'
              : 'text-muted-foreground hover:text-foreground hover:bg-studio-gray-light/50 hover:shadow-md'
              }`}
            onClick={() => handleIconClick(index)}
            aria-label={item.label}
          >
            <item.icon className="w-5 h-5" />

            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-studio-dark text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
              {item.label}
            </div>
          </button>
        ))}
      </div>

      {/* Logout Button */}
      <div className="mt-auto pt-4 border-t border-border/20">
        <button
          className="group relative w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
          onClick={() => setIsLogoutModalOpen(true)}
          aria-label="Sign out"
        >
          <LogOut className="w-5 h-5" />
          <div className="absolute left-full ml-2 px-2 py-1 bg-studio-dark text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
            Log Out
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Navbar */}
      <MobileNavbar />

      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Spacers to push content away from sidebar/navbar */}
      <div className="w-0 lg:w-16 flex-shrink-0"></div>
      <div className="h-16 lg:h-0 flex-shrink-0"></div>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onLogout={handleLogout}
      />
      <AddProjectDialog
        teamMembers={teamMembers}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        refreshMembers={refreshMembers}
        onAddTeamMember={onAddTeamMember}
        onDialogCloseTrigger={onDialogCloseTrigger}
      />
    </>
  );
}