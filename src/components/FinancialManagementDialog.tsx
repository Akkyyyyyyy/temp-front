import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  Plus, 
  Trash2, 
  Edit,
  Save,
  X
} from "lucide-react";

interface FinancialEntry {
  id: string;
  type: 'revenue' | 'cost';
  category: string;
  amount: number;
  description: string;
  date: string;
  projectName?: string;
  teamMember?: string;
}

interface FinancialManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const revenueCategories = [
  'Photography Session',
  'Wedding Package',
  'Corporate Event',
  'Product Shoot',
  'Portrait Session',
  'Editing Services',
  'Equipment Rental',
  'Team Member',
  'Other'
];

const costCategories = [
  'Team Members',
  'Editors',
  'Albums',
  'Travel',
  'Photographers',
  'Videographers', 
  'Equipment',
  'Assistant Fees',
  'Location Rental',
  'Props & Supplies',
  'Software/Subscriptions',
  'Marketing',
  'Insurance',
  'Other'
];

const teamMembers = [
  'Alan',
  'Amit', 
  'Iq',
  'Jivan',
  'Josh',
  'Martyn',
  'Nikhil',
  'Usman'
];

export function FinancialManagementDialog({ open, onOpenChange }: FinancialManagementDialogProps) {
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  const [customCategories, setCustomCategories] = useState<{revenue: string[], cost: string[]}>({revenue: [], cost: []});
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [newCustomCategory, setNewCustomCategory] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [categoryDetailView, setCategoryDetailView] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newEntry, setNewEntry] = useState({
    type: 'revenue' as 'revenue' | 'cost',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    projectName: '',
    teamMember: ''
  });

  // Load entries and custom categories from localStorage on mount
  useEffect(() => {
    const savedEntries = localStorage.getItem('financialEntries');
    const savedCustomCategories = localStorage.getItem('customCategories');
    if (savedEntries) {
      try {
        setEntries(JSON.parse(savedEntries));
      } catch (error) {
        console.error('Error loading financial entries:', error);
      }
    }
    if (savedCustomCategories) {
      try {
        setCustomCategories(JSON.parse(savedCustomCategories));
      } catch (error) {
        console.error('Error loading custom categories:', error);
      }
    }
  }, []);

  // Save entries and custom categories to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('financialEntries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('customCategories', JSON.stringify(customCategories));
  }, [customCategories]);

  const addCustomCategory = () => {
    if (!newCustomCategory.trim() || newEntry.type === undefined) return;
    
    const trimmedCategory = newCustomCategory.trim();
    setCustomCategories(prev => ({
      ...prev,
      [newEntry.type]: [...prev[newEntry.type], trimmedCategory]
    }));
    setNewEntry(prev => ({ ...prev, category: trimmedCategory }));
    setNewCustomCategory('');
    setShowCustomCategoryInput(false);
  };

  const addCustomCostCategory = () => {
    if (!newCustomCategory.trim()) return;
    
    const trimmedCategory = newCustomCategory.trim();
    setCustomCategories(prev => ({
      ...prev,
      cost: [...prev.cost, trimmedCategory]
    }));
    setNewCustomCategory('');
    setShowCustomCategoryInput(false);
  };

  const addEntry = () => {
    if (!newEntry.category || !newEntry.amount) return;

    const entry: FinancialEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: newEntry.type,
      category: newEntry.category,
      amount: parseFloat(newEntry.amount),
      description: newEntry.description,
      date: newEntry.date,
      projectName: newEntry.projectName || undefined,
      teamMember: newEntry.teamMember || undefined
    };

    setEntries(prev => [...prev, entry]);
    setNewEntry({
      type: 'revenue',
      category: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      projectName: '',
      teamMember: ''
    });
  };

  const updateEntry = (id: string, updates: Partial<FinancialEntry>) => {
    setEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, ...updates } : entry
    ));
    setEditingEntry(null);
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const totalRevenue = entries
    .filter(entry => entry.type === 'revenue')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const totalCosts = entries
    .filter(entry => entry.type === 'cost')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const totalProfit = totalRevenue - totalCosts;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Financial Management
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[calc(85vh-100px)]">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {entries.filter(e => e.type === 'revenue').length} entries
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setShowCostBreakdown(!showCostBreakdown)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
                <TrendingDown className="w-4 h-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalCosts)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {entries.filter(e => e.type === 'cost').length} entries
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <Calculator className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalProfit)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {totalRevenue > 0 ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}% margin` : 'No revenue yet'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Cost Breakdown Section */}
          {showCostBreakdown && (
            <div className="mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cost Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {entries.filter(e => e.type === 'cost').length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <TrendingDown className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No cost entries yet</p>
                      </div>
                    )}

                    {/* Priority Categories - Always show these first */}
                    {['Team Members', 'Editors', 'Albums', 'Travel'].map(category => {
                      const categoryEntries = entries.filter(e => e.type === 'cost' && e.category === category);
                      const categoryTotal = categoryEntries.reduce((sum, entry) => sum + entry.amount, 0);
                      
                      return (
                        <Button
                          key={category}
                          variant="outline"
                          className="w-full h-auto p-4 justify-between border-l-4 border-l-primary hover:bg-muted/70"
                          onClick={() => setCategoryDetailView(category)}
                        >
                          <div className="text-left">
                            <div className="font-medium">{category}</div>
                            <p className="text-sm text-muted-foreground">
                              {categoryEntries.length} {categoryEntries.length === 1 ? 'entry' : 'entries'}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`font-semibold ${categoryTotal > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                              {formatCurrency(categoryTotal)}
                            </span>
                            <div className="text-xs text-muted-foreground mt-1">View Details →</div>
                          </div>
                        </Button>
                      );
                    })}

                    
                    {/* Other Categories - Only show if they have entries */}
                    {[...costCategories.slice(4), ...customCategories.cost].map(category => {
                      const categoryEntries = entries.filter(e => e.type === 'cost' && e.category === category);
                      const categoryTotal = categoryEntries.reduce((sum, entry) => sum + entry.amount, 0);
                      
                      if (categoryTotal === 0) return null;
                      
                      return (
                        <div key={category} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <div>
                            <span className="font-medium">{category}</span>
                            <p className="text-sm text-muted-foreground">
                              {categoryEntries.length} {categoryEntries.length === 1 ? 'entry' : 'entries'}
                            </p>
                          </div>
                          <span className="font-semibold text-red-600">
                            {formatCurrency(categoryTotal)}
                          </span>
                        </div>
                      );
                    })}
                    
                    {/* Add Custom Category Button */}
                    <div className="pt-2 border-t">
                      {!showCustomCategoryInput ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowCustomCategoryInput(true)}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Custom Category
                        </Button>
                      ) : (
                        <div className="space-y-2 p-3 border rounded-lg bg-background">
                          <Label className="text-sm">New Cost Category</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter category name"
                              value={newCustomCategory}
                              onChange={(e) => setNewCustomCategory(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && addCustomCostCategory()}
                            />
                            <Button size="sm" onClick={addCustomCostCategory} disabled={!newCustomCategory.trim()}>
                              Add
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              setShowCustomCategoryInput(false);
                              setNewCustomCategory('');
                            }}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs defaultValue="entries" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="entries">All Entries</TabsTrigger>
              <TabsTrigger value="add">Add New Entry</TabsTrigger>
            </TabsList>

            <TabsContent value="entries" className="flex-1 overflow-hidden">
              <div className="border rounded-lg overflow-y-auto h-full">
                {entries.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No financial entries yet</p>
                    <p className="text-sm">Start by adding your first revenue or cost entry</p>
                  </div>
                ) : (
                  <div className="space-y-2 p-4">
                    {entries.map((entry) => (
                      <Card key={entry.id} className={`border-l-4 ${entry.type === 'revenue' ? 'border-l-green-500' : 'border-l-red-500'}`}>
                        <CardContent className="pt-4">
                          {editingEntry === entry.id ? (
                            <EditEntryForm
                              entry={entry}
                              onSave={(updates) => updateEntry(entry.id, updates)}
                              onCancel={() => setEditingEntry(null)}
                            />
                          ) : (
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant={entry.type === 'revenue' ? 'default' : 'destructive'}>
                                    {entry.type}
                                  </Badge>
                                  <span className="font-semibold">{entry.category}</span>
                                   {entry.projectName && (
                                     <Badge variant="outline">{entry.projectName}</Badge>
                                   )}
                                   {entry.teamMember && (
                                     <Badge variant="secondary">{entry.teamMember}</Badge>
                                   )}
                                 </div>
                                 
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground mb-1">Amount</p>
                                    <p className={`font-semibold text-lg ${entry.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                                      {formatCurrency(entry.amount)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground mb-1">Date</p>
                                    <p>{formatDate(entry.date)}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground mb-1">Description</p>
                                    <p className="text-sm">{entry.description || 'No description'}</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex gap-1 ml-4">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingEntry(entry.id)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteEntry(entry.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="add" className="flex-1">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Financial Entry</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={newEntry.type}
                        onValueChange={(value: 'revenue' | 'cost') => 
                          setNewEntry(prev => ({ ...prev, type: value, category: '' }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="revenue">Revenue</SelectItem>
                          <SelectItem value="cost">Cost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={newEntry.category}
                        onValueChange={(value) => {
                          if (value === 'add-custom') {
                            setShowCustomCategoryInput(true);
                          } else {
                            setNewEntry(prev => ({ ...prev, category: value }));
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...(newEntry.type === 'revenue' ? revenueCategories : costCategories), ...customCategories[newEntry.type]].map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                          <SelectItem value="add-custom">+ Add Custom Category</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {/* Custom Category Input */}
                      {showCustomCategoryInput && (
                        <div className="space-y-2 p-3 border rounded-lg bg-muted/50">
                          <Label className="text-sm">New Category Name</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter category name"
                              value={newCustomCategory}
                              onChange={(e) => setNewCustomCategory(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && addCustomCategory()}
                            />
                            <Button size="sm" onClick={addCustomCategory} disabled={!newCustomCategory.trim()}>
                              Add
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              setShowCustomCategoryInput(false);
                              setNewCustomCategory('');
                            }}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Amount ($)</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={newEntry.amount}
                        onChange={(e) => setNewEntry(prev => ({ ...prev, amount: e.target.value }))}
                      />
                  </div>

                  {/* Team Member Selection - Only show when Team Member category is selected */}
                  {newEntry.category === 'Team Member' && (
                    <div className="space-y-2">
                      <Label>Select Team Member</Label>
                      <Select
                        value={newEntry.teamMember}
                        onValueChange={(value) => setNewEntry(prev => ({ ...prev, teamMember: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose team member" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMembers.map(member => (
                            <SelectItem key={member} value={member}>{member}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={newEntry.date}
                        onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Project Name (Optional)</Label>
                    <Input
                      placeholder="Associated project name"
                      value={newEntry.projectName}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, projectName: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <Textarea
                      placeholder="Additional details about this entry"
                      value={newEntry.description}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                      Close
                    </Button>
                    <Button 
                      onClick={addEntry}
                      disabled={!newEntry.category || !newEntry.amount}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Entry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Category Detail View */}
        {categoryDetailView && (
          <div className="absolute inset-0 bg-background z-10 flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{categoryDetailView} Details</h2>
                  <p className="text-muted-foreground">Detailed breakdown and management</p>
                </div>
                <Button variant="outline" onClick={() => setCategoryDetailView(null)}>
                  ← Back to Overview
                </Button>
              </div>
              
              {/* Search Bar */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search entries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto">
              <CategoryDetailScreen 
                category={categoryDetailView}
                entries={entries.filter(e => e.type === 'cost' && e.category === categoryDetailView)}
                teamMembers={teamMembers}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                searchQuery={searchQuery}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Category Detail Screen Component
function CategoryDetailScreen({ 
  category, 
  entries, 
  teamMembers, 
  formatCurrency, 
  formatDate,
  searchQuery 
}: { 
  category: string;
  entries: FinancialEntry[];
  teamMembers: string[];
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
  searchQuery: string;
}) {
  // Filter entries based on search query
  const filteredEntries = entries.filter(entry => {
    const searchLower = searchQuery.toLowerCase();
    return (
      entry.description.toLowerCase().includes(searchLower) ||
      entry.teamMember?.toLowerCase().includes(searchLower) ||
      entry.projectName?.toLowerCase().includes(searchLower) ||
      entry.amount.toString().includes(searchQuery)
    );
  });
  
  const totalAmount = filteredEntries.reduce((sum, entry) => sum + entry.amount, 0);
  
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{category} Summary</span>
            <span className="text-2xl font-bold text-red-600">{formatCurrency(totalAmount)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Showing Entries</p>
              <p className="text-xl font-semibold">{filteredEntries.length}</p>
              {searchQuery && <p className="text-xs text-muted-foreground">of {entries.length} total</p>}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average Amount</p>
              <p className="text-xl font-semibold">
                {filteredEntries.length > 0 ? formatCurrency(totalAmount / filteredEntries.length) : formatCurrency(0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Latest Entry</p>
              <p className="text-xl font-semibold">
                {filteredEntries.length > 0 ? formatDate(filteredEntries[filteredEntries.length - 1].date) : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members Breakdown (for Team Members category) */}
      {category === 'Team Members' && (
        <Card>
          <CardHeader>
            <CardTitle>Team Member Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamMembers.map(member => {
                const memberEntries = entries.filter(entry => entry.teamMember === member);
                const memberTotal = memberEntries.reduce((sum, entry) => sum + entry.amount, 0);
                
                if (memberTotal === 0) return null;
                
                return (
                  <div key={member} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{member}</h4>
                      <p className="text-sm text-muted-foreground">
                        {memberEntries.length} payment{memberEntries.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-red-600">
                      {formatCurrency(memberTotal)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Entries List */}
      <Card>
        <CardHeader>
          <CardTitle>All {category} Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{searchQuery ? `No entries found matching "${searchQuery}"` : `No entries found for ${category}`}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-lg text-red-600">
                          {formatCurrency(entry.amount)}
                        </span>
                        {entry.teamMember && (
                          <Badge variant="secondary">{entry.teamMember}</Badge>
                        )}
                        {entry.projectName && (
                          <Badge variant="outline">{entry.projectName}</Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p>{formatDate(entry.date)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Description</p>
                          <p>{entry.description || 'No description'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Edit form component for inline editing
function EditEntryForm({ 
  entry, 
  onSave, 
  onCancel 
}: { 
  entry: FinancialEntry;
  onSave: (updates: Partial<FinancialEntry>) => void;
  onCancel: () => void;
}) {
  const [editData, setEditData] = useState({
    category: entry.category,
    amount: entry.amount.toString(),
    description: entry.description,
    date: entry.date,
    projectName: entry.projectName || '',
    teamMember: entry.teamMember || ''
  });

  // Get custom categories from localStorage
  const getCustomCategories = () => {
    try {
      const saved = localStorage.getItem('customCategories');
      return saved ? JSON.parse(saved) : {revenue: [], cost: []};
    } catch {
      return {revenue: [], cost: []};
    }
  };

  const customCategories = getCustomCategories();
  const allCategories = entry.type === 'revenue' 
    ? [...revenueCategories, ...customCategories.revenue]
    : [...costCategories, ...customCategories.cost];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Category</Label>
          <Select
            value={editData.category}
            onValueChange={(value) => setEditData(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {allCategories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
          <Label className="text-xs">Amount ($)</Label>
          <Input
            type="number"
            value={editData.amount}
            onChange={(e) => setEditData(prev => ({ ...prev, amount: e.target.value }))}
            className="h-8"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Date</Label>
          <Input
            type="date"
            value={editData.date}
            onChange={(e) => setEditData(prev => ({ ...prev, date: e.target.value }))}
            className="h-8"
          />
        </div>

        <div>
          <Label className="text-xs">Project Name</Label>
          <Input
            value={editData.projectName}
            onChange={(e) => setEditData(prev => ({ ...prev, projectName: e.target.value }))}
            className="h-8"
            placeholder="Optional"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs">Description</Label>
        <Textarea
          value={editData.description}
          onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
          className="min-h-[60px]"
          placeholder="Optional"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onCancel}>
          <X className="w-3 h-3 mr-1" />
          Cancel
        </Button>
        <Button 
          size="sm" 
          onClick={() => onSave({
            category: editData.category,
            amount: parseFloat(editData.amount),
            description: editData.description,
            date: editData.date,
            projectName: editData.projectName || undefined
          })}
          disabled={!editData.category || !editData.amount}
        >
          <Save className="w-3 h-3 mr-1" />
          Save
        </Button>
      </div>
    </div>
  );
}