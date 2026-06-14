import axios from "./axios";

function apiErrorMessage(error, fallback) {
  const data = error.response?.data;
  if (data && typeof data === "object") {
    return data.message || data.errors?.[0] || fallback;
  }
  if (error.response?.status === 404) {
    return "Admin companies API not found — ensure promang-api includes /api/v1/admin routes and restart the server.";
  }
  if (!error.response) {
    return "Could not reach the Promang API. Check REACT_APP_BACKEND_URL (must end with /api/v1).";
  }
  return fallback;
}

export async function getCompanies() {
  return axios
    .get("/admin/companies")
    .then((response) => {
      return { data: response.data, error: null };
    })
    .catch((error) => {
      return {
        data: null,
        error: { message: apiErrorMessage(error, "Failed to fetch companies") },
      };
    });
}

export async function getCompany(id) {
  return axios
    .get(`/admin/companies/${id}`)
    .then((response) => {
      return { data: response.data, error: null };
    })
    .catch((error) => {
      return {
        data: null,
        error: { message: apiErrorMessage(error, "Failed to fetch company") },
      };
    });
}

export async function getCompanyUsers(companyId) {
  return axios
    .get(`/admin/companies/${companyId}/users`)
    .then((response) => {
      return { data: response.data, error: null };
    })
    .catch((error) => {
      return {
        data: null,
        error: { message: apiErrorMessage(error, "Failed to fetch users") },
      };
    });
}

export async function addUserToCompany(companyId, userData) {
  return axios
    .post(`/admin/companies/${companyId}/users`, userData)
    .then((response) => {
      return { data: response.data, error: null };
    })
    .catch((error) => {
      return {
        data: null,
        error: { message: apiErrorMessage(error, "Failed to add user") },
      };
    });
}


