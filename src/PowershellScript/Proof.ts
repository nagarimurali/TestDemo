import { sp } from "@pnp/sp";

sp.setup({
  sp: {
    baseUrl: "https://yourtenant.sharepoint.com/sites/yoursite",
  },
});

async function getFileSize(itemId: number): Promise<void> {
  try {
    // Fetch the item's server-relative URL
    const item = await sp.web.lists
      .getByTitle("Your List Title")
      .items.getById(itemId)
      .select("FileRef")
      .get();

    const fileRef = item.FileRef;

    // Fetch file details including size
    const file = await sp.web.getFileByServerRelativeUrl(fileRef).select("Length").get();
    const fileSize = file.Length;

    console.log(`File Size: ${fileSize} bytes`);
  } catch (error) {
    console.error("Error fetching file size:", error);
  }
}

// Event handler example
function handleItemClick(itemId: number): void {
  getFileSize(itemId);
}
