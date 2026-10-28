import { CFooter } from "@coreui/react";

export default function AppFooter() {
  return (
    <CFooter className="px-4">
      <div>Multitenant Bill Payments</div>
      <div className="ms-auto">
        <span className="me-1">Built with</span>
        <a href="https://coreui.io/react" target="_blank" rel="noopener noreferrer">
          CoreUI
        </a>
      </div>
    </CFooter>
  );
}
