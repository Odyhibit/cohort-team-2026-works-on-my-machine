
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Vendor = { id: string; name: string };

async function getAllVendors(): Promise<Vendor[]> {
  const { data, error } = await createClient()
    .from("vendors")
    .select("id, name")
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export default function VendorSelect() {
  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    getAllVendors().then(setVendors).catch(console.error);
  }, []);

  return (
    <select name="vendor_id" defaultValue="" onChange={(e) => console.log(e.target.value)}>
      <option value="" disabled>Choose a vendor</option>
      {vendors.map((vendor) => (
        <option key={vendor.id} value={vendor.id}>
          {vendor.name}
        </option>
      ))}
    </select>
  );
}