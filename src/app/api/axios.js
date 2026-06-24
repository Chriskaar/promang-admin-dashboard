import axios from "axios";
import { getAccessToken } from "../slices/session";

const instance = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || "http://localhost:4000/api/v1",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

instance.interceptors.request.use((request) => {
  const hasAuthorization =
    request.headers?.Authorization != null ||
    request.headers?.authorization != null;
  if (!hasAuthorization) {
    const accessToken = getAccessToken();
    if (accessToken) {
      request.headers["Authorization"] = `Bearer ${accessToken}`;
    }
  }
  return request;
});

export default instance;


