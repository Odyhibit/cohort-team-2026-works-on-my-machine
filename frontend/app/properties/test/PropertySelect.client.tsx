"use client";

export type Property = { id: string; name: string };

export default function PropertySelect({ properties }: { properties: Property[] }) {
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
