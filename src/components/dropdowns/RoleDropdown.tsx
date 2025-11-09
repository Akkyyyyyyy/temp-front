// src/components/RoleDropdown.tsx
import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Trash2, Edit, Building } from "lucide-react";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface RoleDropdownProps {
  selected: string;
  onChange: (roleId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  companyId?: string; // Optional: specify company if different from current user
}

export function RoleDropdown({
  selected,
  onChange,
  disabled = false,
  placeholder = "Select a role",
  className = "",
  companyId: externalCompanyId, // Allow external company ID override
}: RoleDropdownProps) {
  const { 
    roles, 
    loading, 
    addRole, 
    deleteRole, 
    updateRole, 
    refresh 
  } = useRole();
  const { user } = useAuth();
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [isDeletingRole, setIsDeletingRole] = useState<string | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [updateRoleName, setUpdateRoleName] = useState("");
  const [updateRoleDescription, setUpdateRoleDescription] = useState("");
  const [pendingRoleId, setPendingRoleId] = useState<string | null>(null);

  // Watch for pending role to appear in roles array, then call onChange
  useEffect(() => {
    if (pendingRoleId && roles.find(r => r.id === pendingRoleId)) {
      onChange(pendingRoleId);
      setPendingRoleId(null);
    }
  }, [pendingRoleId, roles, onChange]);

  // Determine which company to use
  const targetCompanyId = user.data?.company?.id;
  
  // Find the selected role by ID
  const selectedRole = roles.find(role => role.id === selected);
  

  const canManageRoles = targetCompanyId;

  const handleAddRole = async () => {
    if (!newRoleName.trim()) {
      toast.error("Role name is required");
      return;
    }

    if (!targetCompanyId) {
      toast.error("Company context is required");
      return;
    }

    try {
      const newRole = await addRole({
        name: newRoleName.trim(),
        description: newRoleDescription.trim() || undefined,
      });
      
      if (newRole) {
        // Set pending role ID - useEffect will call onChange when role appears
        setPendingRoleId(newRole.id);
      }
      
      // Reset form
      setNewRoleName("");
      setNewRoleDescription("");
      setIsAddingRole(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create role");
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      const success = await deleteRole(roleId);
      
      if (success) {
        // If the deleted role was selected, clear selection
        if (selected === roleId) {
          onChange("");
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete role");
    } finally {
      setIsDeletingRole(null);
    }
  };

  const handleUpdateRole = async (roleId: string) => {
    if (!updateRoleName.trim()) {
      toast.error("Role name is required");
      return;
    }

    if (!targetCompanyId) {
      toast.error("Company context is required");
      return;
    }

    try {
      const updatedRole = await updateRole(roleId, {
        name: updateRoleName.trim(),
        description: updateRoleDescription.trim() || undefined,
      });
      
      if (updatedRole) {
        toast.success("Role updated successfully");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update role");
    } finally {
      setIsUpdatingRole(null);
      setUpdateRoleName("");
      setUpdateRoleDescription("");
    }
  };

  const startUpdateRole = (role: any) => {
    setUpdateRoleName(role.name);
    setUpdateRoleDescription(role.description || "");
    setIsUpdatingRole(role.id);
  };

  const isRoleInUse = (role: any) => {
    return role.memberCount > 0 || role.assignmentCount > 0;
  };

  // Show company info if using external company
  const showCompanyInfo = externalCompanyId && externalCompanyId !== user.data?.id || user.data?.company?.id;

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Loading roles..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (!targetCompanyId && !loading) {
    return (
      <div className="space-y-2">
        <Select disabled>
          <SelectTrigger className={className}>
            <SelectValue placeholder="No company selected" />
          </SelectTrigger>
        </Select>
        <p className="text-sm text-muted-foreground">
          Company context is required to load roles
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      
      <Select
        key={roles.length} // Force re-render when roles change
        value={selected}
        onValueChange={onChange}
        disabled={disabled || !targetCompanyId}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder}>
            {/* Custom render for selected value to show role name */}
            {selectedRole ? selectedRole.name : ""}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {roles.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              <p>No roles available</p>
              {canManageRoles && (
                <p className="text-sm mt-1">Create your first role to get started</p>
              )}
            </div>
          ) : (
            roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col">
                    <span className="font-medium">{role.name}</span>
                    {role.description && (
                      <span className="text-xs text-muted-foreground">
                        {role.description}
                      </span>
                    )}
                  </div>
                  
                  {/* {canManageRoles && (
                    <div className="flex items-center gap-1 ml-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-blue-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                startUpdateRole(role);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit role</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`h-6 w-6 p-0 hover:bg-red-100 ${
                                    isRoleInUse(role) ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                  disabled={isRoleInUse(role)}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Role</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the role "{role.name}"?
                                    {isRoleInUse(role) && (
                                      <span className="block mt-2 text-red-600 font-medium">
                                        This role cannot be deleted because it's assigned to {role.memberCount} member(s) and {role.assignmentCount} assignment(s).
                                      </span>
                                    )}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteRole(role.id)}
                                    disabled={isRoleInUse(role)}
                                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                  >
                                    Delete Role
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {isRoleInUse(role) 
                                ? `Role in use (${role.memberCount + role.assignmentCount} assignments)`
                                : "Delete role"
                              }
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )} */}
                </div>
              </SelectItem>
            ))
          )}
          
          {canManageRoles && (
            <div className="border-t pt-2 mt-2">
              <Dialog open={isAddingRole} onOpenChange={setIsAddingRole}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-background"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add new role
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Role</DialogTitle>
                    <DialogDescription>
                      Create a new role for your team members.
                      {showCompanyInfo && (
                        <span className="block mt-1 text-xs">
                          Company: {externalCompanyId}
                        </span>
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="roleName">Role Name *</Label>
                      <Input
                        id="roleName"
                        placeholder="Enter role name"
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddRole();
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="roleDescription">Description</Label>
                      <Input
                        id="roleDescription"
                        placeholder="Enter role description (optional)"
                        value={newRoleDescription}
                        onChange={(e) => setNewRoleDescription(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddRole();
                        }}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddingRole(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddRole} disabled={!newRoleName.trim()}>
                      Create Role
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </SelectContent>
      </Select>

      {/* Update Role Dialog */}
      <Dialog open={!!isUpdatingRole} onOpenChange={() => setIsUpdatingRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update the role information.
              {showCompanyInfo && (
                <span className="block mt-1 text-xs">
                  Company: {externalCompanyId}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="updateRoleName">Role Name *</Label>
              <Input
                id="updateRoleName"
                placeholder="Enter role name"
                value={updateRoleName}
                onChange={(e) => setUpdateRoleName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isUpdatingRole) handleUpdateRole(isUpdatingRole);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="updateRoleDescription">Description</Label>
              <Input
                id="updateRoleDescription"
                placeholder="Enter role description (optional)"
                value={updateRoleDescription}
                onChange={(e) => setUpdateRoleDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isUpdatingRole) handleUpdateRole(isUpdatingRole);
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdatingRole(null)}>
              Cancel
            </Button>
            <Button 
              onClick={() => isUpdatingRole && handleUpdateRole(isUpdatingRole)}
              disabled={!updateRoleName.trim()}
            >
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}