// src/components/Profile/Profile.tsx
import React, { useEffect, useRef, useState } from "react";
import "./Profile.css";
import UserSingleton from "../../Model/UserSingleton";

export interface User {
  id?: string;
  username: string;
  email: string;
  fullName: string;
  photoUrl?: string;
  password: string;
}

interface ProfileProps {
  user: User;
  onClose: () => void;
  onSave: (updated: User & { photoFile?: File | null; password?: string }) => Promise<void> | void;
  onChangePassword: (payload: { currentPassword: string; newPassword: string }) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
  title?: string;
}

const Profile: React.FC<ProfileProps> = ({
  user,
  onClose,
  onSave,
  onChangePassword,
  onDelete,
  title = "Perfil",
}) => {
  const singleton = UserSingleton.getInstance();

  const [isVisible, setIsVisible] = useState(false);

  // profile fields
  const [username, setUsername] = useState(user.username || singleton.getUsername());
  const [email] = useState(user.email || singleton.getEmail());
  const [fullName, setFullName] = useState(user.fullName || singleton.getFullName());
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(user.photoUrl || singleton.getPhotoProfile());
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  // ask-password-before-save modal
  const [askPassword, setAskPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // change password modal
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwErrors, setPwErrors] = useState<{ [k: string]: string }>({});

  // delete confirm
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setIsVisible(true);
    // sync on open
    setUsername(user.username || singleton.getUsername());
    setFullName(user.fullName || singleton.getFullName());
    setPhotoUrl(user.photoUrl || singleton.getPhotoProfile());
    setPhotoFile(null);

    // reset password modal states
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setPwErrors({});
    // reset save-password modal
    setAskPassword(false);
    setPasswordInput("");
    setPasswordError("");
  }, [user]);

  const closeWithAnim = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const validateProfile = () => {
    const e: { [k: string]: string } = {};
    if (!username || username.trim().length < 3) e.username = "El nombre de usuario debe tener al menos 3 caracteres.";
    if (!fullName || fullName.trim().length < 3) e.fullName = "Introduce el nombre completo.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFile = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(String(reader.result));
    reader.readAsDataURL(file);
    setPhotoFile(file);
  };

  const onPickPhoto = () => fileInputRef.current?.click();

  // This is called when user clicks the visible "Guardar" button.
  // Instead of saving immediately we open the ask-password modal.
  const handleSaveClick = () => {
    if (!validateProfile()) return;
    setPasswordInput("");
    setPasswordError("");
    setAskPassword(true);
  };

  // Called when user confirms password in the small modal
  const confirmSaveWithPassword = async () => {
    if (!passwordInput || passwordInput.trim().length === 0) {
      setPasswordError("Debes introducir tu contraseña.");
      return;
    }

    setPasswordError("");
    setSaving(true);
    setAskPassword(false); // hide prompt while saving

    const updatedUser: User & { photoFile?: File | null; password?: string } = {
      ...user,
      username: username.trim(),
      email, // read-only
      fullName: fullName.trim(),
      photoUrl,
      photoFile,
      password: passwordInput,
    };

    try {
      await onSave(updatedUser);
      // update local singleton
      try {
        singleton.setUsername(updatedUser.username);
        singleton.setFullName(updatedUser.fullName);
        singleton.setEmail(updatedUser.email);
        if (updatedUser.id) singleton.setId(updatedUser.id);
        // photoProfile may be updated by backend; we try to bust cache
        singleton.photoProfile = singleton.getPhotoProfile() + "?v=" + Date.now();
      } catch (e) {
        // ignore if singleton shape differs
      }
      setSaving(false);
      closeWithAnim();
    } catch (err: any) {
      console.error("Save error:", err);
      setSaving(false);
      // If backend returned an error message include it
      const msg = (err && err.message) ? err.message : "Error al guardar. Inténtalo de nuevo.";
      setErrors({ form: msg });
      // reopen askPassword so the user can try again (optional UX)
      // setAskPassword(true);
    }
  };

  /* Password modal handlers (change password flow) */
  const openPwModal = () => {
    setPwOpen(true);
    setPwErrors({});
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  };
  const closePwModal = () => {
    setPwOpen(false);
    setPwErrors({});
  };

  const validatePw = () => {
    const e: { [k: string]: string } = {};
    if (!currentPassword) e.currentPassword = "Introduce tu contraseña actual.";
    if (!newPassword || newPassword.length < 6) e.newPassword = "Nueva contraseña (mínimo 6 caracteres).";
    if (newPassword !== confirmNewPassword) e.confirmNewPassword = "Las contraseñas no coinciden.";
    setPwErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePw()) return;
    setPwSaving(true);
    try {
      await onChangePassword({ currentPassword, newPassword });
      setPwSaving(false);
      closePwModal();
    } catch (err: any) {
      setPwSaving(false);
      const msg = err?.message ?? "Error cambiando la contraseña.";
      setPwErrors({ form: msg });
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro que quieres eliminar tu cuenta? Esta acción no se puede deshacer.")) return;
    setDeleting(true);
    try {
      await onDelete();
      setDeleting(false);
      // onDelete handler should logout/redirect
    } catch (err) {
      setDeleting(false);
      alert("No se pudo eliminar la cuenta. Revisa la consola.");
      console.error("Delete account error", err);
    }
  };

  return (
    <div className={`custom-popup ${isVisible ? "visible" : ""}`} role="dialog" aria-modal="true" aria-label="Editar perfil">
      <div className="custom-popup-content profile-popup">
        <header className="profile-header">
          <h3>{title}</h3>
          <button className="closeIcon" onClick={closeWithAnim} aria-label="Cerrar">✕</button>
        </header>

        <div className="profile-body">
          <div className="profile-photo-column">
            <div className="photo-preview">
              {photoUrl ? (
                <img src={photoUrl} alt={`${username} foto perfil`} />
              ) : (
                <div className="photo-placeholder" aria-hidden>
                  {fullName ? fullName.charAt(0).toUpperCase() : "U"}
                </div>
              )}
            </div>

            <div className="photo-actions">
              <button type="button" className="btn small" onClick={onPickPhoto}>Cambiar foto</button>
              <button type="button" className="btn small ghost" onClick={() => { setPhotoFile(null); setPhotoUrl(undefined); }}>
                Quitar
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                if (f) handleFile(f);
              }}
            />
          </div>

          <div className="profile-form-column">
            <label className="field">
              <span className="label">Nombre de usuario</span>
              <input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={30} aria-invalid={!!errors.username} />
              {errors.username && <small className="field-error">{errors.username}</small>}
            </label>

            <label className="field">
              <span className="label">Email (no editable)</span>
              <input value={email} readOnly />
            </label>

            <label className="field">
              <span className="label">Nombre completo</span>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={80} aria-invalid={!!errors.fullName} />
              {errors.fullName && <small className="field-error">{errors.fullName}</small>}
            </label>

            {errors.form && <div className="form-error">{errors.form}</div>}
          </div>
        </div>

        <footer className="profile-footer" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn ghost" onClick={openPwModal} disabled={saving}>Cambiar contraseña</button>
            <button className="btn ghost" onClick={handleDelete} disabled={deleting}>{deleting ? "Eliminando..." : "Eliminar cuenta"}</button>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn ghost" onClick={closeWithAnim} disabled={saving}>Cancelar</button>
            <button className="btn primary" onClick={handleSaveClick} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
          </div>
        </footer>
      </div>

      {/* Ask-password-before-save modal */}
      {askPassword && (
        <div className={`custom-popup visible`} style={{ zIndex: 1200 }}>
          <div className="custom-popup-content profile-popup" style={{ maxWidth: 420 }}>
            <header className="profile-header">
              <h3>Confirmar cambios</h3>
              <button className="closeIcon" onClick={() => setAskPassword(false)} aria-label="Cerrar">✕</button>
            </header>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              <p>Introduce tu contraseña para aplicar los cambios.</p>
              <input
                type="password"
                placeholder="Contraseña"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #222", background: "#0f0f0f", color: "#fff" }}
              />
              {passwordError && <small className="field-error">{passwordError}</small>}
            </div>

            <footer className="profile-footer" style={{ marginTop: 10 }}>
              <button className="btn ghost" onClick={() => setAskPassword(false)} disabled={saving}>Cancelar</button>
              <button className="btn primary" onClick={confirmSaveWithPassword} disabled={saving}>{saving ? "Guardando..." : "Confirmar"}</button>
            </footer>
          </div>
        </div>
      )}

      {/* Password modal (change password flow) */}
      {pwOpen && (
        <div className={`custom-popup visible`} style={{ zIndex: 1200 }}>
          <div className="custom-popup-content profile-popup" style={{ maxWidth: 420 }}>
            <header className="profile-header">
              <h3>Cambiar contraseña</h3>
              <button className="closeIcon" onClick={closePwModal} aria-label="Cerrar">✕</button>
            </header>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              <label className="field">
                <span className="label">Contraseña actual</span>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                {pwErrors.currentPassword && <small className="field-error">{pwErrors.currentPassword}</small>}
              </label>

              <label className="field">
                <span className="label">Nueva contraseña</span>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                {pwErrors.newPassword && <small className="field-error">{pwErrors.newPassword}</small>}
              </label>

              <label className="field">
                <span className="label">Confirmar nueva</span>
                <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} />
                {pwErrors.confirmNewPassword && <small className="field-error">{pwErrors.confirmNewPassword}</small>}
              </label>

              {pwErrors.form && <div className="form-error">{pwErrors.form}</div>}
            </div>

            <footer className="profile-footer" style={{ marginTop: 10 }}>
              <button className="btn ghost" onClick={closePwModal} disabled={pwSaving}>Cancelar</button>
              <button className="btn primary" onClick={handleChangePassword} disabled={pwSaving}>{pwSaving ? "Cambiando..." : "Cambiar contraseña"}</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
