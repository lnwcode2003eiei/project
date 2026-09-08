import crypto from "crypto";

const TOKEN_TTL_SECONDS = 60 * 60 * 8;
const tokenSecret = process.env.ADMIN_TOKEN_SECRET;

if (process.env.NODE_ENV === "production" && !tokenSecret) {
  throw new Error("ADMIN_TOKEN_SECRET ต้องถูกตั้งค่าเมื่อใช้งาน production");
}

const signingSecret = tokenSecret || crypto.randomBytes(32).toString("hex");

const toBase64Url = (value) =>
  Buffer.from(value).toString("base64url");

const sign = (value) =>
  crypto
    .createHmac("sha256", signingSecret)
    .update(value)
    .digest("base64url");

export const createAdminToken = (user) => {
  const payload = {
    sub: user.id,
    username: user.username,
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    saka_path: user.saka_path || "all",
    can_edit: Number(user.can_edit || 0),
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
};

export const verifyAdminPassword = (password, storedHash) => {
  if (!storedHash?.startsWith("scrypt$")) {
    return false;
  }

  const [, salt, hash] = storedHash.split("$");
  if (!salt || !hash) {
    return false;
  }

  const derivedHash = crypto.scryptSync(password, salt, 64).toString("hex");
  if (hash.length !== derivedHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(derivedHash, "hex"),
    Buffer.from(hash, "hex"),
  );
};

export const hashAdminPassword = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
};

export const requireAdmin = (req, res, next) => {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ success: false, message: "กรุณาเข้าสู่ระบบ" });
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return res.status(401).json({ success: false, message: "Token ไม่ถูกต้อง" });
  }

  const expectedSignature = sign(encodedPayload);
  if (signature.length !== expectedSignature.length) {
    return res.status(401).json({ success: false, message: "Token ไม่ถูกต้อง" });
  }

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return res.status(401).json({ success: false, message: "Token ไม่ถูกต้อง" });
  }

  try {
    const user = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (!user.exp || user.exp <= Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ success: false, message: "Token หมดอายุ กรุณาเข้าสู่ระบบใหม่" });
    }

    req.admin = user;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Token ไม่ถูกต้อง" });
  }
};
