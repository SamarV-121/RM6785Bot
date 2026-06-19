import { REQUEST_TIMEOUT } from "../constants";

const trackUserRequests = new Map<number, number>();

export const updateUserRequest = (userId: number): number => {
  const currentCount = trackUserRequests.get(userId);

  if (currentCount !== undefined) {
    const newCount = currentCount + 1;
    trackUserRequests.set(userId, newCount);
    return newCount;
  }

  trackUserRequests.set(userId, 1);
  setTimeout(() => {
    trackUserRequests.delete(userId);
  }, REQUEST_TIMEOUT);
  return 1;
};