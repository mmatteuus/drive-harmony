import express from "express";
import cors from "cors";
import { migrate } from "./migrate";
import { env } from "./env";
import { customersRouter } from "./routes/customers";
import { documentsRouter } from "./routes/documents";

migrate();

const app = express();
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: false,
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/customers", customersRouter);
app.use("/api/documents", documentsRouter);

app.listen(env.port, () => {
  console.log(`[server] listening on http://localhost:${env.port}`);
});
