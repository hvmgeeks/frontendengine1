import { createSlice } from "@reduxjs/toolkit";

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState: {
    subscriptionData: null,
  },
  reducers: {
    SetSubscription: (state, action) => {
      state.subscriptionData = action.payload;
    },
  },
});

export const { SetSubscription } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
