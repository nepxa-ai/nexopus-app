"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { apiLogin, fetchMe } from "@/lib/api";

import Image from "next/image";


export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const [email, setEmail] = React.useState<string>("");
  const [password, setPass] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {

      const { access_token } = await apiLogin({ username: email, password });
      localStorage.setItem("access_token", access_token);
      await fetchMe(access_token);
      router.push("/dashboard");
    } 
    catch (err: any) {
      setError(err?.message || "Error de autenticación");
    } 
    finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2 min-h-[500px]">
          {/* Columna izquierda */}
          <form onSubmit={onSubmit} className="p-6 md:p-8 flex flex-col gap-6">
            <div className="flex flex-col items-center text-center">
              {/* Logo pequeño encima del título */}
              <Image
                src="/images/logo-completo-nexopus-pulpo-color.png"   // imagen en public/images/
                alt="Logo Nexopus"
                width={320}   // tamaño pequeño
                height={240}
                className="object-contain"
                priority
              />
              <h1 className="text-2xl font-bold">Platform</h1>
              {/*}
              <p className="text-balance text-muted-foreground">
                Ingresa tu email para acceder
              </p> */}
            </div>

            <div className="grid gap-3">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="text"
                placeholder="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value ?? "")}
                autoComplete="username"
              />
            </div>

            <div className="grid gap-3">
              <div className="flex items-center">
                <Label htmlFor="password">Contraseña</Label>
                <a
                  href="#"
                  className="ml-auto text-sm underline-offset-2 hover:underline"
                >
                  ¿Olvidó su contraseña?
                </a>
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Ingresando..." : "Login"}
            </Button>
          </form>

          {/* Columna derecha con logo centrado (sin fill) */}
          <div className="hidden md:flex items-center justify-center bg-muted p-8">
            <Image
              src="/images/logo-open-group-small.png" // imagen en public/images/
              alt="Logo Open Group"
              width={320}              // ajuste del 
              height={320}
              priority
              className="object-contain h-auto w-auto max-h-[360px] max-w-[80%]"
            />
          </div>
        </CardContent>
      </Card>


    </div>
  );
}
