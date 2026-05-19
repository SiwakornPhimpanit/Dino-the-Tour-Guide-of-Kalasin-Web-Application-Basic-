import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import { setStoredAuth } from "../lib/auth";
import { HttpError } from "../lib/http";

export function RegisterPage() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("รหัสผ่านกับยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }
    if (password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    setBusy(true);
    try {
      const res = await authApi.register({
        email: email.trim(),
        password,
        displayName: displayName.trim() || undefined,
      });
      setStoredAuth(res.data);
      navigate("/assistant", { replace: true });
    } catch (err) {
      if (err instanceof HttpError) {
        const body = err.body as { message?: string; error?: string } | null;
        if (body?.error === "EMAIL_TAKEN") {
          setError("อีเมลนี้ถูกใช้แล้ว");
        } else {
          setError(body?.message ?? "สมัครสมาชิกไม่สำเร็จ");
        }
      } else {
        setError("สมัครสมาชิกไม่สำเร็จ");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="authPage">
      <div className="authCard">
        <h1 className="authCardTitle">สมัครสมาชิก</h1>
        <p className="muted authCardLead">สมัครเพื่อใช้ผู้ช่วย AI และเก็บประวัติการแชท</p>
        <form className="authForm" onSubmit={onSubmit}>
          {error ? <div className="authError">{error}</div> : null}
          <label className="authField">
            <span className="authFieldIcon" aria-hidden>
              #
            </span>
            <input
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="ชื่อที่แสดง (ไม่บังคับ)"
            />
          </label>
          <label className="authField">
            <span className="authFieldIcon" aria-hidden>
              @
            </span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="อีเมล"
              required
            />
          </label>
          <label className="authField">
            <span className="authFieldIcon" aria-hidden>
              *
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)"
              required
            />
          </label>
          <label className="authField">
            <span className="authFieldIcon" aria-hidden>
              *
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="ยืนยันรหัสผ่าน"
              required
            />
          </label>
          <button className="button buttonPrimary authSubmit" type="submit" disabled={busy}>
            {busy ? "กำลังสมัคร..." : "สมัครสมาชิก"}
          </button>
        </form>
        <p className="authCardFooter">
          มีบัญชีแล้ว? <Link to="/login">เข้าสู่ระบบ</Link>
        </p>
      </div>
    </section>
  );
}
