export const eventDateTime = (ev) => {
  const d = ev?.date || "";
  const t = ev?.time || "00:00";
  const dt = new Date(`${d}T${t}:00`);
  return isNaN(dt.getTime()) ? null : dt;
};

import { formatDMY } from "../../lib/date";

export const formatDate = (value) => formatDMY(value);

export const isPast = (ev) => {
  const dt = eventDateTime(ev);
  return dt ? dt.getTime() < Date.now() : false;
};
