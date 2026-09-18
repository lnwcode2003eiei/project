import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { emptyDetails, validateDetails, registerCourseDetails } from "./course-details.js";

test("empty content is neutral; Thai text, links and contact round-trip", () => {
  assert.deepEqual(validateDetails({}), emptyDetails());
  const value = emptyDetails();
  value.philosophy = "เรียนรู้จากการปฏิบัติจริง";
  value.supports.push({ title: "รายละเอียดทุน", description: "สอบถามเจ้าหน้าที่", url: "https://example.com/scholarship", icon: "award" });
  value.contact.email = "faculty@example.com";
  assert.deepEqual(validateDetails(value), value);
});
test("reject malformed content, unsafe links and oversized input", () => {
  for (const value of [null, [], { philosophy: 42 }, { philosophy: "x".repeat(10001) }, { supports: {} }, { supports: [{}] }, { contact: [] }, { contact: { email: "bad" } }, { contact: { url: "javascript:alert(1)" } }, { supports: Array(41).fill({ title: "item" }) }, { documents: [{ title: "bad link", url: "data:text/html,test" }] }]) {
    assert.throws(() => validateDetails(value));
  }
});
test("routes isolate branches, enforce auth, validate before saving and persist edits/deletions", async () => {
  const app = express(); app.use(express.json());
  const saved = new Map();
  const db = { query(sql, params, callback) {
    if (sql.startsWith("CREATE")) return callback(null, {});
    if (sql.startsWith("SELECT id")) return callback(null, ["computer", "management"].includes(params[0]) ? [{ id: 1 }] : []);
    if (sql.startsWith("SELECT content")) return callback(null, saved.has(params[0]) ? [{ content: saved.get(params[0]) }] : []);
    if (sql.startsWith("INSERT")) { saved.set(params[0], params[1]); return callback(null, {}); }
    callback(new Error("Unexpected SQL"));
  } };
  const auth = (req, res, next) => {
    if (!req.headers.authorization) return res.status(401).json({ success: false });
    req.admin = req.headers.authorization; next();
  };
  registerCourseDetails(app, db, auth, (req, slug, done) => done(req.admin === "all" || req.admin === slug ? null : { status: 403, message: "ไม่มีสิทธิ์" }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const request = (slug, method = "GET", data, authorization) => fetch(`http://127.0.0.1:${server.address().port}/api/course-details/${slug}`, { method, headers: { "Content-Type": "application/json", ...(authorization ? { authorization } : {}) }, body: data ? JSON.stringify(data) : undefined });
  try {
    assert.equal((await request("computer", "PUT", {})).status, 401);
    assert.equal((await request("management", "PUT", {}, "computer")).status, 403);
    assert.equal((await request("missing")).status, 404);
    assert.equal((await request("missing", "PUT", {}, "all")).status, 404);
    assert.equal((await request("computer", "PUT", { supports: [{}] }, "all")).status, 400);
    const value = emptyDetails(); value.philosophy = "ข้อมูลสาขาคอมพิวเตอร์";
    value.plos = [{ title: "PLO 1", description: "ทดสอบ", icon: "target", url: "" }];
    assert.equal((await request("computer", "PUT", value, "computer")).status, 200);
    assert.deepEqual((await (await request("computer")).json()).data, value);
    assert.deepEqual((await (await request("management")).json()).data, emptyDetails());
    assert.equal((await request("computer", "PUT", {}, "all")).status, 200);
    assert.deepEqual((await (await request("computer")).json()).data, emptyDetails());
  } finally { await new Promise(resolve => server.close(resolve)); }
});
