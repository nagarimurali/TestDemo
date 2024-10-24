private async getExcelFileCount(documentSetName: string, listName: string): Promise<number> {
  try {
    // Construct the REST query to get all files inside the document set
    const restQuery = `/_api/web/lists/getbytitle('${listName}')/items?$filter=FileDirRef eq '${this.context.pageContext.web.serverRelativeUrl}/${listName}/${documentSetName}'&$select=FileLeafRef`;
    const spurl = this.context.pageContext.web.absoluteUrl;
    const fullRestUrl = spurl + restQuery;

    const response: HttpClientResponse = await this.context.httpClient.get(
      fullRestUrl,
      HttpClient.configurations.v1
    );

    // Check if the request was successful
    if (response.ok) {
      const contentType = response.headers.get("Content-Type") || '';
      if (contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        const items = data.value;

        // Filter for Excel files based on the extension (.xls, .xlsx)
        const excelFiles = items.filter((item: any) => {
          const fileName = item.FileLeafRef || '';
          return fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
        });

        return excelFiles.length;

      } else if (contentType.indexOf("application/xml") !== -1 || contentType.indexOf("text/xml") !== -1 || contentType.indexOf("application/atom+xml") !== -1) {
        const textData = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(textData, "application/xml");

        const entries = xmlDoc.getElementsByTagName("entry");
        const excelEntries = Array.from(entries).filter(entry => {
          const fileLeafRef = entry.querySelector("FileLeafRef");
          const fileName = fileLeafRef ? fileLeafRef.textContent || '' : '';
          return fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
        });

        return excelEntries.length;
      } else {
        console.error("Unsupported content type: ", contentType);
        return 0;
      }
    } else {
      console.error('Error fetching data:', response.status, response.statusText);
      return 0;
    }
  } catch (error) {
    console.error('Network error:', error);
    return 0;
  }
}
===============================
private async updateCommandVisibility(event: IListViewCommandSetListViewUpdatedParameters): Promise<boolean> {
  const selectedRows = event.selectedRows;

  if (selectedRows.length !== 1) {
    return false;
  }

  const listabsUrl = this.context.pageContext.list?.serverRelativeUrl.toString();
  const libraryName = this.context.pageContext.list?.title ?? '';
  const isDraftLibrary = listabsUrl?.split('/').pop();
  const contentTypeName = selectedRows[0].getValueByName('ContentType');
  this.selectedItemId = selectedRows[0].getValueByName('ID');
  this.createdBy = selectedRows[0].getValueByName('Author');
  this.createdByobj = this.createdBy;
  const docIdUrl = selectedRows[0].getValueByName('_dlc_DocIdUrl');
  this.docIDextracted = this._extractDocId(docIdUrl);
  this.docTitle = selectedRows[0].getValueByName('Title');
  this.docName = selectedRows[0].getValueByName('FileLeafRef');

  if (this.selectedItemId === null) {
    console.error('Selected item ID is null');
    return false;
  }

  this.itemLink = this._constructItemLink(
    this.context.pageContext.web.absoluteUrl,
    libraryName,
    this.docName
  );
  const itemDetails = await this.fetchItemDetails(this.selectedItemId);
  if (!itemDetails) {
    return false;
  }

  const { Author, DocumentStatus } = itemDetails;
  const createdByTitlenew = Author.Title;
  const DocumentStatusnew = DocumentStatus;

  this.projReference = selectedRows[0].getValueByName('ProjectReference');
  const groupIdentifiers = await this.sp.publishingSitePageService.getCurrentUserMemberships();
  const isMemberOfGroup = groupIdentifiers.indexOf('e01d22c9-7823-404c-911b-78fead85b2c1') !== -1;
  const isDocumentSet = contentTypeName === 'Technical Document';

  // Fetch the count of Excel files
  const excelFileCount = await this.getExcelFileCount(this.docName, libraryName);

  return DocumentStatusnew === 'Draft' &&
         contentTypeName === 'Technical Document' &&
         createdByTitlenew === this.userName &&
         isDraftLibrary === 'Draft' &&
         isMemberOfGroup &&
         isDocumentSet && excelFileCount > 0;
}
