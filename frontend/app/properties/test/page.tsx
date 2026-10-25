
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Property = { id: string; name: string };

async function getAllProperties(): Promise<Property[]> {
  const { data, error } = await createClient()
    .from("properties")
    .select("id, name")
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export default function propertySelect() {
  const [property, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    getAllProperties().then(setProperty).catch(console.error);
  }, []);

  return (
    <select name="property_id" defaultValue="" onChange={(e) => console.log(e.target.value)}>
      <option value="" disabled>Choose a property</option>
      {properties.map((property) => (
        <option key={property.id} value={property.id}>
          {property.name}
        </option>
      ))}
    </select>
  );
}