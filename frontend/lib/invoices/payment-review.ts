// Only for the explicit human review path, after its acknowledgment and note.
// Automatic settlement must still read and validate the actual provider result.
export async function checkPaymentTaskForReview(
  runId: string | null,
  readStatus: (runId: string) => Promise<{ status: string }>,
): Promise<void> {
  if (!runId) return;
  let task: { status: string };
  try {
    task = await readStatus(runId);
  } catch (error) {
    // A task may belong to another team's Browser Use account or have expired.
    // As with a missing saved task ID, human verification can resolve it.
    if (error && typeof error === "object" && "httpStatus" in error && error.httpStatus === 404) return;
    throw error;
  }
  if (["queued", "dispatching", "running"].includes(task.status)) {
    throw new Error("The task is still running. Wait for it to stop before resolving the payment.");
  }
  if (!["completed", "failed", "cancelled"].includes(task.status)) {
    throw new Error("The task status could not be verified. Check Browser Use before resolving the payment.");
  }
}
