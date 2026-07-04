const { query } = require('./index');

(async () => {
  try {
    await query("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100)");
    await query("ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS address_prev TEXT");
    await query("ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS address_next TEXT");
    console.log("Columns added OK");

    const { rows } = await query("SELECT id, address FROM warehouses WHERE address IS NOT NULL AND address != '' AND (address_prev IS NULL OR address_next IS NULL)");
    for (const r of rows) {
      const addr = r.address;
      let splitPos = -1;
      for (const kw of ["区", "镇", "乡", "街道"]) {
        const pos = addr.lastIndexOf(kw);
        if (pos > splitPos) splitPos = pos;
      }
      if (splitPos <= 0) splitPos = Math.floor(addr.length / 2);
      const prev = addr.substring(0, splitPos + 1);
      const next = addr.substring(splitPos + 1);
      await query("UPDATE warehouses SET address_prev=$1, address_next=$2 WHERE id=$3", [prev, next, r.id]);
      console.log("Split:", r.id, "=>", prev, "|", next);
    }
    console.log("=== Migration 010 done ===");
    process.exit(0);
  } catch (e) { console.error(e.message); process.exit(1); }
})();
