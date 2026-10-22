/**
 * SOURCE_INERT — marks a control whose Flutter callback was empty (`onTap: () {}` / `onPressed: () {}`).
 * The visual affordance is preserved; no product behaviour is invented.
 * Every id passed here is listed in docs/source-inert-controls.md.
 */
export function SOURCE_INERT(id: string): () => void {
  return () => {
    if (__DEV__) console.log(`[SOURCE_INERT] ${id}`);
  };
}
