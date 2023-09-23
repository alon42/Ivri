import { format } from "date-fns";

// https://icalendar.org/validator.html#results
// https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.5.2

export function arrayOfDatesToRDATE(datesArr) {
  return "RDATE;VALUE=DATE:" + datesArr.map((date) => format(date, "yyyyMMdd")).join(",");
}
