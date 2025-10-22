import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { ProjectFormData } from './AddProjectDialog';
import { useState } from 'react';

interface ProjectStep1Props {
    formData: ProjectFormData;
    setFormData: (data: ProjectFormData | ((prev: ProjectFormData) => ProjectFormData)) => void;
    errors: Record<string, string>;
    setErrors: (errors: Record<string, string>) => void;
    includeClient: boolean;
    setIncludeClient: (include: boolean) => void;
    updateClientField: (field: keyof ProjectFormData['client'], value: string) => void;
}

const hours = Array.from({ length: 25 }, (_, i) => i);

export function ProjectStep1({
    formData,
    setFormData,
    errors,
    setErrors,
    includeClient,
    setIncludeClient,
    updateClientField
}: ProjectStep1Props) {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
        if (!range?.from) {
            // If no from date, clear selection
            setFormData(prev => ({
                ...prev,
                startDate: '',
                endDate: ''
            }));
            return;
        }

        if (range.from && range.to) {
            // Complete range selected
            setFormData(prev => ({
                ...prev,
                startDate: format(range.from!, "yyyy-MM-dd"),
                endDate: format(range.to!, "yyyy-MM-dd")
            }));
            
            // Clear errors and close calendar
            if (errors.startDate || errors.endDate) {
                setErrors({ ...errors, startDate: '', endDate: '' });
            }
            setIsCalendarOpen(false);
        } else if (range.from && !range.to) {
            // Only start date selected, keep calendar open for end date selection
            setFormData(prev => ({
                ...prev,
                startDate: format(range.from, "yyyy-MM-dd"),
                endDate: ''
            }));
        }
    };

    const handleClearDates = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering popover close
        setFormData(prev => ({
            ...prev,
            startDate: '',
            endDate: ''
        }));
        // Don't close the calendar - let user pick new dates immediately
    };

    const handleCloseCalendar = () => {
        setIsCalendarOpen(false);
    };

    return (
        <div className="space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                    id="projectName"
                    value={formData.projectName}
                    onChange={(e) => {
                        setFormData(prev => ({ ...prev, projectName: e.target.value }));
                        if (errors.projectName) {
                            setErrors({ ...errors, projectName: '' });
                        }
                    }}
                    placeholder="Enter project name"
                    required
                    className={errors.projectName ? 'border-red-500' : ''}
                />
                {errors.projectName && (
                    <p className="text-red-500 text-sm">{errors.projectName}</p>
                )}
            </div>

               {/* Date Range Section */}
            <div className="space-y-2">
                <Label htmlFor="dateRange">Select Date Range *</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={`w-full justify-start text-left font-normal ${errors.startDate || errors.endDate ? 'border-red-500' : ''}`}
                            id="dateRange"
                        >
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            {formData.startDate && formData.endDate ? (
                                <>
                                    {format(new Date(formData.startDate), "PPP")} - {format(new Date(formData.endDate), "PPP")}
                                </>
                            ) : formData.startDate ? (
                                `Select end date for ${format(new Date(formData.startDate), "PPP")}`
                            ) : (
                                <span>Pick a date range</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                        className="w-auto p-0" 
                        align="start"
                        sideOffset={4}
                    >
                        <div className="flex flex-col">
                            <div className="flex justify-between items-center p-2 border-b">
                                <span className="text-sm font-medium">
                                    {formData.startDate && !formData.endDate 
                                        ? 'Select end date' 
                                        : 'Select date range'
                                    }
                                </span>
                                {(formData.startDate || formData.endDate) && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClearDates}
                                        className="h-6 px-2 text-xs"
                                    >
                                        <X className="h-3 w-3 mr-1" />
                                        Clear
                                    </Button>
                                )}
                            </div>
                            <Calendar
                                mode="range"
                                classNames={{ 
                                    day_today: "",
                                }}
                                defaultMonth={formData.startDate ? new Date(formData.startDate) : new Date()}
                                selected={
                                    formData.startDate 
                                        ? { 
                                            from: new Date(formData.startDate), 
                                            to: formData.endDate ? new Date(formData.endDate) : undefined 
                                          }
                                        : undefined
                                }
                                onSelect={handleDateSelect}
                                initialFocus
                                numberOfMonths={1}
                            />
                        </div>
                    </PopoverContent>
                </Popover>
                {(errors.startDate || errors.endDate) && (
                    <p className="text-red-500 text-sm">{errors.startDate || errors.endDate}</p>
                )}
            </div>

            {/* Time Section */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="startHour">Start Time</Label>
                    <Select
                        value={formData.startHour.toString()}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, startHour: parseInt(value) }))}
                    >
                        <SelectTrigger className="bg-background border-border">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border shadow-lg">
                            {hours
                                .filter(hour => hour !== 24)
                                .map((hour) => (
                                    <SelectItem key={hour} value={hour.toString()} className="hover:bg-muted">
                                        {`${hour}:00`}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="endHour">End Time</Label>
                    <Select
                        value={formData.endHour.toString()}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, endHour: parseInt(value) }))}
                    >
                        <SelectTrigger className={`bg-background ${errors.endHour ? 'border-red-500' : 'border-border'}`}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border shadow-lg">
                            {hours.filter(h => h > formData.startHour).map((hour) => (
                                <SelectItem key={hour} value={hour.toString()} className="hover:bg-muted">
                                    {`${hour}:00`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.endHour && (
                        <p className="text-red-500 text-sm">{errors.endHour}</p>
                    )}
                </div>
            </div>

            {/* Client Information Section */}
            <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="includeClient"
                        checked={includeClient}
                        onChange={(e) => setIncludeClient(e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    <Label htmlFor="includeClient" className="text-base font-medium">
                        Include Client Information
                    </Label>
                </div>

                {includeClient && (
                    <div className="grid grid-cols-1 gap-4 p-4 bg-muted/20 rounded-lg border">
                        <div className="space-y-2">
                            <Label htmlFor="clientName">Client Name *</Label>
                            <Input
                                id="clientName"
                                value={formData.client.name}
                                onChange={(e) => updateClientField('name', e.target.value)}
                                placeholder="Enter client name"
                                className={errors.clientName ? 'border-red-500' : ''}
                                maxLength={100}
                            />
                            {errors.clientName && (
                                <p className="text-red-500 text-sm">{errors.clientName}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="clientEmail">Client Email *</Label>
                                <Input
                                    id="clientEmail"
                                    type="email"
                                    value={formData.client.email}
                                    onChange={(e) => updateClientField('email', e.target.value)}
                                    placeholder="client@example.com"
                                    className={errors.clientEmail ? 'border-red-500' : ''}
                                    maxLength={100}

                                />
                                {errors.clientEmail && (
                                    <p className="text-red-500 text-sm">{errors.clientEmail}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="clientMobile">Client Mobile *</Label>
                                <Input
                                    id="clientMobile"
                                    value={formData.client.mobile}
                                    onChange={(e) => {
                                        const onlyDigits = e.target.value.replace(/\D/g, '');
                                        updateClientField('mobile', onlyDigits);
                                    }}
                                    placeholder="+1 (555) 123-4567"
                                    className={errors.clientMobile ? 'border-red-500' : ''}
                                    maxLength={15}
                                />

                                {errors.clientMobile && (
                                    <p className="text-red-500 text-sm">{errors.clientMobile}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}