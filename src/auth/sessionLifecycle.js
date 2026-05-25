export function shouldResetUserSession(previousUserId, nextUserId) {
  if (nextUserId == null) {
    return previousUserId != null;
  }

  return previousUserId != null && previousUserId !== nextUserId;
}

export function shouldFullRefreshUserData(previousUserId, nextUserId) {
  return previousUserId != null && previousUserId !== nextUserId;
}
