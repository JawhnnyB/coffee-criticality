// Harness stand-ins: no sign-in in the browser test build.
export const authEnabled = false;
export function UserButton() { return null; }
export function useCurrentUserState() { return { user: null, isPending: false }; }
export function Link(props: { to?: string; children?: unknown; className?: string }) { return null as unknown as JSX.Element; }
