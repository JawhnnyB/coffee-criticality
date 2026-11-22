"use client";

import { Component, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

export type PlantReport = { key: string; message: string; detail: string };

let current: PlantReport | null = null;
const subs = new Set<() => void>();

function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message || err.name || "The shift stopped.";
  if (typeof err === "string" && err.trim()) return err.trim();
  return "The shift stopped.";
}

function keyOf(err: unknown): string {
  if (err instanceof Error) return `${err.name}:${err.message}`;
  return messageOf(err);
}

export function reportFrom(err: unknown): PlantReport {
  const message = messageOf(err);
  const stack = err instanceof Error && err.stack ? err.stack : "";
  const href = typeof location !== "undefined" ? location.href : "";
  const when = new Date().toISOString();
  const detail = ["Coffee & Criticality", "The plant phone rang.", message, stack, href, when]
    .filter((line) => line !== "")
    .join("\n");
  return { key: keyOf(err), message, detail };
}

/** Remember one crash and tell the card. A repeat of the same error does not stack cards. */
export function ringPlantPhone(err: unknown) {
  const next = reportFrom(err);
  if (current && current.key === next.key) return;
  current = next;
  for (const sub of subs) sub();
}

function subscribe(cb: () => void) {
  subs.add(cb);
  return () => subs.delete(cb);
}

function getSnapshot() {
  return current;
}

function getServerSnapshot() {
  return null;
}

function onWindowError(e: Event) {
  if (!(e instanceof ErrorEvent)) return;
  if (e.target && e.target !== window) return;
  ringPlantPhone(e.error ?? e.message);
}

function onRejection(e: PromiseRejectionEvent) {
  ringPlantPhone(e.reason);
}

if (typeof window !== "undefined" && !window.__ccPlantPhoneBound) {
  window.__ccPlantPhoneBound = true;
  window.addEventListener("error", onWindowError);
  window.addEventListener("unhandledrejection", onRejection);
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function PlantPhoneCard({ report }: { report: PlantReport }) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-bg/90 px-4"
      data-testid="plant-phone"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="plant-phone-title"
    >
      <div className="w-full max-w-sm border border-border bg-surface px-5 py-6 text-fg">
        <p className="font-mono text-[11px] tracking-[0.18em] text-subtle">CONTROL ROOM</p>
        <h1 id="plant-phone-title" className="font-display mt-2 text-2xl">
          The plant phone rang.
        </h1>
        <p className="mt-2 text-sm text-muted">The shift stopped. A report is ready.</p>
        <p className="mt-3 break-words font-mono text-[11px] leading-relaxed text-subtle" data-testid="plant-phone-message">
          {report.message}
        </p>
        <button
          type="button"
          className="btn-primary mt-5"
          data-testid="plant-phone-copy"
          onClick={() => {
            void copyText(report.detail).then((ok) => {
              if (ok) setCopied(true);
            });
          }}
        >
          Copy report
        </button>
        {copied ? (
          <p className="mt-2 font-mono text-[11px] text-subtle" data-testid="plant-phone-copied">
            Copied. Send it when you can.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function PlantPhoneWatch() {
  const report = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!report) return null;
  return <PlantPhoneCard report={report} />;
}

/** Keeps a render crash from wiping the page. The card itself lives in PlantPhoneWatch. */
export class PlantPhoneBoundary extends Component<{ children: ReactNode }, { down: boolean }> {
  state = { down: false };

  static getDerivedStateFromError() {
    return { down: true };
  }

  componentDidCatch(err: unknown) {
    ringPlantPhone(err);
  }

  render() {
    if (this.state.down) return <div className="fixed inset-0 z-[70] bg-bg" data-testid="plant-phone-hold" />;
    return this.props.children;
  }
}

/** Labelled hook for the crash proof. Not a player control. */
export function CrashSwitch() {
  const [boom, setBoom] = useState<string | null>(null);
  useEffect(() => {
    window.__plantPhone = {
      breakRender: () => setBoom("Render proof. The shift threw."),
      breakLater: () => {
        window.setTimeout(() => {
          throw new Error("Event proof. The shift threw.");
        }, 0);
      },
    };
    return () => {
      delete window.__plantPhone;
    };
  }, []);
  if (boom) throw new Error(boom);
  return null;
}

declare global {
  interface Window {
    __ccPlantPhoneBound?: boolean;
    __plantPhone?: {
      breakRender: () => void;
      breakLater: () => void;
    };
  }
}
