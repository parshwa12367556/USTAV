
import { format, formatDistanceToNow, parseISO, toDate } from "date-fns";

export function formatDate(dateString: string, fmt = "dd MMM yyyy"): string {
  try { return format(parseISO(dateString), fmt); } catch { return dateString; }
}

export function formatDateTime(dateString: string, time: string): string {
  try { return `${format(parseISO(dateString), "dd MMM yyyy")}  ${time}`; } catch { return `${dateString}  ${time}`; }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export function formatRelative(dateString: string): string {
  try { return formatDistanceToNow(parseISO(dateString), { addSuffix: true }); } catch { return dateString; }
}

export function initials(name: string): string {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
}

export function truncate(text: string, len: number): string {
  if (text.length <= len) return text;
  return `${text.slice(0, len)}`;
}

