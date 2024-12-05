if (displayMode === FormDisplayMode.Edit) {
  if (!itemId) throw new Error('Item ID is required');

  const previousRevision = initialItem[FieldNames.Revision]; // Retrieve the initial Revision value
  const currentRevision = this._fieldRefs[FieldNames.Revision].current?.state.value;

  if (previousRevision !== currentRevision) {
    const previousFolderName = `${this._fieldRefs[FieldNames.ProjectReference].current?.state.value}-${previousRevision}`;
    const newFolderName = `${this._fieldRefs[FieldNames.ProjectReference].current?.state.value}-${currentRevision}`;

    try {
      // Get the folder item using the item ID
      const folderItem = await this._sp.web.lists.getById(context.list.guid.toString()).items.getById(itemId).get();
      
      // Check if the current folder name matches the previousFolderName
      if (folderItem.FileLeafRef === previousFolderName) {
        // Update the folder name
        await this._sp.web.lists.getById(context.list.guid.toString())
          .items.getById(itemId)
          .update({
            FileLeafRef: newFolderName, // Update the folder name
            Title: newFolderName       // Optionally update the title
          });
      }
    } catch (error) {
      console.error(error);
      Logger.error(new Error(`${LOG_SOURCE}: Error updating folder name`));
      if (onError) onError(strings.FolderRenameError);
    }
  }

  // Update the list item with the new values
  addOrUpdateResult = await this._sp.web.lists.getById(context.list.guid.toString())
    .items.getById(itemId).validateUpdateListItem(valuesForUpdate);
  this.setState({ isBusy: false });
}
