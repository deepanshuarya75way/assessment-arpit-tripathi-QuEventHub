import crypto from "node:crypto";

export function encryptResponse(req, res, next) {
  const originalJson = res.json.bind(res);
  const publicKeyHeader = req.headers["x-response-public-key"];

  res.json = function (body) {
    if (!publicKeyHeader || body == null) {
      return originalJson(body);
    }

    try {
      const publicKey = crypto.createPublicKey({
        key: Buffer.from(publicKeyHeader, "base64"),
        format: "der",
        type: "spki",
      });

      if (publicKey.asymmetricKeyType !== "rsa") {
        return res.status(400).end();
      }

      const aesKey = crypto.randomBytes(32);
      const iv = crypto.randomBytes(12);

      const cipher = crypto.createCipheriv(
        "aes-256-gcm",
        aesKey,
        iv
      );

      const plaintext = Buffer.from(
        JSON.stringify(body),
        "utf8"
      );

      const ciphertext = Buffer.concat([
        cipher.update(plaintext),
        cipher.final(),
      ]);

      const tag = cipher.getAuthTag();

      const encryptedKey = crypto.publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256",
        },
        aesKey
      );

      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Pragma", "no-cache");

      return originalJson({
        encrypted: true,
        algorithm: "AES-256-GCM",
        keyAlgorithm: "RSA-OAEP-256",
        iv: iv.toString("base64"),
        encryptedKey: encryptedKey.toString("base64"),
        data: Buffer.concat([ciphertext, tag]).toString("base64"),
      });
    } catch (error) {
      console.error("Response encryption failed");
      return res.status(500).end();
    }
  };

  next();
}