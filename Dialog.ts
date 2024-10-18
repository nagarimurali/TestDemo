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
