import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Loader2, Edit, Save, X, MoreVertical, Folder, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { getProjectChecklist, IChecklistItem, updateProjectChecklist } from "@/api/additional-tabs";
import { useAuth } from "@/context/AuthContext";

interface ChecklistTabProps {
  projectId: string;
}

export function ChecklistTab({ projectId }: ChecklistTabProps) {
  const [checklist, setChecklist] = useState<IChecklistItem[]>([]);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const { user } = useAuth();

  // Create a ref for each menu - we'll use a function to get refs
  const menuRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Fetch checklist data using your API function
  const fetchChecklist = async () => {
    if (!projectId) return;

    setIsLoading(true);
    try {
      const result = await getProjectChecklist({ projectId });

      if (result.success && result.checklist) {
        setChecklist(result.checklist);
      } else {
        setChecklist([]);
      }
    } catch (error) {
      console.error("Error fetching checklist:", error);
      toast.error("Failed to load checklist");
      setChecklist([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Save checklist to backend (silently, no toast on success)
  const saveChecklist = async (updatedChecklist: IChecklistItem[]) => {
    try {
      await updateProjectChecklist({
        projectId,
        checklist: updatedChecklist
      });
    } catch (error: any) {
      console.error("Error saving checklist:", error);
      toast.error(error.message || "Failed to save checklist");
    }
  };

  useEffect(() => {
    fetchChecklist();
  }, [projectId]);

  // Handle click outside to close dropdown - FIXED VERSION
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside ALL menu elements
      let clickedInsideAnyMenu = false;

      menuRefs.current.forEach((ref, itemId) => {
        if (ref && ref.contains(event.target as Node)) {
          clickedInsideAnyMenu = true;
        }
      });

      if (!clickedInsideAnyMenu) {
        setActiveMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Function to set ref for each menu
  const setMenuRef = (itemId: string) => (el: HTMLDivElement | null) => {
    if (el) {
      menuRefs.current.set(itemId, el);
    } else {
      menuRefs.current.delete(itemId);
    }
  };

  // Start adding new item
  const handleStartAdd = () => {
    setIsAdding(true);
  };

  // Cancel adding new item
  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewItemTitle("");
    setNewItemDescription("");
  };

  // Add new checklist item
  const handleAddItem = async () => {
    if (!newItemTitle.trim()) {
      toast.error("Please enter an item title");
      return;
    }

    const newItem: IChecklistItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: newItemTitle.trim(),
      description: newItemDescription.trim() || undefined,
      completed: false
    };

    const updatedChecklist = [...checklist, newItem];
    setChecklist(updatedChecklist);
    setNewItemTitle("");
    setNewItemDescription("");
    setIsAdding(false);
    saveChecklist(updatedChecklist);
  };

  // Toggle item completion
  const handleToggleItem = async (itemId: string) => {
    const updatedChecklist = checklist.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updatedChecklist);
    saveChecklist(updatedChecklist);
  };

  // Delete checklist item
  const handleDeleteItem = async (itemId: string) => {
    const updatedChecklist = checklist.filter(item => item.id !== itemId);
    setChecklist(updatedChecklist);
    saveChecklist(updatedChecklist);
    setActiveMenu(null);
  };

  // Start editing item
  const handleStartEdit = (item: IChecklistItem) => {
    setEditingItemId(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description || "");
    setActiveMenu(null);
  };

  // Save edited item
  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      toast.error("Item title cannot be empty");
      return;
    }

    const updatedChecklist = checklist.map(item =>
      item.id === editingItemId ? {
        ...item,
        title: editTitle.trim(),
        description: editDescription.trim() || undefined
      } : item
    );
    setChecklist(updatedChecklist);
    setEditingItemId(null);
    setEditTitle("");
    setEditDescription("");
    saveChecklist(updatedChecklist);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditTitle("");
    setEditDescription("");
  };

  // Toggle menu
  const toggleMenu = (itemId: string) => {
    setActiveMenu(activeMenu === itemId ? null : itemId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-studio-gold" />
        <span className="ml-3 text-muted-foreground">Loading Checklist...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-foreground">Checklists</h4>
      </div>
      {/* Add New Item Section */}
      {isAdding ? (
        <div className="p-3 bg-muted/30 rounded-lg border border-border/20">
          <div className="space-y-4">
            <Input
              value={newItemTitle}
              type="text"
              onChange={(e) => setNewItemTitle(e.target.value)}
              placeholder="Item title"
              className="w-full text-lg font-medium bg-background border border-border px-2 py-1 rounded-lg"
              autoFocus
            />
            <Textarea
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              rows={5}
              placeholder="Add description (optional)"
              className="w-full text-sm text-foreground bg-background border border-border rounded-lg px-2 py-1"
            />
            <div className="flex gap-3">
              <Button
                size="sm"
                onClick={handleAddItem}
                className="h-9 text-md"
              >
                <Save className="w-3 h-3 mr-1" />
                      Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelAdd}
                className="h-9 text-md"
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : (
        user.data.isAdmin == true && (
          <Button
            onClick={handleStartAdd}
            size="sm"
            variant="outline"
            className="h-10 text-sm"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add New Item
          </Button>)
      )}

      {/* Checklist Items */}
      <div className="space-y-6">
        {
          checklist.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-md border border-border/20 transition-colors group hover:border-border/40 ${item.completed ? 'bg-muted/30 opacity-75' : 'bg-background'
                }`}
            >
              {editingItemId === item.id ? (
                // Edit mode
                <div className="space-y-4">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Item title"
                    className="w-full text-lg bg-background border border-border px-2 py-1 rounded-lg"
                    autoFocus
                  />
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={5}
                    placeholder="Add description (optional)"
                    className="w-full text-sm text-foreground bg-background border border-border rounded-lg px-2 py-1"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      className="h-9 text-md"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="h-9 text-md"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View mode
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={() => handleToggleItem(item.id)}
                        className="h-4 w-4 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      />
                      <div
                        className={`text-lg cursor-pointer select-none ${item.completed ? 'text-muted-foreground' : 'text-foreground'
                          }`}
                        onClick={() => handleToggleItem(item.id)}
                      >
                        {item.title}
                      </div>
                    </div>
                    {item.description && (
                      <div
                        className={`text-md cursor-pointer pl-6 ${ 
                          item.completed
                            ? 'text-muted-foreground/70'
                            : 'text-muted-foreground'
                          }`}
                        onClick={() => handleToggleItem(item.id)}
                      >
                        {item.description}
                      </div>
                    )}
                  </div>

                  {/* Dropdown Menu */}
                  <div className="relative" ref={setMenuRef(item.id)}>
                    {user.data.isAdmin == true && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleMenu(item.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      >
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    )}

                    {/* Menu Dropdown */}
                    {activeMenu === item.id && (
                      <div className="absolute right-0 top-6 z-10 bg-background border border-border/20 rounded-md shadow-sm py-1 min-w-[100px]">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted/50 flex items-center gap-2 text-foreground"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="w-full text-left px-3 py-1.5 text-sm hover:bg-destructive/10 flex items-center gap-2 text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
}