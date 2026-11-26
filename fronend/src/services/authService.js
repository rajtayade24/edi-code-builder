import { api } from "@/services/api";
import { extractError } from "@/utils/extractError";

const endpoints = {
  signupStart: "/auth/signup/start",
  verifyOtp: "/auth/signup/verify-otp",
  resendOtp: "/auth/signup/resend-otp",
  login: "/auth/login",
  me: "/auth/me",
};

function unwrap(response) {
  return response?.data?.data ?? {};
}

export async function signupStartRequest(payload) {
  try {
    const response = await api.post(endpoints.signupStart, payload);
    return unwrap(response);
  } catch (error) {
    throw new Error(extractError(error, "Could not start registration."));
  }
}

export async function verifySignupOtpRequest(payload) {
  try {
    const response = await api.post(endpoints.verifyOtp, payload);
    return unwrap(response);
  } catch (error) {
    throw new Error(extractError(error, "OTP verification failed."));
  }
}

export async function resendSignupOtpRequest(payload) {
  try {
    const response = await api.post(endpoints.resendOtp, payload);
    return unwrap(response);
  } catch (error) {
    throw new Error(extractError(error, "Could not resend OTP."));
  }
}

export async function loginRequest(payload) {
  try {
    const response = await api.post(endpoints.login, payload);
    return unwrap(response);
  } catch (error) {
    throw new Error(extractError(error, "Login failed."));
  }
}

export async function requestMe() {
  try {
    const response = await api.get(endpoints.me);
    return unwrap(response).user;
  } catch (error) {
    const wrapped = new Error(extractError(error, "Could not validate your session."));
    wrapped.status = error?.response?.status;
    throw wrapped;
  }
}
