import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client();

const EXPECTED_AUDIENCE = process.env.WORKER_URL ?? "";
const EXPECTED_EMAIL = process.env.TASKS_CALLER_EMAIL ?? "";

/**
 * Verifikasi token OIDC yang dilampirkan Cloud Tasks pada request /worker.
 * Hanya task yang dibuat dengan service account yang benar yang lolos.
 *
 * Escape hatch lokal: set ALLOW_INSECURE_WORKER=true untuk mematikan cek ini
 * saat development (jangan pernah set di produksi).
 */
export async function isAuthorizedWorkerCall(
  authHeader: string | undefined
): Promise<boolean> {
  if (process.env.ALLOW_INSECURE_WORKER === "true") return true;
  if (!EXPECTED_AUDIENCE || !EXPECTED_EMAIL) return false; // fail closed
  if (!authHeader?.startsWith("Bearer ")) return false;

  try {
    const ticket = await client.verifyIdToken({
      idToken: authHeader.slice(7),
      audience: EXPECTED_AUDIENCE,
    });
    const email = ticket.getPayload()?.email;
    return email === EXPECTED_EMAIL;
  } catch {
    return false;
  }
}
