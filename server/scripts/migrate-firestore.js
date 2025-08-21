// server/scripts/migrate-firestore.js
import { Timestamp } from "firebase-admin/firestore";
import { db } from "../firebase.js";
import "dotenv/config";


function toNumOrNull(v) {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(String(v).replace(",", ".").replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : null;
}
function toIntOrNull(v) {
    const n = parseInt(String(v), 10);
    return Number.isFinite(n) ? n : null;
}

async function migrateEvents() {
    const snap = await db.collection("events").get();
    for (const d of snap.docs) {
        const e = d.data();

        const date = String(e.date || "").slice(0, 10);
        const time = /^\d{2}:\d{2}$/.test(e.time || "") ? e.time : "00:00";
        const startAt = Timestamp.fromDate(new Date(`${date}T${time}:00`));

        const capacity = toIntOrNull(e.capacity);
        const price = toNumOrNull(e.price);
        const status = ["draft", "published", "archived"].includes(e.status)
            ? e.status
            : "published";

        await d.ref.update({
            date,
            time,
            startAt,
            capacity,
            price,
            status,
            createdAt: e.createdAt || Timestamp.now(),
            updatedAt: Timestamp.now(),
            bookedCount: toIntOrNull(e.bookedCount) ?? 0,
            placeCoords:
                e.placeCoords && typeof e.placeCoords.lat === "number"
                    ? e.placeCoords
                    : null,
        });

        console.log("✅ migrated event", d.id);
    }
}

async function recomputeBookedCount() {
    const evSnap = await db.collection("events").get();
    for (const ev of evSnap.docs) {
        const q = await db
            .collection("bookings")
            .where("eventId", "==", ev.id)
            .get();
        const sum = q.docs.reduce((acc, b) => acc + (b.data().quantity || 1), 0);
        const data = ev.data();
        await ev.ref.update({
            bookedCount: sum,
            soldOut:
                typeof data.capacity === "number" && data.capacity >= 0
                    ? sum >= data.capacity
                    : !!data.soldOut,
            updatedAt: Timestamp.now(),
        });
        console.log("🔁 recount", ev.id, sum);
    }
}

(async () => {
    await migrateEvents();
    await recomputeBookedCount();
    console.log("🎉 done");
    process.exit(0);
})();
