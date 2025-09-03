export const eventDateTime = (ev) => {
  const d = ev?.date || "";
  const t = ev?.time || "00:00";
  const dt = new Date(`${d}T${t}:00`);
  return isNaN(dt.getTime()) ? null : dt;
};

export const formatDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
};

export const isPast = (ev) => {
  const dt = eventDateTime(ev);
  return dt ? dt.getTime() < Date.now() : false;
};
