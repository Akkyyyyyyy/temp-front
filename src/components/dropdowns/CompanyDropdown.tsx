// components/CompanyDropdown.tsx
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { changeCompany, createCompanyByMember } from '@/api/company';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { Plus, ChevronDown, Check } from 'lucide-react';
import { useTeamMembers } from '@/hooks/useTeamMembers';

interface CompanyDropdownProps {
  setSelectedProject: (project: any) => void;
  selectedDay?: number;
  selectedMonth: number;
  selectedYear: number;
  selectedWeek?: number;
  timeView: any;
}

export function CompanyDropdown({ setSelectedProject, selectedDay, selectedMonth, selectedWeek, selectedYear, timeView }: CompanyDropdownProps) {
  const { user, login } = useAuth();
  const {
    refresh
  } = useTeamMembers({
    selectedMonth,
    selectedYear,
    selectedWeek,
    timeView,
  });
  const [isCreateCompanyDialogOpen, setIsCreateCompanyDialogOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ✅ Check if user's email matches any existing company email
  const canAddOwnCompany = !user?.data?.associatedCompanies?.some(
    (c: any) => c.email === user?.data?.email
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenCreateCompanyDialog = () => {
    setNewCompanyName('');
    setIsCreateCompanyDialogOpen(true);
    setIsDropdownOpen(false);
  };

  // 🔄 Handle company change
  const handleCompanyChange = async (companyId: string) => {
    if (!companyId || !user?.data?.id) return;

    try {
      const result = await changeCompany({
        memberId: user.data.id,
        companyId,
      });

      if (result.success && result.data) {
        await refresh();
        // ✅ Update token & Auth context
        setSelectedProject(null);
        localStorage.setItem("token", result.data.token);

        login("member", {
          token: result.data.token,
          member: result.data.user
        });
        setIsDropdownOpen(false);
      } else {
        toast.error("Failed to switch company");
      }
    } catch (error: any) {
      console.error("Error switching company:", error);
      toast.error("Error switching company");
    }
  };

  const handleCreateCompany = async () => {
    if (!user?.data?.id || !newCompanyName.trim()) {
      toast.error("Company name required");
      return;
    }

    try {
      setIsCreatingCompany(true);
      const result = await createCompanyByMember({
        memberId: user.data.id,
        companyName: newCompanyName.trim(),
      });

      if (result.success && result.data) {
        toast.success("Company created");
        setIsCreateCompanyDialogOpen(false);

        // ✅ After creation, switch to this company automatically
        const newCompanyId = result.data.company.id;

        const switchResult = await changeCompany({
          memberId: user.data.id,
          companyId: newCompanyId,
        });

        if (switchResult.success && switchResult.data) {
          localStorage.setItem("token", switchResult.data.token);
          login("member", {
            token: switchResult.data.token,
            member: switchResult.data.user
          });
        }
      } else {
        toast.error("Failed to create company");
      }
    } catch (error: any) {
      console.error("Error creating company:", error);
      toast.error("Error creating company");
    } finally {
      setIsCreatingCompany(false);
    }
  };

  const currentCompany = user?.data?.company;
  const associatedCompanies = user?.data?.associatedCompanies || [];

  return (
    <>
      {
        (associatedCompanies.length < 2 && !canAddOwnCompany) ? (
          <button
            className="flex items-center gap-2 text-lg font-semibold bg-transparent border border-transparent rounded-md focus:ring-0 focus:ring-offset-0 focus:outline-none transition-colors py-1 sm:px-3 sm:py-2"
          >
            <span>{currentCompany?.name || "Select company"}</span>
          </button>
        ) : (
          <div className="relative" ref={dropdownRef}>
            {/* Dropdown Trigger */}
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 text-lg font-semibold bg-transparent border border-transparent rounded-md focus:ring-0 focus:ring-offset-0 focus:outline-none transition-colors py-1 sm:px-3 sm:py-2"
            >
              <span className="truncate max-w-[200px]">{currentCompany?.name || "Select company"}</span>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-max bg-background rounded-md border shadow-md z-50 animate-in fade-in-0 zoom-in-95">
                <div className="p-1">
                  {/* Company List */}
                  {associatedCompanies.map((company: any) => (
                    <button
                      key={company.id}
                      onClick={() => handleCompanyChange(company.id)}
                      className="w-full flex items-center justify-between px-3 py-2 text-md rounded-sm hover:bg-accent hover:text-background transition-colors cursor-pointer text-left"
                    >
                      <span className="break-words whitespace-normal flex-1 min-w-0">{company.name}</span>
                      {currentCompany?.id === company.id && (
                        <Check size={16} className="flex-shrink-0 ml-2" />
                      )}
                    </button>
                  ))}

                  {/* Create Company Option */}
                  {canAddOwnCompany && associatedCompanies.length > 0 && (
                    <div className="border-t my-1" />
                  )}

                  {canAddOwnCompany && (
                    <button
                      onClick={handleOpenCreateCompanyDialog}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-background transition-colors cursor-pointer text-left"
                    >
                      <Plus size={16} className="flex-shrink-0" />
                      <span className="break-words whitespace-normal flex-1 min-w-0">Create your own company</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      }

      <Dialog open={isCreateCompanyDialogOpen} onOpenChange={setIsCreateCompanyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Company</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <Input
              placeholder="Company name"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newCompanyName.trim()) {
                  handleCreateCompany();
                }
              }}
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateCompanyDialogOpen(false)}
              disabled={isCreatingCompany}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCompany}
              disabled={newCompanyName.trim().length < 3 || isCreatingCompany}
            >
              {isCreatingCompany ? "Creating..." : "Create Company"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}