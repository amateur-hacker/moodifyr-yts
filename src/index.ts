import { serve } from "@hono/node-server";
import "dotenv/config";

import { app } from "@/app";

const port = Number(process.env.PORT);

console.log(`Server is running on port http://localhost:${port}`);

serve({ port, fetch: app.fetch });
