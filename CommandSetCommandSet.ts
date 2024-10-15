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
  private container: HTMLDivElement | null = null;
  private _requestService: IRequestService;
  private panelPlaceHolder: HTMLDivElement | null = null;
  private itemData: any;

  public onInit(): Promise<void> {
    console.log('Initialized DmsContexualMenuCommandSetCommandSet');
    Log.info(LOG_SOURCE, 'Initialized DmsContexualMenuCommandSetCommandSet');

    const openWFPanel: Command = this.tryGetCommand('COMMAND_1');
    openWFPanel.visible = true;

    this.context.listView.listViewStateChangedEvent.add(this, this._onListViewStateChanged);
    this._sp = spfi().using(SPFx(this.context));
    this.context.serviceScope.whenFinished(() => {
      this._requestService = this.context.serviceScope.consume(RequestService.serviceKey);
    });

    // Create the container for our React component
    this.panelPlaceHolder = document.body.appendChild(document.createElement("div"));

    return Promise.resolve();
  }

  private _dismissPanel() {
    this._renderPanelComponent({ showPanel: false });
  }

  private async getDetails(projectReference: string): Promise<{ draftItems: IItem[], applicableItems: IItem[], previousVersionsItems: IItem[] }> {
    const draftItems = await this.getItems('Draft', projectReference);
    const applicableItems = await this.getItems('Applicable Documents', projectReference);
    const previousVersionsItems = await this.getItems('Previous Versions', projectReference);
    return { draftItems, applicableItems, previousVersionsItems };
  }

  private async getItems(listTitle: string, projectReference: string): Promise<IItem[]> {
    try {
      const items: IItem[] = await this._sp.web.lists.getByTitle(listTitle).items
        .select('Title', 'Modified', 'Author/Title', 'ProjectReference', 'ProjectRevision', 'FileRef')
        .expand('Author')
        .filter(`ProjectReference eq '${projectReference}'`)();
      return items;
    } catch (error) {
      console.error(`Error fetching items from ${listTitle}:`, error);
      return [];
    }
  }

  private async showRevisionDetails(): Promise<void> {
    const selectedRows = this.context.listView.selectedRows;
    if (!selectedRows || selectedRows.length === 0) {
      return;
    }

    const selectedItem = selectedRows[0];
    const projectReference = selectedItem.getValueByName('ProjectReference');

    if (projectReference) {
      try {
        const details = await this.getDetails(projectReference);

        this.itemData = [
          ...details.draftItems,
          ...details.applicableItems,
          ...details.previousVersionsItems
        ].map(item => ({
          title: (item as any).Title,
          modified: new Date((item as any).Modified).toLocaleDateString('en-GB'),
          createdBy: (item as any).Author ? (item as any).Author.Title : 'Unknown',
          projectRevision: (item as any).ProjectRevision,
          link: (item as any).FileRef
        }));

        if (this.itemData && this.itemData.length > 0) {
          const listItemId = selectedItem.getValueByName('ID') as number;
          this._showPanel(listItemId);
        } else {
          console.error('No document data available');
        }
      } catch (error) {
        console.error('Error fetching document details:', error);
      }
    } else {
      console.error('No Project Reference found for the selected item.');
    }
  }

  private _showPanel(itemId: number) {
    if (!this.context.pageContext || !this.context.listView || !this.itemData) {
      console.error('Context or itemData is not available');
      return;
    }

    const workflowUrl = this.properties.workflowUrl || 'https://prod-150.westeurope.logic.azure.com:443/workflows/e2e86240560746d0a5d8191a09ed10ef/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=t-PsdqesaVR5HFrJKke4oqYiJo-G6a1vMOGZIvD9ceE';

    this._renderPanelComponent({
      showPanel: true,
      setShowPanel: this._dismissPanel.bind(this),
      documentId: itemId,
      requestService: this._requestService,
      cultureName: this.context.pageContext.cultureInfo.currentUICultureName.toLowerCase(),
      currentUserLogin: this.context.pageContext.user.loginName,
      workflowUrl: workflowUrl,
      itemData: this.itemData
    });
  }

  private _renderPanelComponent(props: any) {
    if (!props.showPanel) {
      ReactDom.unmountComponentAtNode(this.panelPlaceHolder!);
      return;
    }
    const element: React.ReactElement<IWorkflowsPanelProps> = React.createElement(WorkflowsPanel, assign({
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
        const listGuid = this.context.listView.list?.guid?.toString() || '';
        this._requestService.configure(
          listGuid,
          this._sp,
          this.context
        );
        this.showRevisionDetails();
        break;
      default:
        throw new Error('Unknown command');
    }
  }

  private isDocumentSet(selectedItem: RowAccessor) {
    return selectedItem.getValueByName('ContentTypeId').startsWith('0x0120D520');
  }

  private _onListViewStateChanged = (args: ListViewStateChangedEventArgs): void => {
    Log.info(LOG_SOURCE, 'List view state changed');

    const openWFPanel: Command = this.tryGetCommand('COMMAND_1');
    if (openWFPanel) {
      if (this.context.listView.selectedRows?.length === 1 && this.isDocumentSet(this.context.listView.selectedRows[0])) {
        openWFPanel.visible = true;
      } else {
        openWFPanel.visible = false;
      }
    }

    this.raiseOnChange();
  }
}
