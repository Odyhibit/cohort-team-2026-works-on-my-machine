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
import { cilLockLocked } from "@coreui/icons";

// Account menu. Avatar is a placeholder until real auth/user data is wired in.
export default function AppHeaderDropdown() {
  return (
    <CDropdown variant="nav-item" placement="bottom-end">
      <CDropdownToggle className="py-0 pe-0" caret={false}>
        <CAvatar color="primary" textColor="white" size="md">
          BP
        </CAvatar>
      </CDropdownToggle>
      <CDropdownMenu className="pt-0">
        <CDropdownHeader className="bg-body-secondary fw-semibold mb-2">Account</CDropdownHeader>
        <CDropdownItem as={Link} href="/reset-password">
          <CIcon icon={cilLockLocked} className="me-2" />
          Reset Password
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  );
}
