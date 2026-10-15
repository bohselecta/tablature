import { lazy, Suspense } from "react";
import { LiveCanvas } from "./live/LiveCanvas";
const LegacyStudio = lazy(() => import("./LegacyStudio"));
export default function App() {
  return new URLSearchParams(location.search).get("studio") === "legacy" ? (
    <>
      <a href="/" className="return-live">
        Return to Live Canvas
      </a>
      <Suspense fallback={<p>Opening original studio…</p>}>
        <LegacyStudio />
      </Suspense>
    </>
  ) : (
    <LiveCanvas />
  );
}
