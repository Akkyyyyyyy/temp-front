import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Save, X, Edit, Loader2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
    getProjectSections,
    updateProjectSections,
    IProjectSection
} from "@/api/project";

interface CreativeBriefTabProps {
    projectId: string;
}

export function CreativeBriefTab({ projectId }: CreativeBriefTabProps) {
    const { user } = useAuth();

    const [sections, setSections] = useState<IProjectSection[]>([]);
    const [originalSections, setOriginalSections] = useState<IProjectSection[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const titleRef = useRef<HTMLInputElement>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
const menuRefs = useRef<Map<string, HTMLDivElement>>(new Map());

const setMenuRef = (id: string) => (el: HTMLDivElement | null) => {
  if (el) menuRefs.current.set(id, el);
  else menuRefs.current.delete(id);
};

useEffect(() => {
  const handle = (e: MouseEvent) => {
    let inside = false;
    menuRefs.current.forEach(ref => {
      if (ref?.contains(e.target as Node)) inside = true;
    });
    if (!inside) setActiveMenu(null);
  };

  document.addEventListener("mousedown", handle);
  return () => document.removeEventListener("mousedown", handle);
}, []);


    // Load brief sections
    useEffect(() => {
        (async () => {
            try {
                const res = await getProjectSections(projectId);
                const brief = res?.data?.brief || [];
                setSections(brief);
                setOriginalSections(brief);
            } catch {
                toast.error("Failed to load creative brief");
            }
            setLoading(false);
        })();
    }, [projectId]);

    const saveSections = async (updated: IProjectSection[]) => {
        setIsSaving(true);
        try {
            await updateProjectSections({
                projectId,
                sectionType: "brief",
                sections: updated
            });
            setOriginalSections(updated);
            toast.success("Section saved successfully");
            return true;
        } catch {
            toast.error("Failed to save");
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const handleAdd = () => {
        const id = Date.now().toString();

        const newSection: IProjectSection = {
            id,
            type: "text",            // 🔒 TEXT ONLY
            title: "",
            content: "",
            order: Date.now()
        };

        setSections(prev => [newSection, ...prev]);
        setEditingId(id);

        setTimeout(() => titleRef.current?.focus(), 50);
    };

    const handleDelete = async (id: string) => {
        const updated = sections.filter(s => s.id !== id);
        setSections(updated);

        const ok = await saveSections(updated);
        if (!ok) setSections(originalSections);
    };

    if (loading)
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-studio-gold" />
                <span className="ml-3 text-muted-foreground">Loading Creative Brief...</span>
            </div>
        );

    return (
        <div className="space-y-6">
            <h4 className="font-medium text-foreground">Creative Brief</h4>

            {user.data.isAdmin && editingId === null && (
                <Button variant="outline" onClick={handleAdd}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Additional Brief
                </Button>
            )}

            {sections.map(section => {
                const isEditing = section.id === editingId;

                return (
                    <div key={section.id} className="p-3 rounded-md border border-border/20 transition-colors group hover:border-border/40">
                        {isEditing ? (
                            <form
                                className="space-y-4 bg-muted/30 p-3 rounded-lg"
                                onSubmit={async e => {
                                    e.preventDefault();
                                    const ok = await saveSections(sections);
                                    if (ok) setEditingId(null);
                                }}
                            >
                                <Input
                                    ref={titleRef}
                                    value={section.title}
                                    onChange={e =>
                                        setSections(prev =>
                                            prev.map(s => s.id === section.id ? { ...s, title: e.target.value } : s)
                                        )
                                    }
                                    placeholder="Enter Title"
                                    className="text-lg font-medium"
                                />

                                <Textarea
                                    rows={5}
                                    value={section.content as string}
                                    onChange={e =>
                                        setSections(prev =>
                                            prev.map(s => s.id === section.id ? { ...s, content: e.target.value } : s)
                                        )
                                    }
                                    placeholder="Enter Creative Brief"
                                />

                                <div className="flex gap-2">
                                    <Button size="sm" type="submit" disabled={isSaving}>
                                        <Save className="w-3 h-3 mr-1" />
                                        {isSaving ? "Saving..." : "Save"}
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={isSaving}
                                        onClick={() => {
                                            setSections(originalSections);
                                            setEditingId(null);
                                        }}
                                    >
                                        <X className="w-3 h-3 mr-1" />
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="flex items-start gap-3">
  <div className="flex-1">
    <div className="flex items-start justify-between gap-2">
      <div>
        <div className="text-xl font-medium text-foreground mb-1">
          {section.title}
        </div>

        <p className="text-lg text-muted-foreground">
          {section.content as string}
        </p>
      </div>

      {user.data.isAdmin && (
        <div className="relative" ref={setMenuRef(section.id)}>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            onClick={() =>
              setActiveMenu(activeMenu === section.id ? null : section.id)
            }
          >
            <MoreVertical className="w-3 h-3" />
          </Button>

          {activeMenu === section.id && (
            <div className="absolute right-0 top-6 z-10 bg-background border border-border/20 rounded-md shadow-sm py-1 min-w-[110px]">
              <button
                onClick={() => {
                  setEditingId(section.id);
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-muted/50"
              >
                <Edit className="w-3 h-3" />
                Edit
              </button>

              <button
                onClick={() => handleDelete(section.id)}
                className="w-full px-3 py-1.5 text-sm flex items-center gap-2 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
</div>

                        )}
                    </div>

                );
            })}
        </div>
    );
}
