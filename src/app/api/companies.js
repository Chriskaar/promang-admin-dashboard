import axios from "./axios";

export async function getCompanies() {
  return axios
    .get("/admin/companies")
    .then((response) => {
      return { data: response.data, error: null };
    })
    .catch((error) => {
      return { data: null, error: error.response?.data || { message: "Failed to fetch companies" } };
    });
}

export async function getCompany(id) {
  return axios
    .get(`/admin/companies/${id}`)
    .then((response) => {
      return { data: response.data, error: null };
    })
    .catch((error) => {
      return { data: null, error: error.response?.data || { message: "Failed to fetch company" } };
    });
}

export async function getCompanyUsers(companyId) {
  return axios
    .get(`/admin/companies/${companyId}/users`)
    .then((response) => {
      return { data: response.data, error: null };
    })
    .catch((error) => {
      return { data: null, error: error.response?.data || { message: "Failed to fetch users" } };
    });
}

export async function addUserToCompany(companyId, userData) {
  return axios
    .post(`/admin/companies/${companyId}/users`, userData)
    .then((response) => {
      return { data: response.data, error: null };
    })
    .catch((error) => {
      return { data: null, error: error.response?.data || { message: "Failed to add user" } };
    });
}


