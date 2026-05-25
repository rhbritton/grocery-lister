export function shouldResetUserSession(previousUserId, nextUserId) {
  if (nextUserId == null) {
    return previousUserId != null;
  }

  return previousUserId != null && previousUserId !== nextUserId;
}

export function shouldFullRefreshUserData(previousUserId, nextUserId) {
  if (!nextUserId) {
    return false;
  }

  // After logout or account deletion previousUserId is null — always replace local data.
  if (previousUserId === null) {
    return true;
  }

  return previousUserId != null && previousUserId !== nextUserId;
}
