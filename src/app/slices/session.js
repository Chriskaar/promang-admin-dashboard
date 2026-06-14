import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  loginWithEmailAndPassword,
  getCurrentUser,
  requestAccessTokenWithRefreshToken,
  logoutUserWithToken,
} from "../api/session";

const initialState = {
  currentUser: null,
  loading: true,
  error: false,
  errorMessages: [],
  accessToken: getAccessToken() || undefined,
  refreshToken: getRefreshToken(),
  expiresIn: undefined,
  tokenType: undefined,
};

export const loginUser = createAsyncThunk(
  "session/loginUser",
  async (payload, { rejectWithValue }) => {
    const loginResponse = await loginWithEmailAndPassword(
      payload.email,
      payload.password
    );

    if (loginResponse.error) {
      return rejectWithValue(loginResponse);
    }

    if (!loginResponse.access_token) {
      return rejectWithValue({ error: "No access token received" });
    }

    const userResponse = await getCurrentUser(loginResponse.access_token);
    if (userResponse.error) {
      return rejectWithValue(userResponse.data);
    }

    return {
      ...loginResponse,
      ...userResponse?.data,
    };
  }
);

export const refreshAccessToken = createAsyncThunk(
  "session/refreshAccessToken",
  async (refreshToken, { rejectWithValue }) => {
    if (!refreshToken) {
      return rejectWithValue("No refresh token");
    }

    const refreshResponse = await requestAccessTokenWithRefreshToken(
      refreshToken
    );

    if (refreshResponse.error) {
      return rejectWithValue(refreshResponse);
    }

    if (!refreshResponse.access_token) {
      return rejectWithValue({ error: "No access token received" });
    }

    const userResponse = await getCurrentUser(refreshResponse.access_token);

    if (userResponse.error) {
      return rejectWithValue(userResponse.data);
    }

    return {
      ...refreshResponse,
      ...userResponse?.data,
    };
  }
);

export const logoutUser = createAsyncThunk(
  "session/logoutUser",
  async (token, { rejectWithValue }) => {
    const response = await logoutUserWithToken(token);
    if (response.error) {
      return rejectWithValue(response);
    }
    return response;
  }
);

export const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    resetErrorState: (state) => {
      state.error = false;
      state.errorMessages = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = false;
        state.errorMessages = [];
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const payload = action.payload;
        state.accessToken = payload.access_token;
        state.refreshToken = payload.refresh_token;
        state.expiresIn = payload.expires_in;
        state.currentUser = payload;
        if (payload.refresh_token) storeRefreshToken(payload.refresh_token);
        if (payload.access_token) storeAccessToken(payload.access_token);
        state.loading = false;
        state.error = false;
        state.errorMessages = [];
      })
      .addCase(loginUser.rejected, (state) => {
        state.loading = false;
        state.error = true;
        state.errorMessages = ["Invalid credentials. Did you enter them correctly?"];
      })
      .addCase(refreshAccessToken.pending, (state) => {
        state.loading = true;
        state.error = false;
        state.errorMessages = [];
      })
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        const payload = action.payload;
        state.accessToken = payload.access_token;
        state.refreshToken = payload.refresh_token;
        state.expiresIn = payload.expires_in;
        state.currentUser = payload;
        if (payload.refresh_token) storeRefreshToken(payload.refresh_token);
        if (payload.access_token) storeAccessToken(payload.access_token);
        state.loading = false;
        state.error = false;
        state.errorMessages = [];
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        state.loading = false;
        state.error = true;
      })
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = false;
        state.errorMessages = [];
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.currentUser = null;
        state.accessToken = undefined;
        state.refreshToken = undefined;
        state.expiresIn = undefined;
        state.tokenType = undefined;
        removeRefreshToken();
        removeAccessToken();
        state.loading = false;
        state.error = false;
        state.errorMessages = [];
      })
      .addCase(logoutUser.rejected, (state) => {
        state.currentUser = null;
        state.accessToken = undefined;
        state.refreshToken = undefined;
        state.expiresIn = undefined;
        state.tokenType = undefined;
        removeRefreshToken();
        removeAccessToken();
        state.loading = false;
        state.error = true;
      });
  },
});

export const { resetErrorState } = sessionSlice.actions;

export default sessionSlice.reducer;

function storeRefreshToken(token) {
  localStorage.setItem("refreshToken", token);
}

function storeAccessToken(token) {
  localStorage.setItem("accessToken", token);
}

function removeRefreshToken() {
  localStorage.removeItem("refreshToken");
}

function removeAccessToken() {
  localStorage.removeItem("accessToken");
}

export function getRefreshToken() {
  return localStorage.getItem("refreshToken");
}

export function getAccessToken() {
  return localStorage.getItem("accessToken");
}


