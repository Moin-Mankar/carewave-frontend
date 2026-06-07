import { BACKEND_API_URL } from '../constants/api';

export interface UserCheckResponse {
  exists: boolean;
}

export interface AuthResponseData {
  token: string;
  userId: string;
  firstName: string;
  contactNumber: string;
}

/**
 * Checks if a user already exists in the system based on their phone number.
 * Logs requests and responses for observability.
 */
export async function checkUserExists(phoneNumber: string): Promise<UserCheckResponse> {
  const url = `${BACKEND_API_URL}/auth/check-user`;
  const payload = { phoneNumber };

  console.log(`[API Request] POST - ${url}`);
  console.log(`[API Payload]`, JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log(`[API Response Status] ${response.status} - ${response.statusText}`);
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[API Response Body]`, JSON.stringify(data, null, 2));
    
    return data as UserCheckResponse;
  } catch (error) {
    console.error(`[API Network Error] Connection to ${url} failed:`, error);
    throw error;
  }
}

/**
 * Authenticates an existing user by their contact number, generating a JWT.
 */
export async function mobileLogin(contactNumber: string): Promise<AuthResponseData> {
  const url = `${BACKEND_API_URL}/auth/mobile-login`;
  const payload = { contactNumber };

  console.log(`[API Request] POST - ${url}`);
  console.log(`[API Payload]`, JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log(`[API Response Status] ${response.status} - ${response.statusText}`);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[API Response Body]`, JSON.stringify(data, null, 2));

    return data as AuthResponseData;
  } catch (error) {
    console.error(`[API Network Error] Connection to ${url} failed:`, error);
    throw error;
  }
}

/**
 * Registers a new user with their profile details and returns a JWT session.
 */
export async function mobileRegister(
  firstName: string,
  contactNumber: string,
  bloodGroup: string,
  gender: string
): Promise<AuthResponseData> {
  const url = `${BACKEND_API_URL}/auth/mobile-register`;
  const payload = { firstName, contactNumber, bloodGroup, gender };

  console.log(`[API Request] POST - ${url}`);
  console.log(`[API Payload]`, JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log(`[API Response Status] ${response.status} - ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[API Response Body]`, JSON.stringify(data, null, 2));

    return data as AuthResponseData;
  } catch (error) {
    console.error(`[API Network Error] Connection to ${url} failed:`, error);
    throw error;
  }
}
