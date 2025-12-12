import { Home, UserRoundPlus, Calendar, Plus, DollarSign, Settings, HelpCircle, Camera, LogOut, Menu, Package, Briefcase, BriefcaseBusiness, UserRoundCheck, Euro, PoundSterling, IndianRupee, Bitcoin, Building2, Building, School2, School } from "lucide-react";
import { useEffect, useState } from "react";
import { LogoutModal } from "./LogoutModal";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AddProjectDialog } from "./AddProjectDialog";
import { TeamMember } from "./TeamMembers";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { GoogleCalendarSync } from "./GoogleCalendarSync";
import { CompanyDropdown } from "./dropdowns/CompanyDropdown";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { uploadCompanyLogo } from "@/api/company";
import { Label } from "./ui/label";
import { ImageCropModal } from "./modals/ImageCropModal";
import { getFallback } from "@/helper/helper";

interface SidebarProps {
  onAddTeamMember: () => void;
  onShowTeamAvailability: () => void;
  onAddBooking: () => void;
  onShowFinancialManagement: () => void;
  onShowPackages: () => void;
  selectedDay?: number;
  selectedMonth: number;
  selectedYear: number;
  selectedWeek?: number;
  timeView: any;
  setSelectedDay: (day: number) => void;
  teamMembers: TeamMember[];
  refreshMembers: () => void;
  onDialogCloseTrigger: number;
  onDateClick: () => void;
  setSelectedProject: (project: any) => void;
}

type SidebarItem = {
  icon: any;
  label: string;
  active: boolean;
  action: string; // Unique identifier for each action
};
const S3_URL = import.meta.env.VITE_S3_BASE_URL;

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
  onDialogCloseTrigger,
  onDateClick,
  setSelectedProject,
  selectedMonth,
  selectedWeek,
  selectedYear,
  timeView
}: SidebarProps) {
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { logout, user, updateUser } = useAuth();
  const { isAuthorized, isSyncing, handleConnect, handleSyncAllEvents, handleDisconnect } = useGoogleCalendar();
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logo, setLogo] = useState(user.data.company.logo);

  useEffect(() => {
    console.log(user);
    setLogo(user.data.company.logo);
  }, [user]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Create object URL and show crop modal
    const imageUrl = URL.createObjectURL(file);
    setImageToCrop(imageUrl);
    setShowCropModal(true);

    // Reset file input
    event.target.value = '';
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    try {
      setUploadingLogo(true);

      // Create a file from the blob
      const file = new File([croppedImageBlob], 'profile-photo.jpg', { type: 'image/jpeg' });

      // Upload using your existing function
      const result = await uploadCompanyLogo(user.data.company.id, file);

      if (result.success) {
        setLogo(result.company.logo)
        updateUser({
          company: {
            ...user.data.company,
            logo: result.company.logo
          }
        });
        toast.success('Profile picture updated successfully!');
      }
    } catch (error) {
      console.error('Error uploading cropped image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Function to get currency icon based on country
  const getCurrencyIcon = () => {
    const country = user?.data?.company.country?.toLowerCase();

    switch (country) {
      case 'us':
      case 'usa':
      case 'united states':
      case 'canada':
      case 'australia':
        return DollarSign; // USD, CAD, AUD

      case 'gb':
      case 'uk':
      case 'united kingdom':
        return PoundSterling; // GBP

      case 'eu':
      case 'germany':
      case 'france':
      case 'italy':
      case 'spain':
      case 'netherlands':
        return Euro; // EUR

      case 'in':
      case 'india':
        return IndianRupee; // INR

      default:
        return DollarSign;
    }
  };

  const CurrencyIcon = getCurrencyIcon();

  // Create sidebar items with unique action identifiers
  const getSidebarItems = (): SidebarItem[] => {
    const baseItems: SidebarItem[] = [
      // { icon: Home, label: "Home", active: true, action: "dashboard" },
      { icon: UserRoundPlus, label: "Add Members", active: false, action: "addTeamMember" },
      { icon: Plus, label: "Add Booking", active: false, action: "addBooking" },
      { icon: UserRoundCheck, label: "Bookings", active: false, action: "showTeamAvailability" },
      { icon: CurrencyIcon, label: "Revenue", active: false, action: "showFinancialManagement" },
      { icon: BriefcaseBusiness, label: "Packages", active: false, action: "showPackages" },
      { icon: Settings, label: "Settings", active: false, action: "settings" },
      { icon: HelpCircle, label: "Help", active: false, action: "help" },
      { icon: LogOut, label: "Log Out", active: false, action: "logout" },
    ];

    // Filter out admin-only items if user is not admin
    const filteredItems = user.data.isAdmin
      ? baseItems
      : baseItems.filter(
        (item) => item.label !== "Add Members" && item.label !== "Add Booking"
      );

    return filteredItems;
  };

  const sidebarItems = getSidebarItems();

  // Separate main items from bottom items (Settings, Help, Logout)
  const mainItems = sidebarItems.filter(item =>
    !["settings", "help", "logout"].includes(item.action)
  );

  const bottomItems = sidebarItems.filter(item =>
    ["settings", "help", "logout"].includes(item.action)
  );

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  const [currentTime, setCurrentTime] = useState(new Date());

  const handleDateClick = () => {
    onDateClick();
  };

  const handleIconClick = (item: SidebarItem) => {
    switch (item.action) {
      case "addTeamMember":
        onAddTeamMember();
        break;
      case "showTeamAvailability":
        onShowTeamAvailability();
        break;
      case "addBooking":
        if (!selectedDay) setSelectedDay(1);
        onAddBooking();
        setIsOpen(true);
        break;
      case "showFinancialManagement":
        onShowFinancialManagement();
        break;
      case "showPackages":
        onShowPackages();
        break;
      case "settings":
        // Handle settings navigation
        break;
      case "help":
        // Handle help navigation
        break;
      case "logout":
        setIsLogoutModalOpen(true);
        break;
      default:
        break;
    }
  };

  // Mobile Navbar with Sheet
  const MobileNavbar = () => (
    <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-studio-gray border-b border-border/90 flex items-center justify-between px-4 z-50">
      <div className="flex gap-2">
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
              <div className="flex items-center justify-start mb-4 gap-2">
                <div className="group relative w-12 h-12 rounded-lg flex items-center justify-center border mx-3">
                  {logo ? (
                    <img
                      src={`${S3_URL}/${logo}`}
                      alt={user.data.company.name}
                      className="object-cover rounded-lg w-full h-full"
                    />
                  ) : (
                    <div className="text-center text-white text-sm font-medium flex items-center justify-center w-full h-full">
                      {getFallback(user.data.company.name)}
                    </div>
                  )}

                  {user.data.isAdmin && (
                    <>
                      <Label
                        htmlFor="company-upload-form"
                        className="absolute inset-0 bg-black/80 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm z-10"
                        title="Upload Company Logo"
                      >
                        {uploadingLogo ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                        ) : (
                          <div className="text-center text-white">
                            <Camera className="w-5 h-5 mx-auto" />
                          </div>
                        )}
                      </Label>
                      <input
                        id="company-upload-form"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={uploadingLogo}
                      />
                    </>
                  )}
                </div>
                <span className="ml-2 text-white font-semibold text-xl">{user.data.company.name}</span>
              </div>

              {/* Navigation Items */}
              <div className="flex-1 space-y-2 px-3">
                {mainItems.map((item, index) => (
                  <button
                    key={index}
                    className={`group relative w-full h-12 rounded-lg flex items-center px-3 transition-all duration-200 ${item.active
                      ? 'bg-studio-gold text-studio-dark shadow-lg'
                      : 'text-muted-foreground hover:text-foreground hover:bg-studio-gray-light/50 hover:shadow-md'
                      }`}
                    onClick={() => handleIconClick(item)}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="ml-3 text-sm font-medium">{item.label}</span>
                  </button>
                ))}

                {/* Bottom Items */}
                <div className="mt-8 pt-4 border-t border-border/20 flex-1 gap-3">
                  {bottomItems.map((item, index) => (
                    <button
                      key={index}
                      className={`group relative w-full h-12 rounded-lg flex items-center px-3 transition-all duration-200 ${item.action === 'logout'
                        ? 'text-muted-foreground hover:text-red-400 hover:bg-red-400/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-studio-gray-light/50 hover:shadow-md'
                        }`}
                      onClick={() => handleIconClick(item)}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="ml-3 text-sm font-medium">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <div className="flex gap-5">
          <CompanyDropdown setSelectedProject={setSelectedProject} selectedMonth={selectedMonth} selectedYear={selectedYear} selectedWeek={selectedWeek} timeView={timeView} />
        </div>
      </div>

      {/* Date Display */}
      <div className="flex items-center gap-2 sm:gap-6">
        <GoogleCalendarSync
          onConnect={handleConnect}
          onSyncAllEvents={handleSyncAllEvents}
          onDisconnect={handleDisconnect}
          isAuthorized={isAuthorized}
          isSyncing={isSyncing}
        />
        {/* Today's Date with Day Name - Clickable */}
        <div
          className="text-right cursor-pointer px-2 py-1 sm:px-3 sm:py-2  rounded-md transition-colors hover:bg-muted/60"
          onClick={handleDateClick}
          title={`Click to reset Dashboard`}
        >
          <p className="text-xs sm:text-sm text-muted-foreground">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}
          </p>
          <p className="text-foreground font-medium text-xs sm:text-sm">
            {currentTime.toLocaleDateString('en-UK', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>
    </div>
  );

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <div className="hidden lg:flex fixed left-0 top-0 h-full w-20 bg-studio-dark border-r border-border/20 flex-col items-center py-3 space-y-4 z-50">
      {/* Logo - Fixed alignment */}
      <div className="group relative w-12 h-12 rounded-lg flex items-center justify-center border mx-auto">
        {logo ? (
          <img
            src={`${S3_URL}/${logo}`}
            alt={user.data.company.name}
            className="object-cover rounded-lg w-full h-full"
          />
        ) : (
          <div className="text-center text-white text-sm font-medium flex items-center justify-center w-full h-full">
            {getFallback(user.data.company.name)}
          </div>
        )}

        {user.data.isAdmin && (
          <>
            <Label
              htmlFor="company-upload-form"
              className="absolute inset-0 bg-black/80 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm z-10"
              title="Upload Company Logo"
            >
              {uploadingLogo ? (
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
              ) : (
                <div className="text-center text-white">
                  <Camera className="w-5 h-5 mx-auto" />
                </div>
              )}
            </Label>
            <input
              id="company-upload-form"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
              disabled={uploadingLogo}
            />
          </>
        )}
      </div>

      {/* Navigation Items - Consistent sizing */}
      <div className="flex-1 space-y-3 w-full flex flex-col items-center">
        {mainItems.map((item, index) => (
          <div key={index} className="w-12 flex justify-center">
            <button
              className={`group relative w-12 h-10 rounded-lg flex items-center justify-center transition-all duration-300 overflow-hidden ${item.active
                ? 'bg-studio-gold text-studio-dark shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
                }`}
              onClick={() => handleIconClick(item)}
            >
              {/* Icon - goes up and disappears on hover */}
              <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-4">
                <item.icon className="w-5 h-5" />
              </div>

              {/* Label - comes from down on hover */}
              <span className="text-[.7rem] font-medium text-center px-1 opacity-0 transform translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 leading-tight break-words">
                {item.label}
              </span>
            </button>
          </div>
        ))}
      </div>

      {/* Bottom Items - Consistent sizing */}
      <div className="mt-auto pt-1 border-t border-border/20 w-full space-y-3 flex flex-col items-center">
        {bottomItems.map((item, index) => (
          <div key={index} className="w-12 flex justify-center">
            <button
              className={`group relative w-12 h-10 rounded-lg flex items-center justify-center transition-all duration-300 overflow-hidden ${item.action === 'logout'
                ? 'text-muted-foreground hover:text-red-400'
                : 'text-muted-foreground hover:text-foreground'
                }`}
              onClick={() => handleIconClick(item)}
            >
              {/* Icon - goes up and disappears on hover */}
              <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-4">
                <item.icon className="w-5 h-5" />
              </div>

              {/* Label - comes from down on hover */}
              <span className="text-xs font-medium whitespace-nowrap opacity-0 transform translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                {item.label}
              </span>
            </button>
          </div>
        ))}
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
      <div className="w-0 lg:w-20 flex-shrink-0"></div>
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
      <ImageCropModal
        isOpen={showCropModal}
        cropShape="rect"
        onClose={() => {
          setShowCropModal(false);
          if (imageToCrop) {
            URL.revokeObjectURL(imageToCrop);
            setImageToCrop(null);
          }
        }}
        image={imageToCrop}
        onCropComplete={handleCropComplete}
        aspect={1} // Square aspect ratio for profile pictures
      />
    </>
  );
}