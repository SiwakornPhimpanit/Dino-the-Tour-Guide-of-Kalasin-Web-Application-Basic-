import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import { setStoredAuth } from "../lib/auth";
import { HttpError } from "../lib/http";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await authApi.login({ email: email.trim(), password });
      if (res.data.user.role !== "admin") {
        setError("บัญชีนี้ไม่ใช่ผู้ดูแลระบบ");
        return;
      }
      setStoredAuth(res.data);
      navigate("/admin", { replace: true });
    } catch (err) {
      if (err instanceof HttpError) {
        const body = err.body as { message?: string } | null;
        setError(body?.message ?? "เข้าสู่ระบบไม่สำเร็จ");
      } else {
        setError("เข้าสู่ระบบไม่สำเร็จ");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="authPage">
      <div className="authCard">
        <h1 className="authCardTitle">เข้าสู่ระบบผู้ดูแล</h1>
        <form className="authForm" onSubmit={onSubmit}>
          {error ? <div className="authError">{error}</div> : null}
          <label className="field">
            <span>อีเมล</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>รหัสผ่าน</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button className="button buttonPrimary authSubmit" type="submit" disabled={busy}>
            {busy ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
        <p className="authCardFooter">
          <Link to="/">กลับหน้าแรก</Link>
          {" · "}
          <Link to="/login">เข้าสู่ระบบสมาชิก</Link>
        </p>
      </div>
    </section>
  );
}
