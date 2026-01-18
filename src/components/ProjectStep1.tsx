import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { ProjectFormData } from './AddProjectDialog';
import { useRef, useState } from 'react';
import { PhoneInput } from 'react-international-phone';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from './ui/textarea';

interface ProjectStep1Props {
    formData: ProjectFormData;
    setFormData: (data: ProjectFormData | ((prev: ProjectFormData) => ProjectFormData)) => void;
    errors: Record<string, string>;
    setErrors: (errors: Record<string, string>) => void;
    includeClient: boolean;
    setIncludeClient: (include: boolean) => void;
    updateClientField: (field: keyof ProjectFormData['client'], value: string) => void;
}


export function ProjectStep1({
    formData,
    setFormData,
    errors,
    setErrors,
    includeClient,
    setIncludeClient,
    updateClientField
}: ProjectStep1Props) {
    const colorInputRef = useRef<HTMLInputElement>(null);
    const handleColorChange = (color: string) => {
        setFormData(prev => ({ ...prev, color }));
    };

    const handlePhoneChange = (phone: string) => {
        updateClientField('mobile', phone);
        // Clear mobile error when user starts typing
        if (errors.clientMobile) {
            setErrors({ ...errors, clientMobile: '' });
        }
    };

    return (
        <div className="space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
                <div className='flex items-center justify-between'>
                    <Label htmlFor="projectName">Project Name <span className='text-red-500'>*</span></Label>
                    <div className="h-6 flex items-center">
                        {errors.projectName && (
                            <p className="text-red-500 text-sm">{errors.projectName}</p>
                        )}
                    </div>
                </div>
                <Input
                    id="projectName"
                    value={formData.projectName}
                    onChange={(e) => {
                        setFormData(prev => ({ ...prev, projectName: e.target.value }));
                        if (errors.projectName) {
                            setErrors({ ...errors, projectName: '' });
                        }
                    }}
                    maxLength={100}
                    placeholder="Enter project name (This will appear on the calendar)"
                    required
                />
            </div>

            {/* Color Picker */}
            <div className="space-y-3">
                <div className='flex items-center justify-between'>
                    <Label className="text-sm font-medium">Colour <span className='text-red-500'>*</span></Label>

                    <div className="h-6 flex items-center">
                        {errors.color && (
                            <p className="text-red-500 text-sm">{errors.color}</p>
                        )}
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                        <div className="relative">
                            <input
                                ref={colorInputRef}
                                type="color"
                                value={formData.color}
                                onChange={(e) => handleColorChange(e.target.value)}
                                className="absolute inset-0 w-12 h-12 opacity-0 cursor-pointer"
                                style={{ zIndex: 10 }}
                            />
                            <span
                                className={`
                                  block w-12 h-12 rounded-md border-2 cursor-pointer transition-all duration-200
                                  ${formData.color ? 'border-border' : 'border-dashed border-muted-foreground/30'}
                                `}
                                style={{ backgroundColor: formData.color }}
                            />
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-mono text-muted-foreground">
                                    {formData.color}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Click the color box to pick a custom color
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            <div className="space-y-2">
                <div className='flex items-center justify-between'>
                    <Label htmlFor="description">Description</Label>
                    <div className="h-6 flex items-center">
                        {errors.description && (
                            <p className="text-red-500 text-sm">{errors.description}</p>
                        )}
                    </div>
                </div>
                <Textarea
                    id="description"
                    value={formData.description}
                    maxLength={350}
                    onChange={(e) => {
                        setFormData(prev => ({ ...prev, description: e.target.value }));
                    }}
                    placeholder="Enter notes about this booking..."
                    rows={4}
                />
            </div>

            {/* Client Information Section - Updated to match Edit Project style */}
            <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="includeClientInfo"
                        checked={includeClient}
                        onCheckedChange={(checked) => setIncludeClient(!!checked)}
                    />
                    <Label htmlFor="includeClientInfo" className="text-sm font-medium cursor-pointer">
                        Include Client Information
                    </Label>
                </div>

                {includeClient && (
                    <div className="grid grid-cols-1 gap-4 pl-6 border-l-2 border-border">
                        <div className="space-y-2">
                            <div className='flex items-center justify-between'>
                                <Label htmlFor="clientName">Client Name <span className='text-red-500'>*</span></Label>
                                <div className="h-6 flex items-center">
                                    {errors.clientName && (
                                        <p className="text-red-500 text-sm">{errors.clientName}</p>
                                    )}
                                </div>
                            </div>
                            <Input
                                id="clientName"
                                value={formData.client.name}
                                onChange={(e) => updateClientField('name', e.target.value)}
                                placeholder="Enter client name"
                                className={`bg-background`}
                                maxLength={100}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className='flex items-center justify-between'>
                                <Label htmlFor="clientEmail">Client Email <span className='text-red-500'>*</span></Label>
                                <div className="h-6 flex items-center">

                                    {errors.clientEmail && (
                                        <p className="text-red-500 text-sm">{errors.clientEmail}</p>
                                    )}</div>
                            </div>
                            <Input
                                id="clientEmail"
                                type="email"
                                value={formData.client.email}
                                onChange={(e) => updateClientField('email', e.target.value)}
                                placeholder="client@example.com"
                                className={`bg-background`}
                                maxLength={100}
                            />
                        </div>

                        {/* Client Mobile with PhoneInput */}
                        <div className="space-y-2">
                            <div className='flex items-center justify-between'>
                                <Label htmlFor="clientMobile">Phone Number <span className='text-red-500'>*</span></Label>
                                <div className="h-6 flex items-center">
                                    {errors.clientMobile && (
                                        <p className="text-red-500 text-sm">{errors.clientMobile}</p>
                                    )}
                                </div>
                            </div>
                            <PhoneInput
                                defaultCountry="gb"
                                value={formData.client.mobile || ""}
                                onChange={handlePhoneChange}
                                className={`rounded-md gap-2 `}
                                inputClassName="!flex !h-10 !w-full border !border-input !bg-background px-3 py-2 text-sm !text-foreground
                                    !placeholder:text-muted-foreground 
                                    !rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                                    focus-visible:ring-offset-accent disabled:cursor-not-allowed disabled:opacity-50"
                                countrySelectorStyleProps={{
                                    buttonClassName: "!h-10 border !border-input !bg-background hover:bg-accent !rounded-md px-3 !relative",
                                    dropdownStyleProps: {
                                        className: "!text-foreground !bg-background !border!border-white !shadow-lg !absolute !bottom-full !top-auto !mb-[4px] !rounded-md scrollbar-hide !border",
                                        listItemSelectedClassName: "!bg-accent",
                                        listItemCountryNameStyle: { color: "gray" },
                                    },
                                }}
                                placeholder="Enter phone number"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}