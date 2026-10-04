"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { demoAccounts, useSession } from "@/lib/session";
import { person, rolePath, roleInfo } from "@/lib/demo-data";
import { BrandMark } from "./brand";
import { Icon } from "./ui";

export function Login() {
  const { user, hydrated, login } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    if (hydrated && user) router.replace(rolePath(user.role));
  }, [hydrated, user, router]);
  function submit(event: FormEvent) {
    event.preventDefault();
    const account = login(email, password);
    if (!account) {
      setError("E-posta veya şifre hatalı.");
      return;
    }
  }
  return (
    <main className="login-page">
      <section className="login-photo" aria-label="Şantiye görünümü">
        <div className="login-photo-label">
          <span>NAVBEA İNŞAAT</span>
          <strong>İstanbul</strong>
        </div>
      </section>
      <section className="login-content">
        <div className="login-card">
          <div className="login-brand">
            <BrandMark />
            <div>
              <strong>Navbea</strong>
              <span>WORKFORCE</span>
            </div>
          </div>
          <div className="login-heading">
            <span>FİRMA HESABI</span>
            <h1>Giriş yapın</h1>
            <p>Şantiye hesabınızla devam edin.</p>
          </div>
          <form onSubmit={submit} className="login-form">
            <label className="field">
              E-posta
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="ad@firma.com"
              />
            </label>
            <label className="field">
              Şifre
              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Gizle" : "Göster"}
                </button>
              </div>
            </label>
            {error && (
              <p role="alert" className="login-error">
                {error}
              </p>
            )}
            <button className="btn btn-primary login-submit" type="submit">
              Giriş yap
              <Icon name="right" size={18} />
            </button>
          </form>
          <details className="demo-accounts">
            <summary>Örnek hesaplar</summary>
            <p>
              Bu sürüm örnek hesaplarla çalışır. Şifre: <strong>navbea2026</strong>
            </p>
            <div>
              {demoAccounts.map((a) => (
                <button
                  key={a.userId}
                  type="button"
                  onClick={() => {
                    setEmail(a.email);
                    setPassword("navbea2026");
                    setError("");
                  }}
                >
                  <span>
                    {person(a.userId).name}
                    <small>{roleInfo[person(a.userId).role].label}</small>
                  </span>
                  <Icon name="right" size={16} />
                </button>
              ))}
            </div>
          </details>
          <p className="login-footer">Navbea İnşaat · Saha Yönetimi</p>
        </div>
      </section>
    </main>
  );
}
