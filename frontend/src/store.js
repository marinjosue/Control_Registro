import { configureStore } from '@reduxjs/toolkit';

// Reducer dummy
const reducer = (state = {}, action) => state;

const store = configureStore({
  reducer: reducer
});

export default store;
