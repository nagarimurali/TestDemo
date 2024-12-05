private async _saveItem(valuesForUpdate: IListItemFormUpdateValue[]): Promise<boolean> {
  const { context, displayMode, onError, initialItem } = this.props;
  const itemId = initialItem?.ID;

  let addOrUpdateResult: IListItemFormUpdateValue[] | undefined = undefined;
  const folderName = `${this._fieldRefs[FieldNames.ProjectReference].current?.state.value}-${this._fieldRefs[FieldNames.Revision].current?.state.value}`;

  if (displayMode === FormDisplayMode.New) {
    if (!folderName) throw new Error('Folder name is required');
    await this._sp.web.lists.getById(context.list.guid.toString()).rootFolder.folders.addUsingPath(folderName);
    try {
      const folderItem = await this._sp.web.lists.getById(context.list.guid.toString()).rootFolder.folders.getByUrl(folderName).getItem();
      addOrUpdateResult = await folderItem.validateUpdateListItem(
        valuesForUpdate.filter(v => v.FieldName !== 'FileLeafRef').concat(
          { FieldName: 'ContentTypeId', FieldValue: context.contentType.id }
        )
      );
    } catch (error) {
      console.error(error);
      Logger.error(new Error(`${LOG_SOURCE}: Error updating folder item`));
      if (onError) onError(strings.AddError);
      try {
        await this._sp.web.lists.getById(context.list.guid.toString()).rootFolder.folders.getByUrl(folderName)
          .deleteWithParams({ BypassSharedLock: true, DeleteIfEmpty: false });
      } catch (error) {
        console.error(error);
        Logger.error(new Error(`${LOG_SOURCE}: Error deleting folder item`));
        if (onError) onError(strings.CleanError);
      }
    }
    this.setState({ isBusy: false });
  }

  if (displayMode === FormDisplayMode.Edit) {
    if (!itemId) throw new Error('Item ID is required');

    const previousRevision = initialItem[FieldNames.Revision]; // Retrieve the initial Revision value
    const currentRevision = this._fieldRefs[FieldNames.Revision].current?.state.value;

    if (previousRevision !== currentRevision) {
      const previousFolderName = `${this._fieldRefs[FieldNames.ProjectReference].current?.state.value}-${previousRevision}`;
      try {
        // Rename the folder
        const folder = await this._sp.web.lists.getById(context.list.guid.toString()).rootFolder.folders.getByUrl(previousFolderName);
        await folder.moveTo(`${folder.parentServerRelativeUrl}/${folderName}`);
      } catch (error) {
        console.error(error);
        Logger.error(new Error(`${LOG_SOURCE}: Error renaming folder`));
        if (onError) onError(strings.FolderRenameError);
      }
    }

    addOrUpdateResult = await this._sp.web.lists.getById(context.list.guid.toString())
      .items.getById(itemId).validateUpdateListItem(valuesForUpdate);
    this.setState({ isBusy: false });
  }

  if (addOrUpdateResult) {
    const erroredFields = addOrUpdateResult.filter(r => r.HasException).map(r => r.FieldName).join(', ');
    if (erroredFields) {
      Logger.error(new Error(`${LOG_SOURCE}: Error saving item, errored fields: ${erroredFields}`));
      if (onError) onError(`${strings.PartialSaveError}`);
      this.setState({
        fieldSubmitErrors: addOrUpdateResult.filter(r => r.HasException).reduce((acc, r) => {
          if (r.FieldName && r.ErrorMessage) acc[r.FieldName] = r.ErrorMessage;
          return acc;
        }, {} as { [fieldName: string]: string })
      });
    } else {
      return true;
    }
  } else {
    Logger.error(new Error(`${LOG_SOURCE}: Error saving item`));
    if (onError) onError(strings.SaveError);
    this.setState({ isBusy: false });
    return false;
  }
  return false;
}
