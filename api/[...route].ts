let cachedApp: ((req: any, res: any) => unknown) | null = null;

export default async function handler(req: any, res: any) {
  try {
    if (!cachedApp) {
      const mod = await import("../server/_core/app");
      cachedApp = mod.createApp();
    }

    return cachedApp(req, res);
  } catch (error) {
    console.error("[api/[...route]] bootstrap failed", error);
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "API bootstrap failed" }));
  }
}
