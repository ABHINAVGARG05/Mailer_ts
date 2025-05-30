import { parseTemplate } from "../../utils/html.template";

export default function (job: {
  htmlTemplate: string;
  rowData: Record<string, string>;
}) {
  const { htmlTemplate, rowData } = job;

  if (typeof htmlTemplate !== "string" || typeof rowData !== "object") {
    throw new Error("Invalid input to template parser worker.");
  }

  return parseTemplate(htmlTemplate, rowData);
}
