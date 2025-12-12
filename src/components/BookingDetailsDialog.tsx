import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, MapPin, FileText, User, Phone, Mail, Camera, CheckCircle, Package } from 'lucide-react';
import { EditableBooking } from '@/hooks/useBookingEditor';
import { getFallback } from "@/helper/helper";

const S3_URL = import.meta.env.VITE_S3_BASE_URL;

interface BookingDetailsDialogProps {
  booking: EditableBooking | null;
  isOpen: boolean;
  onClose: () => void;
  formatHour: (hour: number) => string;
}

export function BookingDetailsDialog({
  booking,
  isOpen,
  onClose,
  formatHour
}: BookingDetailsDialogProps) {
  if (!booking) return null;

  const duration = booking.endHour - booking.startHour;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Event Details</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6 py-4">
            {/* Event Header */}
            <div className={`rounded-lg p-4 text-white`}
              style={{ backgroundColor: booking.color }}>
              <div className="mb-3">
                <h3 className="text-lg font-semibold">{booking.projectName}</h3>
                {booking.eventName && (
                  <div className="text-sm opacity-90 mt-1 font-medium">
                    {booking.eventName}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 ring-2 ring-white/30"
                  style={{
                    borderColor: booking.memberRingColor || 'hsl(var(--muted))',
                    boxShadow: `0 0 0 2px ${booking.memberRingColor || 'hsl(var(--muted))'}`
                  }}>
                  <AvatarImage src={`${S3_URL}/${booking.memberPhoto}`} alt={booking.memberName} className="object-cover" />
                  <AvatarFallback className="bg-white/20 text-white font-semibold">
                    {getFallback(booking.memberName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{booking.memberName}</div>
                  <div className="text-sm opacity-90">{booking.newRole}</div>
                </div>
              </div>
            </div>

            {/* Schedule & Time */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Schedule
              </h4>
              <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Time</span>
                  <span className="font-medium">
                    {formatHour(booking.startHour)} - {formatHour(booking.endHour)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="font-medium">
                    {duration} {duration === 1 ? 'hour' : 'hours'}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Instructions */}
            {booking.instructions && (
              <>
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Instructions
                  </h4>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-foreground text-sm leading-relaxed">{booking.instructions}</p>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Client Information */}
            {(booking?.client?.name || booking?.client?.mobile || booking?.client?.email) && (
              <>
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Client Information
                  </h4>
                  <div className="space-y-2">
                    {booking.client.name && (
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{booking.client.name}</span>
                      </div>
                    )}
                    {booking.client.mobile && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{booking.client.mobile}</span>
                      </div>
                    )}
                    {booking.client.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{booking.client.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Location */}
            {booking.location && (
              <>
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </h4>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-foreground">{booking.location}</p>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Description */}
            {booking.description && (
              <>
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Project Description
                  </h4>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-foreground text-sm leading-relaxed">{booking.description}</p>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Brief */}
            {booking.brief && booking.brief.length > 0 && (
              <>
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Brief
                  </h4>
                  <ul className="space-y-2">
                    {booking.brief.map((item) => (
                      <li key={item.id} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-foreground block">{item.title}</span>
                          {Array.isArray(item.content) ? (
                            <ul className="list-disc ml-5 mt-1 space-y-1 text-muted-foreground text-xs">
                              {item.content.map((subItem, subIndex) => (
                                <li key={subIndex}>{subItem}</li>
                              ))}
                            </ul>
                          ) : (
                            item.content && (
                              <p className="text-muted-foreground text-xs mt-1">{item.content}</p>
                            )
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <Separator />
              </>
            )}

            {/* Logistics/Equipment */}
            {booking.logistics && booking.logistics.length > 0 && (
              <>
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Equipment & Logistics
                  </h4>
                  <ul className="space-y-2">
                    {booking.logistics.map((item) => (
                      <li key={item.id} className="flex items-start gap-2 text-sm">
                        <Package className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-foreground block">{item.title}</span>
                          {Array.isArray(item.content) ? (
                            <ul className="list-disc ml-5 mt-1 space-y-1 text-muted-foreground text-xs">
                              {item.content.map((subItem, subIndex) => (
                                <li key={subIndex}>{subItem}</li>
                              ))}
                            </ul>
                          ) : (
                            item.content && (
                              <p className="text-muted-foreground text-xs mt-1">{item.content}</p>
                            )
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}