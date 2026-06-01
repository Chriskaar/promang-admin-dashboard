import axios from "./axios";

const LOGIN_URL = "/oauth/token";
const LOGOUT_URL = "/oauth/revoke";
const CURRENT_USER_URL = "/users/me";

const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;
const CLIENT_SECRET = process.env.REACT_APP_CLIENT_SECRET;

export async function loginWithEmailAndPassword(email, password) {
  const data = {
    grant_type: "password",
    scope: "write",
    email: email,
    password: password,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  };

  return axios
    .post(LOGIN_URL, data)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      return error.response?.data || { error: "Login failed" };
    });
}

export async function logoutUserWithToken(token) {
  const data = {
    token: token,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  };

  return axios
    .post(LOGOUT_URL, data)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      return error.response?.data || { error: "Logout failed" };
    });
}

export async function requestAccessTokenWithRefreshToken(refreshToken) {
  const data = {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  };

  return axios
    .post(LOGIN_URL, data)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      return error.response?.data || { error: "Token refresh failed" };
    });
}

export async function getCurrentUser(accessToken) {
  const config = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  return await axios
    .get(CURRENT_USER_URL, config)
    .then((response) => {
      return { data: response.data, status: response.status };
    })
    .catch((error) => {
      return {
        data: error.response?.data,
        error: "Failed to get user",
        status: error.response?.status,
      };
    });
}


