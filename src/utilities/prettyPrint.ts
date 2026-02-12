export const prettyPrint = (
  label: string,
  data: any,
  labelColor: string = 'white'
) => {
  // The label uses the specified color, defaulting to white.
  console.log(`%c${label}:`, `color: ${labelColor}; font-weight: bold;`);

  if (data) {
    // Attempt to stringify. If a circular structure is present,
    // fall back to logging the raw object to avoid runtime errors.
    try {
      console.log(`%c${JSON.stringify(data, null, 2)}`, `color: white;`);
    } catch {
      console.log(data);
    }
  }
};

// Provide a global fallback for modules that may call prettyPrint without importing it.
// This avoids runtime ReferenceError in lazily loaded chunks.
(globalThis as any).prettyPrint = prettyPrint;
