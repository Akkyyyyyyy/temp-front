  import { useState } from 'react';
  import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
  import { Button } from '@/components/ui/button';
  import { Input } from '@/components/ui/input';
  import { Trash2, Edit2, Save, X } from 'lucide-react';
  import { BookingDetailsDialog } from './BookingDetailsDialog';
  import { EditableBooking } from '@/hooks/useBookingEditor';

  const S3_URL = import.meta.env.VITE_S3_BASE_URL;

  interface EditableTimeSlotProps {
    hour: number;
    booking?: EditableBooking;
    isEditing: boolean;
    isStartOfBooking: boolean;
    formatHour: (hour: number) => string;
    onUpdateBooking: (id: string, updates: Partial<EditableBooking>) => void;
    onDeleteBooking: (id: string) => void;
    showHourLabel?: boolean;
  }

  export function EditableTimeSlot({
    hour,
    booking,
    isEditing,
    isStartOfBooking,
    formatHour,
    onUpdateBooking,
    onDeleteBooking,
    showHourLabel = true
  }: EditableTimeSlotProps) {
    const [editingThisSlot, setEditingThisSlot] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [editData, setEditData] = useState({
      projectName: booking?.projectName || '',
      description: booking?.description || '',
      location: booking?.location || ''
    });

    const handleSave = () => {
      if (booking) {
        onUpdateBooking(booking.id, editData);
        setEditingThisSlot(false);
      }
    };

    const handleCancel = () => {
      setEditData({
        projectName: booking?.projectName || '',
        description: booking?.description || '',
        location: booking?.location || ''
      });
      setEditingThisSlot(false);
    };

    const handleDelete = () => {
      if (booking && window.confirm('Are you sure you want to delete this booking?')) {
        onDeleteBooking(booking.id);
      }
    };

    return (
      <div
        className={`flex items-center p-3 rounded-lg border transition-colors ${booking
          ? ` text-white border-transparent`
          : 'bg-muted/20 border-border/20 hover:bg-muted/30'
          }`}
        style={{ backgroundColor: booking?.color }}
      >
        {showHourLabel ? (
          <div className="w-16 sm:w-20 text-sm font-medium">
            {formatHour(hour)}
          </div>
        ) : (
          <div className="w-16 sm:w-20"></div>
        )}

        {booking ? (
          <div className="flex items-center gap-3 flex-1">
            {isStartOfBooking && (
              <>
                <Avatar className="w-8 h-8 ring-2 ring-white/20"
                  style={{
                    borderColor: booking.memberRingColor || 'hsl(var(--muted))',
                    boxShadow: `0 0 0 2px ${booking.memberRingColor || 'hsl(var(--muted))'}`
                  }}
                >
                  <AvatarImage
                    src={`${S3_URL}/${booking.memberPhoto}`}
                    alt={booking.memberName}
                    className="object-cover"
                  />

                  <AvatarFallback className="bg-white/20 text-white font-semibold text-xs">
                    {booking.memberName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  {editingThisSlot && isEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={editData.projectName}
                        onChange={(e) => setEditData(prev => ({ ...prev, projectName: e.target.value }))}
                        className="text-sm bg-white/20 border-white/30 text-white placeholder-white/70"
                        placeholder="Project name"
                      />
                      <Input
                        value={editData.location}
                        onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
                        className="text-sm bg-white/20 border-white/30 text-white placeholder-white/70"
                        placeholder="Location"
                      />
                      <Input
                        value={editData.description}
                        onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                        className="text-sm bg-white/20 border-white/30 text-white placeholder-white/70"
                        placeholder="Description"
                      />
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={handleSave}
                          className="h-6 px-2 text-xs"
                        >
                          <Save className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={handleCancel}
                          className="h-6 px-2 text-xs"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer hover:opacity-80 transition-opacity min-w-0"
                      onClick={() => setShowDetails(true)}
                    >
                      <div className="font-medium text-sm truncate">{booking.projectName}</div>
                      <div className="text-xs opacity-90 truncate">
                        {booking.memberName} • {formatHour(booking.startHour)} - {formatHour(booking.endHour)}
                        {booking.location && ` • ${booking.location}`}
                      </div>
                    </div>
                  )}
                </div>
                {isEditing && !editingThisSlot && (
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingThisSlot(true)}
                      className="h-6 w-6 p-0 text-white/70 hover:text-white hover:bg-white/20"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDelete}
                      className="h-6 w-6 p-0 text-white/70 hover:text-white hover:bg-white/20"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </>
            )}
            {!isStartOfBooking && (
              <div
                className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity min-w-0"
                onClick={() => setShowDetails(true)}
              >
                <Avatar className="w-8 h-8 ring-2 ring-white/20 flex-shrink-0">
                  <AvatarImage
                    src={`${S3_URL}/${booking.memberPhoto}`}
                    alt={booking.memberName}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-white/20 text-white font-semibold text-xs">
                    {booking.memberName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm opacity-75 truncate">
                  ↳ {booking.projectName} continues...
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 text-sm text-muted-foreground">
            Available
          </div>
        )}

        {booking && (
          <BookingDetailsDialog
            booking={booking}
            isOpen={showDetails}
            onClose={() => setShowDetails(false)}
            formatHour={formatHour}
          />
        )}
      </div>
    );
  }