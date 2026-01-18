import { jwtDecode } from "jwt-decode";
import { DollarSign, Euro, IndianRupee, PoundSterling } from "lucide-react";

export const getFallback = (name) => {
  if (!name) return "";

  const parts = name.trim().split(" ");

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return parts[0].slice(0, 2).toUpperCase();
};

export const getTextColorBasedOnBackground = (backgroundColor) => {
  // If color has transparency, remove the alpha channel for calculation
  const hex = backgroundColor.replace(/[^0-9A-F]/gi, '');

  let r, g, b;

  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex[0] + hex[1], 16);
    g = parseInt(hex[2] + hex[3], 16);
    b = parseInt(hex[4] + hex[5], 16);
  } else {
    // Default to white if invalid color
    return 'white';
  }

  // Calculate relative luminance (per ITU-R BT.709)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Use black text on bright backgrounds, white on dark backgrounds
  return luminance > 0.5 ? 'black' : 'white';
};

// Function to get currency symbol and formatting based on country
export const getCurrencyConfig = (country?: string) => {
  const countryCode = country?.toLowerCase();

  switch (countryCode) {
    case 'us':
    case 'usa':
    case 'united states':
    case 'canada':
    case 'australia':
    case 'new zealand':
    case 'singapore':
    case 'hong kong':
      return { symbol: '$', code: 'USD', icon: DollarSign, format: 'en-US' };

    case 'gb':
    case 'uk':
    case 'united kingdom':
      return { symbol: '£', code: 'GBP', icon: PoundSterling, format: 'en-GB' };

    case 'eu':
    case 'germany':
    case 'france':
    case 'italy':
    case 'spain':
    case 'netherlands':
    case 'belgium':
    case 'ireland':
      return { symbol: '€', code: 'EUR', icon: Euro, format: 'de-DE' };

    case 'in':
    case 'india':
      return { symbol: '₹', code: 'INR', icon: IndianRupee, format: 'en-IN' };

    // Add more countries as needed
    default:
      return { symbol: '$', code: 'USD', icon: DollarSign, format: 'en-US' };
  }
};

// Function to format price with proper currency formatting - handles string input
export const formatPrice = (price: string | number, country?: string) => {
  const config = getCurrencyConfig(country);

  // Convert string to number, handle empty strings and invalid values
  const numericPrice = typeof price === 'string'
    ? parseFloat(price) || 0
    : price || 0;

  // For currencies like JPY that typically don't use decimal places
  if (config.code === 'JPY' || config.code === 'KRW') {
    return new Intl.NumberFormat(config.format, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericPrice);
  }

  return new Intl.NumberFormat(config.format, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericPrice);
};
export function formatReminderDateTime(reminder: any): string {
  const date = new Date(reminder.reminderDate);

  // Day of week: Sunday
  const dayOfWeek = date.toLocaleDateString('en-GB', { weekday: 'long' });

  // Day: 25
  const day = date.getDate();

  // Month: Dec (short month name)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[date.getMonth()];

  // Year: 2025
  const year = date.getFullYear();

  // Time: 6:00pm (with leading zero for minutes)
  const hour = reminder.reminderHour;
  const ampm = hour >= 12 ? ' pm' : ' am';
  const displayHour = hour % 12 || 12; // Convert 0 to 12 for 12am
  const minutes = '00';

  return `${dayOfWeek}, ${day} ${month} ${year} at ${displayHour}:${minutes}${ampm}`;
}

export function formatTime(hour) {
  if (hour === 24 || hour === 0) return "12:00 AM";
  if (hour === 12) return "12:00 PM";
  if (hour > 12) return `${hour - 12}:00 PM`;
  return `${hour}:00 AM`;
}
export function isTokenExpired(token: string, bufferMinutes: number = 24*60 ): boolean {
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    const currentTime = Date.now() / 1000;
    const bufferSeconds = bufferMinutes * 60;
    return exp - currentTime <= bufferSeconds;
  } catch {
    return true;
  }
}
