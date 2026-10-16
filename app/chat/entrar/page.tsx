"use client";
import { useEffect, useState } from "react";
import { BrandWordmark } from "@/components/BrandLogo";
import { createClient } from "@/lib/supabase";
import { chatReturnPath } from "@/lib/chat/model";
import { authEmailError } from "@/lib/auth-login";
import Link from "next/link";

export default function ChatLogin() {
  const [mode, setMode] = useState<"login" | "signup" | "recovery">("login");
  const [next, setNext] = useState("/chat/workspace");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  useEffect(() => {
    setNext(
      chatReturnPath(new URLSearchParams(location.search).get("next")) ??
        "/chat/workspace",
    );
  }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    setSent(false);
    const email = String(form.get("email")).trim();
    const password = String(form.get("password") ?? "");
    try {
      if (mode === "signup") {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, next, locale: "pt-BR" }),
        });
        const result = await response.json();
        if (!response.ok)
          throw new Error(
            result.code === "weak_password"
              ? "Use uma senha de pelo menos oito caracteres."
              : authEmailError(result),
          );
        setSent(true);
      } else if (mode === "recovery") {
        const result = await createClient().auth.resetPasswordForEmail(email, {
          redirectTo: `${location.origin}/auth/confirm?next=${encodeURIComponent(`/set-password?next=${encodeURIComponent(next)}`)}`,
        });
        if (result.error) throw new Error(authEmailError(result.error));
        setSent(true);
      } else {
        const result = await createClient().auth.signInWithPassword({
          email,
          password,
        });
        if (result.error)
          throw new Error(
            result.error.code === "email_not_confirmed"
              ? "Confirme seu email antes de entrar."
              : result.error.code === "invalid_credentials"
                ? "Email ou senha incorretos."
                : authEmailError(result.error),
          );
        location.assign(next);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não conseguimos conectar. Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <header className="chat-app-header">
        <Link href="/chat">
          <BrandWordmark suffix="chat" />
        </Link>
        <Link href="/chat" className="brand-text-link chat-inline-link">
          Conhecer a ferramenta ↗
        </Link>
      </header>
      <main className="chat-auth">
        <p className="chat-eyebrow">SEU ESPAÇO DE TRABALHO</p>
        <h1 className="chat-top-gap">sua equipe começa aqui.</h1>
        <p>
          Use sua conta do ecossistema legalops ou crie uma conta para
          configurar seu espaço.
        </p>
        <section className="brand-card chat-panel">
          <div className="chat-auth-tabs">
            {(["login", "signup"] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={mode === item}
                onClick={() => {
                  setMode(item);
                  setError("");
                  setSent(false);
                }}
              >
                {item === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>
          {sent ? (
            <div role="status">
              <h2>Confira seu email.</h2>
              <p>
                Abra o link enviado para{" "}
                {mode === "recovery"
                  ? "redefinir a senha"
                  : "confirmar sua conta e montar a equipe"}
                .
              </p>
              <button
                type="button"
                className="brand-text-link chat-inline-link chat-top-gap"
                onClick={() => {
                  setMode("login");
                  setSent(false);
                }}
              >
                Voltar para entrar
              </button>
            </div>
          ) : (
            <form className="chat-form" onSubmit={submit}>
              <label>
                Email
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  maxLength={254}
                />
              </label>
              {mode !== "recovery" && (
                <label>
                  Senha
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={mode === "signup" ? 8 : 1}
                    maxLength={128}
                    autoComplete={
                      mode === "signup" ? "new-password" : "current-password"
                    }
                  />
                  {mode === "signup" && (
                    <small>Pelo menos oito caracteres.</small>
                  )}
                </label>
              )}
              {error && (
                <p role="alert" className="chat-notice error">
                  {error}
                </p>
              )}
              <button className="brand-action chat-button" disabled={busy}>
                {busy
                  ? "Aguarde…"
                  : mode === "signup"
                    ? "Criar minha conta"
                    : mode === "recovery"
                      ? "Enviar link de recuperação"
                      : "Entrar no meu espaço"}
              </button>
              {mode === "login" && (
                <button
                  type="button"
                  className="brand-text-link chat-inline-link"
                  onClick={() => {
                    setMode("recovery");
                    setError("");
                  }}
                >
                  Esqueci minha senha
                </button>
              )}
            </form>
          )}
        </section>
      </main>
    </>
  );
}
