"use client";

import { useState } from "react";
import { CButton, CLink } from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilCheckAlt, cilCopy } from "@coreui/icons";

export default function BrowserUseTaskLink({ taskId }: { taskId: string }) {
  const [result, setResult] = useState<"" | "copied" | "failed">("");

  async function copyTaskId() {
    setResult("");
    try {
      await navigator.clipboard.writeText(taskId);
      setResult("copied");
    } catch {
      setResult("failed");
    }
  }

  return (
    <span className="d-inline-flex align-items-center gap-1">
      <CLink href="https://cloud.browser-use.com/history" target="_blank" rel="noopener noreferrer"
        title={`Task ID: ${taskId}`} aria-label="Browser Use task (opens history in a new tab)">
        Browser Use task
      </CLink>
      <CButton type="button" color="link" size="sm" className="p-1 lh-1" onClick={copyTaskId}
        title={result === "copied" ? "Task ID copied" : "Copy task ID"} aria-label="Copy Browser Use task ID">
        <CIcon icon={result === "copied" ? cilCheckAlt : cilCopy} size="sm" aria-hidden="true" />
      </CButton>
      <span role="status" className={result === "failed" ? "small" : "visually-hidden"}>
        {result === "copied" ? "Task ID copied." : result === "failed" ? "Could not copy task ID." : ""}
      </span>
    </span>
  );
}
