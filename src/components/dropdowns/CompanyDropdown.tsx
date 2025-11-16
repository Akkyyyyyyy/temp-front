// components/CompanyDropdown.tsx
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { changeCompany, createCompanyByMember } from '@/api/company';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

interface CompanyDropdownProps {
  setSelectedProject: (project: any) => void;
}

export function CompanyDropdown({ setSelectedProject }: CompanyDropdownProps) {
  const { user, login } = useAuth();
  const [isCreateCompanyDialogOpen, setIsCreateCompanyDialogOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);

  // ✅ Check if user's email matches any existing company email
  const canAddOwnCompany = !user?.data?.associatedCompanies?.some(
    (c: any) => c.email === user?.data?.email
  );

  const handleOpenCreateCompanyDialog = () => {
    setNewCompanyName('');
    setIsCreateCompanyDialogOpen(true);
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
        // ✅ Update token & Auth context
        setSelectedProject(null);
        localStorage.setItem("token", result.data.token);

        login("member", {
          token: result.data.token,
          member: result.data.user
        });

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

  return (
    <>
      <div className="flex items-center gap-2">
        <Select
          value={user?.data?.company?.id || ""}
          onValueChange={(value) => {
            if (value === "create") {
              handleOpenCreateCompanyDialog();
            } else {
              handleCompanyChange(value);
            }
          }}
        >
          <SelectTrigger className="w-[220px] text-xl font-semibold bg-transparent border border-transparent rounded-md focus:ring-0 focus:ring-offset-0 focus:outline-none">
            <SelectValue placeholder="Select company">
              {user?.data?.company?.name || "Select company"}
            </SelectValue>
          </SelectTrigger>

          <SelectContent>
            {user?.data?.associatedCompanies?.map((c: any) => (
              <SelectItem key={c.id} value={c.id} className='cursor-pointer'>
                {c.name}
              </SelectItem>
            ))}
            {canAddOwnCompany && (
              <SelectItem value="create" className='pl-2 cursor-pointer'>
                <div className="flex items-center gap-2">
                  <Plus size={16} />
                  <span>Create your own company</span>
                </div>
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <Dialog open={isCreateCompanyDialogOpen} onOpenChange={setIsCreateCompanyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Company</DialogTitle>
            <DialogDescription>
              Enter a name for your new company. You'll be automatically switched to this company after creation.
            </DialogDescription>
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
              disabled={!newCompanyName.trim() || isCreatingCompany}
            >
              {isCreatingCompany ? "Creating..." : "Create Company"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}