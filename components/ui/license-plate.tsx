import { cn } from "@/lib/utils";

interface LicensePlateProps {
  plateNumber: string;
  variant?: "standard" | "compact";
  className?: string;
}

/**
 * License Plate component for displaying formatted vehicle registration plates
 * Supports Russian-style plate format (e.g. E685AA186RUS or just E685AA186)
 */
export function LicensePlate({
  plateNumber,
  variant = "standard",
  className,
}: LicensePlateProps) {
  // Try to parse the plate number into a consistent format
  let formattedPlate = plateNumber.trim().toUpperCase();
  let regionCode = "";
  let countryCode = "";

  // Pattern for Russian plates: letter-number-letter-letter-region-RUS
  // Examples: A123BC45RUS, E685AA186RUS, A123BC45
  const rusPattern = /^([А-ЯA-Z])(\d{1,3})([А-ЯA-Z]{2})(\d{2,3})(RUS)?$/i;
  const match = formattedPlate.match(rusPattern);

  if (match) {
    // Extract components from the plate
    const firstLetter = match[1];
    const numbers = match[2];
    const lastLetters = match[3];
    regionCode = match[4];
    countryCode = match[5] || "";

    // Format the main part of the plate
    formattedPlate = `${firstLetter} ${numbers} ${lastLetters}`;
  }

  return (
    <div
      className={cn(
        "inline-flex select-none overflow-hidden rounded-md border border-black bg-white shadow-sm items-center",
        variant === "compact" ? "text-xs" : "text-sm",
        className,
      )}
    >
      {/* Main plate area */}
      <div
        className={cn(
          "px-2 font-bold tracking-wider flex items-center",
          variant === "compact" ? "py-0.5" : "py-1",
        )}
      >
        {formattedPlate}
      </div>

      {/* Region code */}
      {regionCode && (
        <div className="bg-blue-800 text-white px-2 py-0.5 flex items-center text-xs font-bold">
          {regionCode}
          {countryCode && (
            <span className="ml-1 text-[6px] opacity-80">{countryCode}</span>
          )}
        </div>
      )}
    </div>
  );
}
