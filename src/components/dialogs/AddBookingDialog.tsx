// import { useState } from 'react';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Textarea } from '@/components/ui/textarea';
// import { Plus, X, UserPlus, Users } from 'lucide-react';
// import { EditableBooking } from '@/hooks/useBookingEditor';
// import { FinancialDialog } from './FinancialDialog';
// import { ROLES } from '@/constant/constant';
// import { TeamMember } from './TeamMembers';
// import { createProject } from '@/api/project';
// import { toast } from 'sonner';

// const colorOptions = [
//   { label: 'Blue', value: 'bg-blue-500' },
//   { label: 'Green', value: 'bg-green-500' },
//   { label: 'Purple', value: 'bg-purple-500' },
//   { label: 'Red', value: 'bg-red-500' },
//   { label: 'Orange', value: 'bg-orange-500' },
//   { label: 'Teal', value: 'bg-teal-500' },
//   { label: 'Indigo', value: 'bg-indigo-500' },
//   { label: 'Pink', value: 'bg-pink-500' },
// ];

// export interface TeamAssignment {
//   id: string;
//   memberName: string;
//   responsibility: string;
// }

// interface AddBookingDialogProps {
//   onAddBooking: (booking: Omit<EditableBooking, 'id'>) => void;
//   defaultHour?: number;
//   teamMembers: TeamMember[];
//   currentBookings?: Array<{
//     startHour: number;
//     endHour: number;
//     projectName: string;
//     memberName: string;
//     memberPhoto: string;
//     color: string;
//   }>;
// }

// export function AddBookingDialog({ onAddBooking, defaultHour = 9, currentBookings = [], teamMembers }: AddBookingDialogProps) {
//   const [open, setOpen] = useState(false);
//   const [financialOpen, setFinancialOpen] = useState(false);
  
//   const [formData, setFormData] = useState({
//     projectName: '',
//     startDate: new Date().toISOString().split('T')[0], // Today's date as default
//     endDate: new Date().toISOString().split('T')[0], // Today's date as default
//     startHour: defaultHour,
//     endHour: defaultHour + 1,
//     color: 'bg-blue-500',
//     description: '',
//     location: ''
//   });
//   const [teamAssignments, setTeamAssignments] = useState<TeamAssignment[]>([]);
//   const isFormIncomplete = !formData.projectName || !formData.startDate || !formData.endDate || !formData.location || !formData.description || teamAssignments.length === 0;


//   const [currentMember, setCurrentMember] = useState({
//     memberId: '',
//     memberName: '',
//     memberPhoto: '',
//     responsibility: ''
//   });

//   const addTeamMember = () => {
//     if (currentMember.memberName && currentMember.responsibility) {
//       setTeamAssignments(prev => [
//         ...prev,
//         {
//           id: currentMember.memberId,
//           memberName: currentMember.memberName,
//           responsibility: currentMember.responsibility
//         }
//       ]);

//       // Reset current member form
//       setCurrentMember({
//         memberId: '',
//         memberName: '',
//         memberPhoto: '',
//         responsibility: ''
//       });
//     }
//   };

//   const removeTeamMember = (id: string) => {
//     setTeamAssignments(prev => prev.filter(assignment => assignment.id !== id));
//   };

//   const updateCurrentMember = (field: keyof typeof currentMember, value: string) => {
//     setCurrentMember(prev => {
//       const updated = { ...prev, [field]: value };

//       // Auto-fill photo and role when member is selected
//       if (field === 'memberName') {
//         const selectedMember = teamMembers.find(m => m.name === value);
//         if (selectedMember) {

//           updated.memberId = selectedMember.id;
//           // Auto-fill the responsibility with the member's role
//           updated.responsibility = selectedMember.role;
//         }
//       }
//       if (field === 'memberId') {
//         const selectedMember = teamMembers.find(m => m.id === value);
//         if (selectedMember) {
//           updated.memberName = selectedMember.name
//           updated.memberPhoto = selectedMember.photo;
//           // Auto-fill the responsibility with the member's role
//           updated.responsibility = selectedMember.role;
//         }
//       }

//       return updated;
//     });
//   };
//   const getDefaultFormData = () => ({
//     projectName: '',
//     startDate: new Date().toISOString().split('T')[0],
//     endDate: new Date().toISOString().split('T')[0],
//     startHour: defaultHour,
//     endHour: defaultHour + 1,
//     color: 'bg-blue-500',
//     description: '',
//     location: ''
//   });
//   const resetForm = () => {
//     setFormData(getDefaultFormData());
//     setTeamAssignments([]);
//     setCurrentMember({
//       memberId: '',
//       memberName: '',
//       memberPhoto: '',
//       responsibility: ''
//     });
//   };
//   const handleCancel = () => {
//     resetForm();
//     setOpen(false);
//   };

// const handleSubmit = async(e: React.FormEvent) => {
//   e.preventDefault();
//   if (!formData.projectName || teamAssignments.length === 0) return;

//   // Create booking for primary member (first in the list)
//   const primaryMember = teamAssignments[0];
//   const allMembers = teamAssignments.map(ta =>
//     `${ta.memberName} (${ta.responsibility})`
//   ).join(', ');

//   const res = await createProject({
//     ...formData,
//     memberName: primaryMember.memberName,
//     description: `${formData.description}`.trim(),
//     teamAssignments: teamAssignments
//   });

//   onAddBooking({
//     ...formData,
//     memberName: primaryMember.memberName,
//     description: `${formData.description}\n\nTeam: ${allMembers}`.trim(),
//     teamAssignments: teamAssignments
//   });
  
//   // ✅ Only reset the form if the booking was successful
//   if (res?.success) {
//     setFormData({
//       projectName: '',
//       startDate: new Date().toISOString().split('T')[0],
//       endDate: new Date().toISOString().split('T')[0],
//       startHour: defaultHour,
//       endHour: defaultHour + 1,
//       color: 'bg-blue-500',
//       description: '',
//       location: ''
//     });

//     setTeamAssignments([{ id: '1', memberName: '', responsibility: '' }]);
//     setCurrentMember({
//       memberId: '',
//       memberName: '',
//       memberPhoto: '',
//       responsibility: ''
//     });
//     setOpen(false);
    
//   } else{
//     toast.error(res.message);
//   }
// };


//   const hours = Array.from({ length: 24 }, (_, i) => i);

//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogTrigger asChild>
//         <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground hover:text-foreground">
//           <Plus className="w-3 h-3 mr-1" />
//           Add booking
//         </Button>
//       </DialogTrigger>
//       <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle>Add New Booking</DialogTitle>
//         </DialogHeader>
//         <form onSubmit={handleSubmit} className="space-y-6" noValidate>
//           {/* Project Name */}
//           <div className="space-y-2">
//             <Label htmlFor="projectName">Project Name</Label>
//             <Input
//               id="projectName"
//               value={formData.projectName}
//               onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
//               placeholder="Enter project name"
//               required
//             />
//           </div>

//           {/* Main Content - Side by Side */}
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//             {/* Left Column - Booking Details */}
//             <div className="space-y-4">
//               {/* Date Section */}
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="startDate">Start Date</Label>
//                   <Input
//                     id="startDate"
//                     type="date"
//                     value={formData.startDate}
//                     onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
//                     required
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="endDate">End Date</Label>
//                   <Input
//                     id="endDate"
//                     type="date"
//                     value={formData.endDate}
//                     onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
//                     required
//                     min={formData.startDate}
//                   />
//                 </div>
//               </div>

//               {/* Time & Color Section */}
//               <div className="grid grid-cols-3 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="startHour">Start Time</Label>
//                   <Select
//                     value={formData.startHour.toString()}
//                     onValueChange={(value) => setFormData(prev => ({ ...prev, startHour: parseInt(value) }))}
//                   >
//                     <SelectTrigger className="bg-background border-border">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent className="bg-background border-border shadow-lg">
//                       {hours.map((hour) => (
//                         <SelectItem key={hour} value={hour.toString()} className="hover:bg-muted">
//                           {hour === 0 ? '12:00 AM' : hour === 12 ? '12:00 PM' : hour < 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="endHour">End Time</Label>
//                   <Select
//                     value={formData.endHour.toString()}
//                     onValueChange={(value) => setFormData(prev => ({ ...prev, endHour: parseInt(value) }))}
//                   >
//                     <SelectTrigger className="bg-background border-border">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent className="bg-background border-border shadow-lg">
//                       {hours.filter(h => h > formData.startHour).map((hour) => (
//                         <SelectItem key={hour} value={hour.toString()} className="hover:bg-muted">
//                           {hour === 0 ? '12:00 AM' : hour === 12 ? '12:00 PM' : hour < 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="color">Color</Label>
//                   <Select
//                     value={formData.color}
//                     onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
//                   >
//                     <SelectTrigger className="bg-background border-border">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent className="bg-background border-border shadow-lg">
//                       {colorOptions.map((color) => (
//                         <SelectItem key={color.value} value={color.value} className="hover:bg-muted">
//                           <div className="flex items-center gap-2">
//                             <div className={`w-3 h-3 rounded-full ${color.value}`}></div>
//                             {color.label}
//                           </div>
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="location">Location</Label>
//                 <Input
//                   id="location"
//                   value={formData.location}
//                   onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
//                   placeholder="Studio A, Conference Room, etc."
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="description">Description</Label>
//                 <Textarea
//                   id="description"
//                   value={formData.description}
//                   onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
//                   placeholder="Additional notes about this booking..."
//                   rows={4}
//                 />
//               </div>
//             </div>

//             {/* Right Column - Team Members */}
//             <div className="space-y-4">
//               <div className="flex items-center gap-2">
//                 <Users className="w-5 h-5" />
//                 <Label className="text-base">Team Members</Label>
//               </div>

//               {/* Single Team Member Input */}
//               <div className="p-3 bg-muted/20 rounded-lg border space-y-3">
//                 <div className="grid grid-cols-2 gap-3">
//                   <div className="space-y-2">
//                     <Label className="text-xs">Team Member</Label>
//                     <Select
//                       value={currentMember.memberName}
//                       onValueChange={(value) => updateCurrentMember('memberName', value)}
//                     >
//                       <SelectTrigger className="bg-background border-border">
//                         <SelectValue placeholder="Select member" />
//                       </SelectTrigger>
//                       <SelectContent className="bg-background border-border shadow-lg">
//                         {teamMembers.filter(
//                           (member) => !teamAssignments.some((ta) => ta.memberName === member.name)
//                         ).length === 0 ? (
//                           <div className="px-4 py-2 text-muted-foreground text-sm">
//                             No available members
//                           </div>
//                         ) : (
//                           teamMembers
//                             .filter((member) => !teamAssignments.some((ta) => ta.memberName === member.name))
//                             .map((member) => (
//                               <SelectItem key={member.id} value={member.name} className="hover:bg-muted">
//                                 <div className="flex items-center gap-2">
//                                   <span>{member.name} - {member.role}</span>
//                                 </div>
//                               </SelectItem>
//                             ))
//                         )}
//                       </SelectContent>

//                     </Select>
//                   </div>

//                   <div className="space-y-2">
//                     <Label className="text-xs">Responsibility</Label>
//                     <Select
//                       value={currentMember.responsibility}
//                       onValueChange={(value) => updateCurrentMember('responsibility', value)}
//                     >
//                       <SelectTrigger className="bg-background border-border">
//                         <SelectValue placeholder="Select responsibility" />
//                       </SelectTrigger>
//                       <SelectContent className="bg-background border-border shadow-lg">
//                         {ROLES.map((responsibility) => (
//                           <SelectItem key={responsibility} value={responsibility} className="hover:bg-muted">
//                             {responsibility}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 </div>
//                 <Button
//                   type="button"
//                   variant="outline"
//                   size="sm"
//                   onClick={addTeamMember}
//                   disabled={!currentMember.memberName || !currentMember.responsibility}
//                   className=" text-xs w-full"
//                 >
//                   <UserPlus className="w-3 h-3 mr-1" />
//                   Add Member
//                 </Button>
//               </div>

//               {/* Team Summary */}
//               {teamAssignments.length > 0 && (
//                 <div className="p-3 bg-background rounded-lg border">
//                   <h4 className="text-sm font-medium mb-2">Team Summary</h4>
//                   <div className="space-y-2 overflow-y-auto max-h-[136px]">
//                     {teamAssignments.map((ta, index) => (
//                       <div key={ta.id} className="flex items-center justify-between p-2 bg-muted/20 rounded">
//                         <div className="flex items-center gap-2">
//                           <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
//                           <div className="flex items-center gap-2">
//                             <span className="font-medium text-sm">{ta.memberName}</span>
//                             <span className="text-muted-foreground text-sm">- {ta.responsibility}</span>
//                           </div>
//                         </div>
//                         <Button
//                           type="button"
//                           variant="ghost"
//                           size="sm"
//                           onClick={() => removeTeamMember(ta.id)}
//                           className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
//                         >
//                           <X className="w-3 h-3" />
//                         </Button>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Footer Buttons */}
//           <div className="flex justify-between gap-2 pt-4 border-t">
//             <Button type="button" variant="outline" onClick={() => setFinancialOpen(true)}>
//               Revenue
//             </Button>
//             <div className="flex gap-2">
//               <Button type="button" variant="outline" onClick={handleCancel}>
//                 Cancel
//               </Button>
//               <Button type="submit" disabled={isFormIncomplete}>
//                 Add Booking
//               </Button>
//             </div>
//           </div>
//         </form>
//       </DialogContent>

//       <FinancialDialog
//         open={financialOpen}
//         onOpenChange={setFinancialOpen}
//         bookings={currentBookings}
//       />
//     </Dialog>
//   );
// }