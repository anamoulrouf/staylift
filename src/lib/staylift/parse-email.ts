
export type ParsedReservation = {
  bookingRef: string;
  source: string;
  guestName: string;
  arrival: string;
  departure: string;
  roomTypeHint: string;
  guests: number;
  emailKind: "real" | "masked" | "none";
  phoneKind: "valid" | "placeholder" | "none";
};

const MONTHS: Record<string, string> = {
  january: "01",
  february: "02",
  march: "03",
  april: "04",
  may: "05",
  june: "06",
  july: "07",
  august: "08",
  september: "09",
  october: "10",
  november: "11",
  december: "12",
};

function toIso(raw: string): string | null {
  const trimmed = raw.trim();
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return iso[0];
  const us = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) {
    const m = us[1].padStart(2, "0");
    const d = us[2].padStart(2, "0");
    return `${us[3]}-${m}-${d}`;
  }
  const long = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (long) {
    const month = MONTHS[long[2].toLowerCase()];
    if (!month) return null;
    return `${long[3]}-${month}-${long[1].padStart(2, "0")}`;
  }
  return null;
}

function detectSource(text: string): string {
  if (/booking\.com/i.test(text)) return "Booking.com";
  if (/expedia/i.test(text)) return "Expedia";
  if (/agoda/i.test(text)) return "Agoda";
  if (/airbnb/i.test(text)) return "Airbnb";
  return "Forwarded email";
}

function emailKind(email: string | undefined): ParsedReservation["emailKind"] {
  if (!email) return "none";
  if (
    /guest\.booking\.com|mci\.hotels\.expedia|guest\.agoda|expediapartnercentral|airbnb\.com$/i.test(
      email,
    )
  ) {
    return "masked";
  }
  return "real";
}

function phoneKind(phone: string | undefined): ParsedReservation["phoneKind"] {
  if (!phone) return "none";
  const digits = phone.replace(/\D/g, "");
  if (!digits || /^1+$/.test(digits) || digits.length < 8) return "placeholder";
  return "valid";
}

export function parseReservationEmail(
  text: string,
): ParsedReservation | { error: string } {
  const body = text.trim();
  if (body.length < 20) return { error: "Paste a full confirmation email." };

  // A reference needs a label ("number", "no.", "id", "#", "code") and at least
  // one digit, so "Booking.com reservation confirmation" is not read as a ref.
  const refMatch = body.match(
    /(?:reservation|confirmation|booking)\s*(?:number|no\.?|id|code|#)\s*[:#]?\s*([A-Z0-9-]*\d[A-Z0-9-]*)/i,
  );
  const nameMatch = body.match(
    /(?:guest(?:\s*name)?|name)\s*[:.]\s*([A-Za-z][A-Za-z' .-]{1,60})/i,
  );
  const inMatch = body.match(
    /check[-\s]?in\s*[:.]?\s*(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\s+[A-Za-z]+\s+\d{4})/i,
  );
  const outMatch = body.match(
    /check[-\s]?out\s*[:.]?\s*(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\s+[A-Za-z]+\s+\d{4})/i,
  );
  const roomMatch = body.match(/room(?:\s*type)?\s*[:.]\s*([A-Za-z][A-Za-z ]{2,40})/i);
  const guestsMatch = body.match(
    /(?:number of guests|guests|occupancy)\s*[:.]\s*(\d{1,2})/i,
  );
  const emailMatch = body.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  );
  const phoneMatch = body.match(
    /(?:telephone|phone|mobile|tel)\s*[:.]\s*([+\d][\d .()-]{6,})/i,
  );

  if (!nameMatch) return { error: "Could not find a guest name." };
  const arrival = inMatch ? toIso(inMatch[1]) : null;
  const departure = outMatch ? toIso(outMatch[1]) : null;
  if (!arrival || !departure) {
    return { error: "Could not read check-in and check-out dates." };
  }
  // nightsBetween() floors at 1 night, so compare the dates themselves.
  if (departure <= arrival) {
    return { error: "Departure must be after arrival." };
  }

  return {
    bookingRef: refMatch?.[1] ?? `EM-${Date.now().toString(36).toUpperCase()}`,
    source: detectSource(body),
    guestName: nameMatch[1].trim().replace(/\s+/g, " "),
    arrival,
    departure,
    roomTypeHint: (roomMatch?.[1] ?? "Standard Queen").trim(),
    guests: guestsMatch ? Number(guestsMatch[1]) : 2,
    emailKind: emailKind(emailMatch?.[0]),
    phoneKind: phoneKind(phoneMatch?.[1]),
  };
}
