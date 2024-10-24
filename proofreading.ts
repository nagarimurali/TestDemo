private async getExcelFiles(libraryName: string): Promise<any[]> {
  try {
    // Get all the files in the library
    const items = await this.sp.web.lists.getByTitle(libraryName).items.select('FileLeafRef', 'ID').get();

    // Filter files with '.xlsx' extension
    const excelFiles = items.filter(item => item.FileLeafRef.endsWith('.xlsx'));

    if (excelFiles.length === 0) {
      console.log("No Excel files found in the library.");
    } else {
      console.log(`${excelFiles.length} Excel files found:`, excelFiles);
    }

    return excelFiles;
  } catch (error) {
    console.error('Error fetching Excel files:', error);
    return [];
  }
}
