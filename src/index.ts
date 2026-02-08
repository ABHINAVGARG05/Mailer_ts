import "dotenv/config";
import express from "express";
import logger from "./utils/logger";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

import "./services/Workers/mail.worker";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
});

app.use("/api", routes);

app.get("/", (req, res) => {
  res.json({
    name: "Mailer API",
    version: "1.0.0",
    description: "Bulk email sending service with template support",
    endpoints: {
      health: "GET /api/health",
      upload: "POST /api/upload (multipart: csv, html)",
      send: "POST /api/send (json: campaignId, from, subject)",
      preview: "POST /api/preview (json: campaignId)",
      status: "GET /api/campaign/:campaignId",
      delete: "DELETE /api/campaign/:campaignId",
    },
  });
});

app.use(notFoundHandler);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Mailer server running on http://localhost:${PORT}`);
  logger.info("Mail worker is ready to process jobs");
});

export default app;
