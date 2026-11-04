// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function isAutoPayable(_invoice: { id: string; vendorId: string }): Promise<boolean> {
  // TODO: real auto-pay eligibility check
  return false;
}
