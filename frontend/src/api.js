import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL;
const isProduction = import.meta.env.PROD;

const baseURL =
  configuredApiUrl ||
  (isProduction ? "" : "http://localhost:5000");

if (isProduction && !configuredApiUrl) {
  throw new Error("VITE_API_URL must be configured in production.");
}

if (isProduction && !configuredApiUrl.startsWith("https://")) {
  throw new Error("VITE_API_URL must use HTTPS in production.");
}

const api = axios.create({
  baseURL: `${baseURL.replace(/\/$/, "")}/api`,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Encode bytes as Base64.
function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

// Decode Base64 into bytes.
function fromBase64(value) {
  const binary = atob(value);

  return Uint8Array.from(binary, (char) =>
    char.charCodeAt(0)
  );
}

// Generate one temporary key pair for this page session.
let keyPairPromise;

function getKeyPair() {
  if (!keyPairPromise) {
    keyPairPromise = window.crypto.subtle
      .generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
      )
      .then(async (keyPair) => {
        const publicKey = await window.crypto.subtle.exportKey(
          "spki",
          keyPair.publicKey
        );

        return {
          privateKey: keyPair.privateKey,
          publicKey: toBase64(publicKey),
        };
      })
      .catch((error) => {
        keyPairPromise = undefined;
        throw error;
      });
  }

  return keyPairPromise;
}

// Decrypt a response produced by the backend middleware.
async function decryptResponse(response) {
  const payload = response?.data;

  if (!payload?.encrypted) {
    return response;
  }

  if (
    payload.algorithm !== "AES-256-GCM" ||
    payload.keyAlgorithm !== "RSA-OAEP-256"
  ) {
    throw new Error("Unsupported encrypted response format.");
  }

  const { privateKey } = await getKeyPair();

  const aesKeyBytes = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    fromBase64(payload.encryptedKey)
  );

  const aesKey = await window.crypto.subtle.importKey(
    "raw",
    aesKeyBytes,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  // Backend sends ciphertext followed by the 16-byte GCM tag.
  const plaintext = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: fromBase64(payload.iv),
      tagLength: 128,
    },
    aesKey,
    fromBase64(payload.data)
  );

  response.data = JSON.parse(
    new TextDecoder().decode(plaintext)
  );

  return response;
}

api.interceptors.request.use(
  async (config) => {
    window.dispatchEvent(new Event("app:request-start"));

    try {
      const [{ publicKey }] = await Promise.all([
        getKeyPair(),
      ]);

      config.headers.set(
        "X-Response-Public-Key",
        publicKey
      );

      const token = sessionStorage.getItem("token");

      if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
      }

      if (config.data instanceof FormData) {
        config.headers.delete("Content-Type");
      }

      return config;
    } catch (error) {
      window.dispatchEvent(new Event("app:request-end"));
      throw error;
    }
  },
  (error) => {
    window.dispatchEvent(new Event("app:request-end"));
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  async (response) => {
    try {
      const decrypted = await decryptResponse(response);
      return decrypted;
    } finally {
      window.dispatchEvent(new Event("app:request-end"));
    }
  },
  async (error) => {
    try {
      if (error.response?.data?.encrypted) {
        await decryptResponse(error.response);
      }
    } catch {
      error.message = "Unable to decrypt the server response.";
    } finally {
      window.dispatchEvent(new Event("app:request-end"));
    }

    if (!error.response) {
      return Promise.reject({
        ...error,
        message: error.message || "Network error. Please check your connection.",
        isNetworkError: true,
      });
    }

    if (
      error.response.status === 401 ||
      error.response.status === 403
    ) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
    }

    if (error.response.status >= 500) {
      console.error("Server error occurred.");
    }

    return Promise.reject(error);
  }
);

export const fetchClubs = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await api.get(`/clubs?${params}`);
  return res.data;
};

export const joinClub = async (clubId) => {
  const res = await api.post(`/clubs/${clubId}/join`);
  return res.data;
};

export default api;