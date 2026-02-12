import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
   children: ReactNode;
}

interface State {
   hasError: boolean;
   error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
   public state: State = {
      hasError: false,
      error: null,
   };

   public static getDerivedStateFromError(error: Error): State {
      // Update state so the next render will show the fallback UI.
      return { hasError: true, error };
   }

   // This is the most important method for debugging!
   public componentDidCatch(error: any, errorInfo: ErrorInfo) {
      console.error("--- React Error Boundary Caught an Error ---");

      // Log the component stack - this tells you WHERE the error happened.
      console.error("Component Stack:", errorInfo.componentStack);

      // Log the raw error object - it will show as Proxy(Object)
      console.error("Raw Error Object:", error);

      // THIS IS THE KEY: Stringify the error to safely inspect it.
      // Locker Service will often reveal the underlying error message when stringified.
      try {
         const safeErrorString = JSON.stringify(error, null, 2);
         console.error("Stringified Locker Service Error:", safeErrorString);
      } catch (e) {
         console.error("Could not stringify the error object:", e);
      }

      console.error("------------------------------------------");
   }

   public render() {
      if (this.state.hasError) {
         // You can render a user-friendly fallback UI
         return (
            <div style={{ padding: '20px', color: 'red' }}>
               <h1>Application Error</h1>
               <p>An error occurred while rendering the component. Please check the browser console for technical details.</p>
            </div>
         );
      }

      return this.props.children;
   }
}

export default ErrorBoundary;