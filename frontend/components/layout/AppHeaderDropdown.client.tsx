"use client";

import Link from "next/link";
import {
  CAvatar,
  CDropdown,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilAccountLogout, cilLockLocked } from "@coreui/icons";
import { signOut } from "@/app/login/actions";

// Account menu: avatar initials and email come from the signed-in user.
export default function AppHeaderDropdown({ email }: { email: string }) {
  const initials = email.split("@")[0].slice(0, 2).toUpperCase() || "?";

  return (
    <CDropdown variant="nav-item" placement="bottom-end">
      <CDropdownToggle className="py-0 pe-0" caret={false}>
        <CAvatar color="primary" textColor="white" size="md">
          {initials}
        </CAvatar>
      </CDropdownToggle>
      <CDropdownMenu className="pt-0">
        <CDropdownHeader className="bg-body-secondary fw-semibold mb-2 text-truncate">{email}</CDropdownHeader>
        <CDropdownItem as={Link} href="/reset-password">
          <CIcon icon={cilLockLocked} className="me-2" />
          Change Password
        </CDropdownItem>
        <form action={signOut}>
          <CDropdownItem as="button" type="submit">
            <CIcon icon={cilAccountLogout} className="me-2" />
            Sign out
          </CDropdownItem>
        </form>
      </CDropdownMenu>
    </CDropdown>
  );
}
