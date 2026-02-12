import { configureStore } from '@reduxjs/toolkit';
// import counterReducer from './features/counterSlice';

export const store = configureStore({
  reducer: {
   //  counter: counterReducer,
  },
});

// Infer types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
