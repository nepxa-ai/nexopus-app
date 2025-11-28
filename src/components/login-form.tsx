"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { apiLogin, fetchAuthMe } from "@/lib/api-auth";;
import { recuperarContrasena } from "@/lib/api-recuperacion";

import Image from "next/image";

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const [email, setEmail] = React.useState<string>("");
  const [password, setPass] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [recoverLoading, setRecoverLoading] = React.useState(false);
  const [recoverMsg, setRecoverMsg] = React.useState<string | null>(null);

  const router = useRouter();

async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setRecoverMsg(null);
    setLoading(true);
    try {
      await apiLogin(email, password);
      await fetchAuthMe();
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Error de autenticación";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function onForgot() {
    setError(null);
    setRecoverMsg(null);

    if (!email) {
      setError("Ingresa tu email y luego haz clic en '¿Olvidó su contraseña?'");
      return;
    }

    setRecoverLoading(true);
    try {
      const res = await recuperarContrasena(email.trim());
      setRecoverMsg(res.message || "Si el correo existe, se enviaron instrucciones.");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "No se pudo iniciar la recuperación.";
      setError(msg);
    } finally {
      setRecoverLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2 min-h-[500px]">
          {/* Columna izquierda */}
          <form onSubmit={onSubmit} className="p-6 md:p-8 flex flex-col gap-6">
            <div className="flex flex-col items-center text-center">
              <Image
                src="/images/logo-completo-nexopus-pulpo-color.png"
                alt="Logo Nexopus"
                width={320}
                height={240}
                className="object-contain"
                priority
              />
              <h1 className="text-2xl font-bold">Platform</h1>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value ?? "")}
                autoComplete="username"
              />
            </div>

            <div className="grid gap-3">
              <div className="flex items-center gap-3 w-full">
                <Label htmlFor="password" className="mr-auto">Contraseña</Label>

                <Button
                  type="button"
                  variant="link"
                  className="ml-auto p-0 h-auto text-sm underline-offset-2"
                  onClick={onForgot}
                  disabled={recoverLoading || loading}
                >
                  {recoverLoading ? "Enviando..." : "¿Olvidó su contraseña?"}
                </Button>
              </div>

              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPass(e.target.value ?? "")}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            {recoverMsg && !error && (
              <p className="text-sm text-green-700" role="status">
                {recoverMsg}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Ingresando..." : "Login"}
            </Button>
          </form>

          {/* Columna derecha con logo centrado */}
          <div className="hidden md:flex items-center justify-center bg-muted p-8">
            <Image
              src="/images/logo-open-group-small.png"
              alt="Logo Open Group"
              width={320}
              height={320}
              priority
              className="object-contain h-auto w-auto max-h-[360px] max-w-[80%]"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-2 py-3 border-t text-sm text-muted-foreground">
        <span>Desarrollado por</span>
        <a
          href="https://nepxa.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 font-medium hover:underline text-primary"
        >
        <Image
           src="/images/logotipo-nepxa-horizontal-letra-oscura.png"
           alt="Logo Nepxa"
           width={120}
           height={120}
           className="object-contain opacity-90 hover:opacity-100 transition"
         />
        </a>
      </div>
    </div>
  );
}
