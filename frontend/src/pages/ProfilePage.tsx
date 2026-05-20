import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import { FormField } from "../components/FormField";
import { getStoredAuth, setStoredAuth } from "../lib/auth";
import { HttpError } from "../lib/http";

export function ProfilePage() {
  const navigate = useNavigate();
  const auth = getStoredAuth();
  const [displayName, setDisplayName] = useState(auth?.user.displayName ?? "");
  const [email, setEmail] = useState(auth?.user.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  function cancelPasswordChange() {
    setShowChangePassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  useEffect(() => {
    if (!auth) {
      navigate("/login", { replace: true });
    }
  }, [auth, navigate]);

  if (!auth) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError("กรุณากรอกอีเมล");
      return;
    }

    const wantsPassword = showChangePassword;
    if (wantsPassword) {
      if (!currentPassword.trim()) {
        setError("กรุณากรอกรหัสผ่านปัจจุบัน");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("รหัสผ่านใหม่กับยืนยันไม่ตรงกัน");
        return;
      }
      if (newPassword.length < 6) {
        setError("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
        return;
      }
      if (newPassword === currentPassword) {
        setError("รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน");
        return;
      }
    }

    setBusy(true);
    try {
      const payload: Parameters<typeof authApi.updateProfile>[0] = {
        email: trimmedEmail,
        displayName: displayName.trim(),
      };
      if (wantsPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await authApi.updateProfile(payload);
      setStoredAuth(res.data);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowChangePassword(false);
      setSuccess("บันทึกข้อมูลเรียบร้อยแล้ว");
    } catch (err) {
      if (err instanceof HttpError) {
        const body = err.body as { message?: string; error?: string } | null;
        if (body?.error === "WRONG_PASSWORD") {
          setError("รหัสผ่านปัจจุบันไม่ถูกต้อง");
        } else if (body?.error === "EMAIL_TAKEN") {
          setError("อีเมลนี้ถูกใช้แล้ว");
        } else if (body?.error === "SAME_PASSWORD") {
          setError("รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน");
        } else {
          setError(body?.message ?? "บันทึกไม่สำเร็จ");
        }
      } else {
        setError("บันทึกไม่สำเร็จ");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="profilePage panel">
      <div className="panelHeader adminHeader">
        <div>
          <div className="panelTitle">ข้อมูลผู้ใช้งาน</div>
        </div>
        <Link to={auth.user.role === "admin" ? "/admin" : "/"} className="button">
          กลับ
        </Link>
      </div>
      <div className="panelBody">
        <form className="stack profileForm" onSubmit={onSubmit}>
          {error ? <div className="authError">{error}</div> : null}
          {success ? <div className="profileSuccess">{success}</div> : null}

          <FormField label="ชื่อที่แสดง">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="ชื่อที่แสดงบนเว็บ"
              required
            />
          </FormField>

          <FormField label="อีเมล">
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormField>

          <div className="profilePasswordSection">
            {!showChangePassword ? (
              <button
                type="button"
                className="button profilePasswordToggle"
                onClick={() => setShowChangePassword(true)}
              >
                ต้องการเปลี่ยนรหัสผ่าน
              </button>
            ) : (
              <div className="stack">
                <div className="profilePasswordSectionHead">
                  <div className="detailLabel">เปลี่ยนรหัสผ่าน</div>
                  <button type="button" className="button buttonSmall" onClick={cancelPasswordChange}>
                    ยกเลิก
                  </button>
                </div>
                <FormField label="รหัสผ่านปัจจุบัน">
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </FormField>
                <div className="grid2">
                  <FormField label="รหัสผ่านใหม่">
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </FormField>
                  <FormField label="ยืนยันรหัสผ่านใหม่">
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </FormField>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="button buttonPrimary" type="submit" disabled={busy}>
              {busy ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
