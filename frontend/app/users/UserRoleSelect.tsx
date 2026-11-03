import { userRoles, userRoleLabels } from "@/lib/users/roles";

export default function UserRoleSelect({ value = "clerk" }: { value?: string }) {
  return <label className="form-label">Role
    <select name="role" required defaultValue={value} className="form-select mt-1">
      {userRoles.map((role) => <option key={role} value={role}>{userRoleLabels[role]}</option>)}
    </select>
  </label>;
}
