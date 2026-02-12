import React, { Component, ErrorInfo, ReactNode } from 'react';
import './ErrorBoundary.css';
import { prettyPrint } from '../../utilities/prettyPrint';

interface Props {
   children: ReactNode;
}

interface State {
   hasError: boolean;
   error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
   public state: State = {
      hasError: false,
   };

   public static getDerivedStateFromError(error: Error): State {
      // Update state so the next render will show the fallback UI.
      return { hasError: true, error };
   }

   public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
      // Log unproxied error details for debugging (guarded by debug flag)
      prettyPrint('ErrorBoundary error.name', error?.name || 'Unknown', 'red');
      prettyPrint('ErrorBoundary error.message', error?.message || 'Unknown', 'red');
      prettyPrint('ErrorBoundary error.stack', error?.stack || 'No stack', 'red');
      prettyPrint('ErrorBoundary info.componentStack', errorInfo?.componentStack || 'No componentStack', 'orange');


      console.error('Uncaught error:', error, errorInfo);

   }

   public render() {
      if (this.state.hasError) {
         // You can render any custom fallback UI
         return (
            <div className="error-boundary">
               <h2>Something went wrong.</h2>
               <p>An unexpected error has occurred. Please try refreshing the page.</p>
               <details>
                  <summary>Error Details</summary>
                  <pre>{this.state.error?.stack}</pre>
               </details>
            </div>
         );
      }

      return this.props.children;
   }
}

export default ErrorBoundary;
