import { MAX_VOTES } from "../constants.js";

export interface MessageInfo {
  [userId: number]: boolean;
  isPosted?: boolean;
  stickerMessageId?: number | null;
  sentMessageId?: number | null;
  timeoutId?: ReturnType<typeof setTimeout> | null;
}

export const messageInfo: Record<number, MessageInfo> = {};

export const hasUserVoted = (messageId: number, userId: number): boolean =>
  messageInfo[messageId]?.[userId] === true;

export const currentVotes = (messageId: number): number =>
  messageInfo[messageId] ? Object.keys(messageInfo[messageId]).length : 0;

export const hasEnoughVotes = (messageId: number): boolean => {
  const votes = currentVotes(messageId);
  return votes >= MAX_VOTES;
};