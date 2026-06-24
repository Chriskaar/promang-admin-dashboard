import axios from "./axios";

function apiErrorMessage(error, fallback) {
  const data = error.response?.data;
  if (data && typeof data === "object") {
    return data.message || data.errors?.[0] || fallback;
  }
  if (error.response?.status === 404) {
    return "Admin client apps API not found — ensure promang-api includes /api/v1/admin/client_apps and restart the server.";
  }
  if (!error.response) {
    return "Could not reach the Promang API. Check REACT_APP_BACKEND_URL (must end with /api/v1).";
  }
  return fallback;
}

export async function getClientApps() {
  return axios
    .get("/admin/client_apps")
    .then((response) => {
      return { data: response.data, error: null };
    })
    .catch((error) => {
      return {
        data: null,
        error: { message: apiErrorMessage(error, "Failed to fetch client apps") },
      };
    });
}

export async function getClientApp(id) {
  return axios
    .get(`/admin/client_apps/${id}`)
    .then((response) => {
      return { data: response.data, error: null };
    })
    .catch((error) => {
      return {
        data: null,
        error: { message: apiErrorMessage(error, "Failed to fetch client app") },
      };
    });
}

export async function updateClientApp(id, payload) {
  return axios
    .patch(`/admin/client_apps/${id}`, payload)
    .then((response) => {
      return { data: response.data, error: null };
    })
    .catch((error) => {
      return {
        data: null,
        error: { message: apiErrorMessage(error, "Failed to update client app") },
      };
    });
}

export async function rollClientAppKeys(id, { rollUid, rollSecret }) {
  return axios
    .post(`/admin/client_apps/${id}/roll_keys`, {
      roll_uid: rollUid,
      roll_secret: rollSecret,
    })
    .then((response) => {
      return { data: response.data, error: null };
    })
    .catch((error) => {
      return {
        data: null,
        error: { message: apiErrorMessage(error, "Failed to roll client app keys") },
      };
    });
}

export async function deleteClientApp(id, confirmName) {
  return axios
    .delete(`/admin/client_apps/${id}`, {
      data: { confirm_name: confirmName },
    })
    .then((response) => {
      return { data: response.data, error: null };
    })
    .catch((error) => {
      return {
        data: null,
        error: { message: apiErrorMessage(error, "Failed to delete client app") },
      };
    });
}
