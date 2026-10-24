const SESSION_STORAGE_KEY = "traveladmin.session";

export function setToken(token, role = "admin") {
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      token,
      user: { email: "", name: role, role },
    }),
  );
  location.reload();
}
