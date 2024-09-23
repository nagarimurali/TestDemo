import { AzureFunction, Context, HttpRequest } from "@azure/functions";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const eventData = req.body;

  // Extract information about the file added to SharePoint
  const siteUrl = eventData.siteUrl;
  const resource = eventData.resource;
  const fileUrl = resource.webUrl;

  context.log(`File added to SharePoint: ${fileUrl}`);

  context.res = {
    status: 200,
    body: "Event received successfully",
  };
};

export default httpTrigger;

