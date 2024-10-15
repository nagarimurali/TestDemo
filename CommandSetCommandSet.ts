import { Log } from '@microsoft/sp-core-library';
import {
  BaseListViewCommandSet,
  Command,
  IListViewCommandSetExecuteEventParameters,
  ListViewStateChangedEventArgs,
  RowAccessor
} from '@microsoft/sp-listview-extensibility';
import { IRequestService } from '../../service/IRequestService';
import { RequestService } from '../../service/RequestService';
import { SPFI, spfi, SPFx } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { assign } from '@fluentui/react';
import { IItem } from "@pnp/sp/items/types";
import WorkflowsPanel, { IWorkflowsPanelProps } from '../dmsContexualMenuCommandSet/components/WorkflowsPanel/WorkflowsPanel';

export interface IDmsContexualMenuCommandSetCommandSetProperties {
  requestListId: string;
  taskListId: string;
  workflowUrl: string;
}

const LOG_SOURCE: string = 'ThreeSixtyDegreeDocViewCommandSet';

export default class ThreeSixtyDegreeDocViewCommandSet extends BaseListViewCommandSet<IDmsContexualMenuCommandSetCommandSetProperties> {
  private _sp: SPFI;
  private _requestService: IRequestService;
  private panelPlaceHolder: HTMLDivElement | null = null;
  private itemData: any;

  public async onInit(): Promise<void> {
    Log.info(LOG_SOURCE, 'Initialized DmsContexualMenuCommandSetCommandSet');
    this._sp = spfi().using(SPFx(this.context));

    // Initialize request service
    this.context.serviceScope.whenFinished(() => {
      this._requestService = this.context.serviceScope.consume(RequestService.serviceKey);
    });

    // Create the placeholder for panel if not exists
    this.panelPlaceHolder = document.body.appendChild(document.createElement("div"));

    this.context.listView.listViewStateChangedEvent.add(this, this._onListViewStateChanged);
    
    this._updateCommandVisibility();
    return Promise.resolve();
  }

  private _updateCommandVisibility() {
    const openWFPanel: Command = this.tryGetCommand('COMMAND_1');
    openWFPanel.visible = this.context.listView.selectedRows.length === 1 && this._isDocumentSet(this.context.listView.selectedRows[0]);
    this.raiseOnChange();
  }

  private _isDocumentSet(selectedItem: RowAccessor): boolean {
    return selectedItem.getValueByName('ContentTypeId').startsWith('0x0120D520');
  }

  private async _getDetails(projectReference: string): Promise<{ draftItems: IItem[], applicableItems: IItem[], previousVersionsItems: IItem[] }> {
    const [draftItems, applicableItems, previousVersionsItems] = await Promise.all([
      this._getItems('Draft', projectReference),
      this._getItems('Applicable Documents', projectReference),
      this._getItems('Previous Versions', projectReference)
    ]);

    return { draftItems, applicableItems, previousVersionsItems };
  }

  private async _getItems(listTitle: string, projectReference: string): Promise<IItem[]> {
    try {
      return await this._sp.web.lists.getByTitle(listTitle).items
        .select('Title', 'Modified', 'Author/Title', 'ProjectReference', 'ProjectRevision', 'FileRef')
        .expand('Author')
        .filter(`ProjectReference eq '${projectReference}'`)
        ();
    } catch (error) {
      Log.error(LOG_SOURCE, `Error fetching items from ${listTitle}: ${error.message}`, error);
      return [];
    }
  }

  private _showPanel(itemId: number): void {
    if (!this.panelPlaceHolder) return;

    const workflowUrl = this.properties.workflowUrl || 'https://prod-150.westeurope.logic.azure.com/...';
    
    this._renderPanel({
      showPanel: true,
      documentId: itemId,
      requestService: this._requestService,
      cultureName: this.context.pageContext.cultureInfo.currentUICultureName.toLowerCase(),
      currentUserLogin: this.context.pageContext.user.loginName,
      workflowUrl,
      itemData: this.itemData // Ensure we pass the right data
    });
  }

  private _renderPanel(props: IWorkflowsPanelProps): void {
    if (!props.showPanel) {
      ReactDom.unmountComponentAtNode(this.panelPlaceHolder!);
      return;
    }

    const element = React.createElement(WorkflowsPanel, assign({
      showPanel: false,
      setShowPanel: null,
      documentId: null,
      requestService: this._requestService,
      cultureName: this.context.pageContext.cultureInfo.currentUICultureName.toLowerCase(),
      currentUserLogin: this.context.pageContext.user.loginName,
      isthreeSixtyDegree: true,
      itemData: this.itemData
    }, props));

    ReactDom.render(element, this.panelPlaceHolder!);
  }

  public async onExecute(event: IListViewCommandSetExecuteEventParameters): Promise<void> {
    switch (event.itemId) {
      case 'COMMAND_1':
        const selectedItem = event.selectedRows[0];
        const listItemId = selectedItem.getValueByName('ID') as number;

        this._requestService.configure(this.context.listView.list?.guid?.toString() || '', this._sp, this.context);
        
        await this._showRevisionDetails();
        this._showPanel(listItemId);
        break;

      default:
        Log.error(LOG_SOURCE, `Unknown command: ${event.itemId}`);
        break;
    }
  }

  private async _showRevisionDetails(): Promise<void> {
    const selectedRows = this.context.listView.selectedRows;
    if (selectedRows.length === 0) return;

    const projectReference = selectedRows[0].getValueByName('ProjectReference');
    if (!projectReference) {
      Log.error(LOG_SOURCE, 'No Project Reference found for the selected item.');
      return;
    }

    try {
      const details = await this._getDetails(projectReference);
      this.itemData = [...details.draftItems, ...details.applicableItems, ...details.previousVersionsItems]
        .map(item => ({
          title: item.Title,
          modified: new Date(item.Modified).toLocaleDateString('en-GB'),
          createdBy: item.Author ? item.Author.Title : 'Unknown',
          projectRevision: item.ProjectRevision,
          link: item.FileRef
        }));

      this._renderTable(this.itemData);
    } catch (error) {
      Log.error(LOG_SOURCE, `Error showing revision details: ${error.message}`, error);
    }
  }

  private _renderTable(items: { title: string, modified: string, createdBy: string, projectRevision: string, link: string }[]): void {
    if (this.container) {
      ReactDom.unmountComponentAtNode(this.container);
      document.body.removeChild(this.container);
      this.container = null;
    }

    this.container = document.createElement('div');
    document.body.appendChild(this.container);

    this._renderPanel({
      showPanel: true,
      documentId: null,
      itemData: this.itemData
    });
  }

  private _onListViewStateChanged = (): void => {
    Log.info(LOG_SOURCE, 'List view state changed');
    this._updateCommandVisibility();
  };
}
