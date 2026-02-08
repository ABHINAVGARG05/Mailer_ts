import { Router } from "express";
import multer from "multer";
import {
  uploadController,
  getCampaignStatus,
  deleteCampaign,
} from "../controller/upload.controller";
import {
  sendMailController,
  previewMailController,
} from "../controller/mail.controller";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "csv") {
      if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
        cb(null, true);
      } else {
        cb(new Error("Only CSV files are allowed for the csv field"));
      }
    } else if (file.fieldname === "html") {
      if (
        file.mimetype === "text/html" ||
        file.originalname.endsWith(".html") ||
        file.originalname.endsWith(".htm")
      ) {
        cb(null, true);
      } else {
        cb(new Error("Only HTML files are allowed for the html field"));
      }
    } else {
      cb(new Error("Unexpected field"));
    }
  },
});

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Mailer API is running",
    timestamp: new Date().toISOString(),
  });
});

router.post(
  "/upload",
  upload.fields([
    { name: "csv", maxCount: 1 },
    { name: "html", maxCount: 1 },
  ]),
  uploadController
);

router.get("/campaign/:campaignId", getCampaignStatus);

router.delete("/campaign/:campaignId", deleteCampaign);

router.post("/send", sendMailController);

router.post("/preview", previewMailController);

export default router;
