// Vercel serverless function entrypoint.
// Vercel invokes this per-request with Node's (req, res) objects.
// We build the Nest app once (cached across warm invocations) and delegate
// each request to the underlying Express instance.
import { createApp } from '../dist/bootstrap.js';

type NodeHandler = (req: unknown, res: unknown) => void;

let cachedHandler: NodeHandler | null = null;

export default async function handler(req: unknown, res: unknown): Promise<void> {
  if (!cachedHandler) {
    const app = await createApp();
    cachedHandler = app.getHttpAdapter().getInstance() as NodeHandler;
  }
  return cachedHandler(req, res);
}
