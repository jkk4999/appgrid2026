// Google Fonts imports are stripped from Syncfusion CSS at build time by vite.config.aura.js
// This prevents CSP violations by removing @import statements during the build process

import React, { createRef } from 'react';
import ReactDOM from 'react-dom/client';
import type { Root } from 'react-dom/client';
import type { AppProps, AppHandle } from './AppWrapper';

// Track React roots by container to enable proper unmounting
// This is critical for soft refresh scenarios where we need to clean up the old root
// Using a regular Map with container reference as key (WeakMap doesn't work well across page refreshes)
const rootMap = new Map<HTMLElement, Root>();

// Also track by a unique ID on the container element for cross-refresh scenarios
const CONTAINER_ROOT_KEY = '__reactRoot19';

/**
 * This is the main entry point for the Aura component.
 * It's exported so the Vite build process can attach it to `window.AppGrid`.
 * @param container The HTML element to render into.
 * @param props The initial props from the Aura component.
 * @param callback A function to call after the React app has been mounted, receives the app handle.
 */
const renderGridApp = (
   container: HTMLElement,
   props: AppProps,
   callback: (instance: AppHandle | null) => void
) => {
   console.log('[React Bundle] renderGridApp called');

   // Check if there's an existing root for this container and unmount it first
   // React 19: We need to properly unmount before creating a new root on the same container
   let existingRoot = rootMap.get(container);

   // Also check if root was attached directly to container (survives across module reloads)
   if (!existingRoot && (container as any)[CONTAINER_ROOT_KEY]) {
      existingRoot = (container as any)[CONTAINER_ROOT_KEY];
      console.log('[React Bundle] Found root attached to container element');
   }

   if (existingRoot) {
      console.log('[React Bundle] Found existing root, unmounting before re-render');
      try {
         existingRoot.unmount();
         rootMap.delete(container);
         delete (container as any)[CONTAINER_ROOT_KEY];
         // React 19: Give the unmount a moment to complete before creating new root
         // This prevents "container already has a root" warnings
      } catch (e) {
         console.warn('[React Bundle] Error unmounting existing root:', e);
      }
   }

   // React 19: Clear any orphaned React internal state on the container
   // This handles edge cases where unmount didn't fully clean up
   if ((container as any)._reactRootContainer) {
      console.log('[React Bundle] Clearing orphaned _reactRootContainer');
      delete (container as any)._reactRootContainer;
   }

   // Defer importing AppWrapper until the Aura host calls this function.
   // This guarantees window.AppGrid is attached even if downstream modules have issues.
   import('./AppWrapper')
      .then(({ AppWrapper }) => {
         try {
            const root = ReactDOM.createRoot(container);
            rootMap.set(container, root);
            // Also attach to container for cross-refresh scenarios
            (container as any)[CONTAINER_ROOT_KEY] = root;
            const appRef = createRef<AppHandle>();

            console.log('[React Bundle] Creating new React root and rendering AppWrapper');
            root.render(<AppWrapper ref={appRef} {...props} />);

            // Poll for ref to be populated (useImperativeHandle runs after first render)
            const pollForRef = (attempts = 0) => {
               if (appRef.current && typeof appRef.current.handleLmsAction === 'function') {
                  console.log('[React Bundle] App handle ready, calling callback with instance');
                  if (typeof callback === 'function') {
                     callback(appRef.current);
                  }
               } else if (attempts < 50) {
                  // Poll every 100ms, up to 5 seconds
                  setTimeout(() => pollForRef(attempts + 1), 100);
               } else {
                  console.warn('[React Bundle] App handle not ready after 5 seconds, calling callback with null');
                  if (typeof callback === 'function') {
                     callback(null);
                  }
               }
            };
            pollForRef();
         } catch (error) {
            console.error('A critical error occurred while rendering the React application:', error);
         }
      })
      .catch((e) => {
         console.error('[React Bundle] Failed to dynamically import AppWrapper:', e);
      });
};

/**
 * Unmount the React app from a container.
 * React 19: We must call root.unmount() to properly clean up.
 * @param container The HTML element containing the React app.
 */
const unmountGridApp = (container: HTMLElement) => {
   console.log('[React Bundle] unmountGridApp called');
   try {
      // Try to get root from our Map first
      let root = rootMap.get(container);

      // Also check container-attached root (survives module reloads)
      if (!root && (container as any)[CONTAINER_ROOT_KEY]) {
         root = (container as any)[CONTAINER_ROOT_KEY];
         console.log('[React Bundle] Found root attached to container element');
      }

      if (root) {
         console.log('[React Bundle] Found tracked root, unmounting');
         root.unmount();
         rootMap.delete(container);
         delete (container as any)[CONTAINER_ROOT_KEY];
      } else {
         console.log('[React Bundle] No tracked root found, clearing innerHTML as fallback');
         // Fallback: clear container if root wasn't tracked
         container.innerHTML = '';
      }

      // Clean up any React internal state
      if ((container as any)._reactRootContainer) {
         delete (container as any)._reactRootContainer;
      }
   } catch (error) {
      console.error('Error unmounting React app:', error);
      // Last resort fallback
      try {
         container.innerHTML = '';
         delete (container as any)[CONTAINER_ROOT_KEY];
         delete (container as any)._reactRootContainer;
      } catch (e) {
         // Ignore
      }
   }
};

// Manually attach the render function to the window object.
// This is a robust way to ensure it's available for the Aura component,
// bypassing any potential issues with the Vite build's 'name' configuration.
(window as any).AppGrid = {
   renderGridApp,
   unmountGridApp
};
console.log('[React Bundle] window.AppGrid attached successfully:', typeof (window as any).AppGrid?.renderGridApp);

