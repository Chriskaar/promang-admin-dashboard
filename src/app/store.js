import { configureStore } from "@reduxjs/toolkit";
import sessionReducer from "./slices/session";

const reducer = {
  session: sessionReducer,
};

const loadStateFromLocalStorage = () => {
  try {
    const serializedState = localStorage.getItem("state");
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return undefined;
  }
};

const saveStateToLocalStorage = (state) => {
  try {
    const savedStates = {
      session: state.session,
    };
    const serializedState = JSON.stringify(savedStates);
    localStorage.setItem("state", serializedState);
  } catch (err) {
    console.error(err);
  }
};

export const store = configureStore({
  reducer,
  preloadedState: loadStateFromLocalStorage(),
});

store.subscribe(() => {
  const currentState = store.getState();
  saveStateToLocalStorage(currentState);
});


