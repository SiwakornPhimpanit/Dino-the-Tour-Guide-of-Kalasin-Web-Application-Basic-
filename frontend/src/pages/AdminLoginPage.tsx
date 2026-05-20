import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
        <div style={{display : 'flex' , justifyContent : 'center' , marginTop : '20px'}}>
          <h1 className="authCardTitle">เข้าสู่ระบบผู้ดูแลระบบ</h1>
        </div>
        <form className="authForm" onSubmit={onSubmit}>
          {error ? <div className="authError">{error}</div> : null}
          <label className="field" >
            <span style={{marginTop : '20px'}}>อีเมลผู้ดูแลระบบ</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label >
            <span className="field" style={{marginTop : '20px'}}>รหัสผ่าน</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <div style={{display : 'flex' , justifyContent : 'center' , marginTop : '20px'}}>
          <button className="button buttonPrimary authSubmit" type="submit" disabled={busy}>
            {busy ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
          </button>
          </div>
        </form>
      </div>
    </section>
  );
}
