import { Dialog, DialogFooter, DialogType, DefaultButton } from 'office-ui-fabric-react/lib/Dialog';

class YourComponent extends React.Component {
  state = {
    isSaving: false,
    currentPresaveOperation: undefined, // For controlling dialog state
    // other state variables...
  };

  private handleSave = async () => {
    try {
      await this.validateFields();
    } catch (e) {
      console.log(e);
      return;
    }

    this.setState({
      isSaving: true,
      currentPresaveOperation: { status: 'running', label: 'Saving', index: 0, count: 1 } // Example operation state
    });

    const createObject = {
      BaselineComments: this.state.baselineComment,
      BaselineStatus: this.state.baselineStatus,
      BaselineVersion: this.state.baselineVersion,
      Code: this.state.code,
      CRID: this.state.cRID,
      Title: this.state.label
    };

    try {
      await BaselineService.updateListItem(this.props.context.list.title, createObject, this.props.itemID);
      this.setState({
        currentPresaveOperation: { status: 'success', label: 'Update successful', index: 1, count: 1 }
      });
    } catch (err) {
      console.log(err);
      this.setState({
        currentPresaveOperation: { status: 'error', label: 'Update failed', index: 1, count: 1 }
      });
    } finally {
      this.setState({ isSaving: false });
    }
  };

  render() {
    const { currentPresaveOperation } = this.state;

    return (
      <>
        {/* Your component JSX */}
        <Dialog
          hidden={!currentPresaveOperation}
          dialogContentProps={{
            type: DialogType.normal,
            title: 'Pre-save Operation',
            subText: currentPresaveOperation?.status === 'running'
              ? `${currentPresaveOperation?.label} (${currentPresaveOperation?.index}/${currentPresaveOperation?.count})`
              : currentPresaveOperation?.status === 'success'
                ? `${currentPresaveOperation?.label} ✅`
                : `${currentPresaveOperation?.label} ❌`,
          }}
        >
          <DialogFooter>
            {((currentPresaveOperation?.status === 'success' && currentPresaveOperation?.index === currentPresaveOperation?.count) ||
              currentPresaveOperation?.status === 'error') && (
                <DefaultButton text="Close" onClick={() => this.setState({ currentPresaveOperation: undefined })} />
            )}
          </DialogFooter>
        </Dialog>
      </>
    );
  }
}
=================================================
  await BaselineService.updateListItem(this.props.context.list.title, createObject, this.props.itemID).then(async (res) => {
  
  const newLItemId = this.props.itemID.toString();
  await BaselineService.batchDelete(CONSTANTS.ListNames.BaselineRefernceList, this.state.baselineIDs);
  await BaselineService.batchDelete(CONSTANTS.ListNames.TechnicalReferenceList, this.state.technicalIds);

  const logs = await Promise.all(this.state.linkedSearchItems.map(async (data) => {
    if (data.ContentType === CONSTANTS.ContentTypeNames.Baseline) {
      const baslineObject = {
        [CONSTANTS.BaselineRefernceListFieldNames.BaselineParentID]: newLItemId,
        [CONSTANTS.BaselineRefernceListFieldNames.SiteURL]: data.SiteUrl,
        [CONSTANTS.BaselineRefernceListFieldNames.BaselineChildID]: data.ChildBaselineId,
        Title: data.Title
      };
      await BaselineService.createListItem(CONSTANTS.ListNames.BaselineRefernceList, baslineObject);
    }
    if (data.ContentType === CONSTANTS.ContentTypeNames.Technical) {
      const technicalObject = {
        [CONSTANTS.TechnicalRefernceListFieldNames.BaselineParentID]: newLItemId,
        [CONSTANTS.TechnicalRefernceListFieldNames.SiteURL]: data.SiteUrl,
        [CONSTANTS.TechnicalRefernceListFieldNames.DocumentID]: data.DocumentId,
        Title: data.Title
      };
      await BaselineService.createListItem(CONSTANTS.ListNames.TechnicalReferenceList, technicalObject);
    }
  }));

  console.log(logs);
  this.setState({
    title: "",
    baselineStatus: "",
    baselineVersion: "",
    cRID: '',
    code: '',
    label: '',
    baselineComment: '',
    errorMessage: "",
    errorControls: []
  });

  // Show success message
  toast.success('Updated new Baseline information', {
    position: "top-center",
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
    theme: "colored",
  });

  // Redirect to the default SharePoint edit form
  const editFormUrl = `${this.props.context.pageContext.web.absoluteUrl}/Lists/${this.props.context.list.title}/EditForm.aspx?ID=${newLItemId}`;
  window.location.href = editFormUrl;

}).catch((err) => {
  console.log(err);
  this.setState({ isSaving: false });

  toast.error('Failed to update the Baseline!', {
    position: "top-center",
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
    theme: "colored",
  });
});

