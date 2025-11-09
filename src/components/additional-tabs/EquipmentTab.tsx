import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Loader2, Edit, Save, X, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getProjectEquipments, updateProjectEquipments, IProjectSection } from "@/api/additional-tabs";

interface EquipmentTabProps {
  projectId: string;
}

export function EquipmentTab({ projectId }: EquipmentTabProps) {
  const [equipments, setEquipments] = useState<IProjectSection[]>([]);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [equipmentItems, setEquipmentItems] = useState([{ id: "1", name: "" }]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editItems, setEditItems] = useState([{ id: "1", name: "" }]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Create a ref for each menu - we'll use a function to get refs
  const menuRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Fetch equipments data using your API function
  const fetchEquipments = async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    try {
      const result = await getProjectEquipments({ projectId });
      
      if (result.success && result.equipments) {
        setEquipments(result.equipments);
      } else {
        setEquipments([]);
      }
    } catch (error) {
      console.error("Error fetching equipments:", error);
      toast.error("Failed to load equipments");
      setEquipments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Save equipments to backend (silently, no toast on success)
  const saveEquipments = async (updatedEquipments: IProjectSection[]) => {
    try {
      await updateProjectEquipments({
        projectId,
        equipments: updatedEquipments
      });
    } catch (error: any) {
      console.error("Error saving equipments:", error);
      toast.error(error.message || "Failed to save equipments");
    }
  };

  useEffect(() => {
    fetchEquipments();
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

  // Start adding new equipment section
  const handleStartAdd = () => {
    setIsAdding(true);
    setNewItemTitle("");
    setEquipmentItems([{ id: "1", name: "" }]);
  };

  // Cancel adding new equipment section
  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewItemTitle("");
    setEquipmentItems([{ id: "1", name: "" }]);
  };

  // Add equipment item input field
  const addEquipmentItem = () => {
    setEquipmentItems(prev => [
      ...prev,
      { id: Date.now().toString(), name: "" }
    ]);
  };

  // Remove equipment item input field
  const removeEquipmentItem = (id: string) => {
    if (equipmentItems.length > 1) {
      setEquipmentItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // Update equipment item value
  const updateEquipmentItem = (id: string, value: string) => {
    setEquipmentItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, name: value } : item
      )
    );
  };

  // Add new equipment section
  const handleAddItem = async () => {
    if (!newItemTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }

    const validItems = equipmentItems.filter(item => item.name.trim());
    if (validItems.length === 0) {
      toast.error("Please add at least one equipment item");
      return;
    }

    const newEquipment: IProjectSection = {
      id: `equipment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: "list",
      title: newItemTitle.trim(),
      content: validItems.map(item => item.name.trim()),
      order: equipments.length
    };

    const updatedEquipments = [...equipments, newEquipment];
    setEquipments(updatedEquipments);
    setIsAdding(false);
    setNewItemTitle("");
    setEquipmentItems([{ id: "1", name: "" }]);
    saveEquipments(updatedEquipments);
  };

  // Delete equipment section
  const handleDeleteItem = async (itemId: string) => {
    const updatedEquipments = equipments.filter(item => item.id !== itemId);
    setEquipments(updatedEquipments);
    saveEquipments(updatedEquipments);
    setActiveMenu(null);
  };

  // Start editing equipment section
  const handleStartEdit = (item: IProjectSection) => {
    setEditingItemId(item.id);
    setEditTitle(item.title);
    setEditItems(
      Array.isArray(item.content) 
        ? item.content.map((content, index) => ({ 
            id: `edit_${index}_${Date.now()}`, 
            name: content 
          }))
        : [{ id: "1", name: "" }]
    );
    setActiveMenu(null);
  };

  // Add edit equipment item input field
  const addEditEquipmentItem = () => {
    setEditItems(prev => [
      ...prev,
      { id: `edit_${Date.now()}`, name: "" }
    ]);
  };

  // Remove edit equipment item input field
  const removeEditEquipmentItem = (id: string) => {
    if (editItems.length > 1) {
      setEditItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // Update edit equipment item value
  const updateEditEquipmentItem = (id: string, value: string) => {
    setEditItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, name: value } : item
      )
    );
  };

  // Save edited equipment section
  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      toast.error("Title cannot be empty");
      return;
    }

    const validItems = editItems.filter(item => item.name.trim());
    if (validItems.length === 0) {
      toast.error("Please add at least one equipment item");
      return;
    }

    const updatedEquipments = equipments.map(item =>
      item.id === editingItemId ? { 
        ...item, 
        title: editTitle.trim(),
        content: validItems.map(item => item.name.trim())
      } : item
    );
    setEquipments(updatedEquipments);
    setEditingItemId(null);
    setEditTitle("");
    setEditItems([{ id: "1", name: "" }]);
    saveEquipments(updatedEquipments);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditTitle("");
    setEditItems([{ id: "1", name: "" }]);
  };

  // Toggle menu
  const toggleMenu = (itemId: string) => {
    setActiveMenu(activeMenu === itemId ? null : itemId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading equipments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Add New Equipment Section */}
      {isAdding ? (
        <div className="p-3 bg-muted/30 rounded-lg border border-border/20">
          <div className="space-y-2">
            <Input
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              placeholder="Equipment title"
              className="h-8 text-sm"
              autoFocus
            />
            
            {/* Equipment Items */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Equipment items:</label>
              {equipmentItems.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2">
                  <Input
                    value={item.name}
                    onChange={(e) => updateEquipmentItem(item.id, e.target.value)}
                    placeholder={`Equipment item ${index + 1}`}
                    className="h-8 text-sm"
                  />
                  {equipmentItems.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeEquipmentItem(item.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={addEquipmentItem}
                className="h-7 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add More Items
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddItem}
                className="h-7 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Equipment
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelAdd}
                className="h-7 text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button 
          onClick={handleStartAdd}
          size="sm"
          variant="outline"
          className="h-8 text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add New Equipment
        </Button>
      )}

      {/* Equipment Sections */}
      <div className="space-y-2">
        {equipments.length === 0 && !isAdding ? (
          <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
            <p className="text-sm">No equipment sections yet</p>
            <p className="text-xs mt-1">Add your first equipment section to get started</p>
          </div>
        ) : (
          equipments.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-md border border-border/20 transition-colors group hover:border-border/40 bg-background"
            >
              {editingItemId === item.id ? (
                // Edit mode
                <div className="space-y-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Equipment title"
                    className="h-8 text-sm"
                    autoFocus
                  />
                  
                  {/* Edit Equipment Items */}
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Equipment items:</label>
                    {editItems.map((editItem, index) => (
                      <div key={editItem.id} className="flex items-center gap-2">
                        <Input
                          value={editItem.name}
                          onChange={(e) => updateEditEquipmentItem(editItem.id, e.target.value)}
                          placeholder={`Equipment item ${index + 1}`}
                          className="h-8 text-sm"
                        />
                        {editItems.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeEditEquipmentItem(editItem.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addEditEquipmentItem}
                      className="h-7 text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add More Items
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      className="h-7 text-xs"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="h-7 text-xs"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View mode
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground mb-2">
                      {item.title}
                    </div>
                    {Array.isArray(item.content) && item.content.length > 0 && (
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {item.content.map((content, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="mt-1.5 w-1 h-1 bg-muted-foreground rounded-full flex-shrink-0" />
                            <span>{content}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  
                  {/* Dropdown Menu - FIXED: Use individual ref for each menu */}
                  <div className="relative" ref={setMenuRef(item.id)}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleMenu(item.id)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    >
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                    
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
        )}
      </div>
    </div>
  );
}