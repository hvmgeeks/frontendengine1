import usersSlice from "./usersSlice";
import { configureStore } from "@reduxjs/toolkit";
import loaderSlice from "./loaderSlice";
import subscriptionSlice from "./subscriptionSlice";
import paymentSlice from "./paymentSlice";

const store = configureStore({
  reducer: {
    user: usersSlice,
    loader: loaderSlice,
    subscription: subscriptionSlice,
    payment: paymentSlice
  },
});

export default store;
