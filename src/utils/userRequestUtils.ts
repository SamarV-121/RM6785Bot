import { REQUEST_TIMEOUT } from "../constants.js";

const trackUserRequests = new Map<number, number>();

export const updateUserRequest = (userId: number): number => {
  let val = trackUserRequests.get(userId);

  if (val !== undefined) {
    trackUserRequests.set(userId, val + 1);
  } else {
    val = 0;
    trackUserRequests.set(userId, 1);
    setTimeout(() => {
      trackUserRequests.delete(userId);
    }, REQUEST_TIMEOUT);
  }

  return val + 1;
};