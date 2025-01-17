import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  paymentVerificationNeeded: false,
};

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    setPaymentVerificationNeeded: (state, action) => {
      state.paymentVerificationNeeded = action.payload;
    },
  },
});

export const { setPaymentVerificationNeeded } = paymentSlice.actions;

export default paymentSlice.reducer;