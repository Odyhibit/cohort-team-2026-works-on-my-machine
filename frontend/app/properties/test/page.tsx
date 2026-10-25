"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

export default function PropertySelect() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [needsSignIn, setNeedsSignIn] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProperties() {
      const { data, error } = await createClient().auth.getUser();
      if (!active) return;
      if (error && error.name !== "AuthSessionMissingError") {
        console.error(error);
        return;
      }
      if (!data.user) {
        setNeedsSignIn(true);
        return;
      }

      try {
        const result = await getAllProperties();
        if (active) setProperties(result);
      } catch (loadError) {
        console.error(loadError);
      }
    }

    void loadProperties();
    return () => { active = false; };
  }, []);

  return (
    <>
      {needsSignIn ? (
        <p><Link href="/properties">Sign in to view properties</Link></p>
      ) : (
        <select name="property_id" defaultValue="" onChange={(e) => console.log(e.target.value)}>
          <option value="" disabled>Choose a property</option>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name}
            </option>
          ))}
        </select>
      )}
    </>
  );
}
