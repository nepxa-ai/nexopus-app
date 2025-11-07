// src/lib/api-recuperacion.ts
export type RecuperacionRes = {
  ok: boolean;
  message?: string;
};

/**
 * Construye la URL base tomando la variable de entorno NEXOPUS
 * Ejemplo: NEXOPUS=https://10.34.7.10:5678/n8n
 */
function buildBaseUrl(): string {
  const base = process.env.NEXOPUS || process.env.NEXT_PUBLIC_NEXOPUS || "https://10.34.7.10:5678/n8n";
  return base.replace(/\/+$/, ""); // quitar / final
}

/**
 * Dispara el webhook de recuperación de contraseña en n8n.
 * Envía: [ { "correoCliente": "<email>" } ]
 */
export async function recuperarContrasena(
  correoCliente: string
): Promise<RecuperacionRes> {
  if (!correoCliente) throw new Error("Debes indicar un correo electrónico.");

  const url = `${buildBaseUrl()}/webhook/recuperar-contrasena`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ correoCliente }]),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Error ${res.status}: ${text || res.statusText || "Solicitud fallida"}`
      );
    }

    return {
      ok: true,
      message: "Por favor revisar el correo registrado.",
    };
  } catch (err: any) {
    throw new Error(
      err?.message || "No se pudo iniciar la recuperación de contraseña."
    );
  }
}
