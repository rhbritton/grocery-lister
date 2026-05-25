export const userLogout = () => ({
  type: 'USER_LOGOUT',
});

export async function resetUserSession(dispatch, persistor) {
  dispatch(userLogout());
  await persistor.purge();
}