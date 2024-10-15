/* eslint-disable no-case-declarations */
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
import WorkflowsPanel, { IWorkflowsPanelProps } from './components/WorkflowsPanel/WorkflowsPanel';
import { assign } from '@fluentui/react';

export interface IDmsContexualMenuCommandSetCommandSetProperties {
  requestListId: string;
  taskListId: string;
  workflowUrl: string;
}

const LOG_SOURCE: string = 'DmsContexualMenuCommandSetCommandSet';

export default class DmsContexualMenuCommandSetCommandSet extends BaseListViewCommandSet<IDmsContexualMenuCommandSetCommandSetProperties> {
  private _sp: SPFI;
  private _requestService: IRequestService;
  private panelPlaceHolder: HTMLDivElement | null = null;

  public onInit(): Promise<void> {
    Log.info(LOG_SOURCE, 'Initialized DmsContexualMenuCommandSetCommandSet');

    const openWFPanel: Command = this.tryGetCommand('OPEN_WFPANEL');
    openWFPanel.visible = true;

    this.context.listView.listViewStateChangedEvent.add(this, this._onListViewStateChanged);
    this._sp = spfi().using(SPFx(this.context));
    this.context.serviceScope.whenFinished(() => {
      this._requestService = this.context.serviceScope.consume(RequestService.serviceKey);
    });

    this.panelPlaceHolder = document.body.appendChild(document.createElement('div'));
    return Promise.resolve();
  }

  private _dismissPanel() {
    this._renderPanelComponent({ showPanel: false });
  }

  private async _showPanel(itemId: number) {
    if (!this.context.pageContext || !this.context.listView) {
      return;
    }

    const workflowUrl = this.properties.workflowUrl || 'https://default-workflow-url';

    const selectedItem = this.context.listView.selectedRows[0];
    const projectReference = selectedItem.getValueByName('ProjectReference');

    let combinedItems: { title: string, modified: string, createdBy: string, projectRevision: string, link: string }[] = [];

    if (projectReference) {
      const details = await this.getDetails(projectReference);
      combinedItems = [
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
    }

    this._renderPanelComponent({
      showPanel: true,
      setShowPanel: this._dismissPanel.bind(this),
      documentId: itemId,
      requestService: this._requestService,
      cultureName: this.context.pageContext.cultureInfo.currentUICultureName.toLowerCase(),
      currentUserLogin: this.context.pageContext.user.loginName,
      workflowUrl: workflowUrl,
      items: combinedItems // Pass items to panel
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
      currentUserLogin: this.context.pageContext.user.loginName
    }, props));

    ReactDom.render(element, this.panelPlaceHolder!);
  }

  public async onExecute(event: IListViewCommandSetExecuteEventParameters): Promise<void> {
    switch (event.itemId) {
      case 'OPEN_WFPANEL':
        const listGuid = this.context.listView.list?.guid?.toString() || '';
        this._requestService.configure(
          listGuid,
          this._sp,
          this.context
        );
        const selectedItem = event.selectedRows[0];
        const listItemId = selectedItem.getValueByName('ID') as number;
        await this._showPanel(listItemId);
        break;
      default:
        throw new Error('Unknown command');
    }
  }

  private isDocumentSet(selectedItem: RowAccessor) {
    return selectedItem.getValueByName('ContentTypeId').startsWith('0x0120D520');
  }

  private _onListViewStateChanged = (args: ListViewStateChangedEventArgs): void => {
    const openWFPanel: Command = this.tryGetCommand('OPEN_WFPANEL');
    if (openWFPanel) {
      openWFPanel.visible = this.context.listView.selectedRows?.length === 1 && this.isDocumentSet(this.context.listView.selectedRows[0]);
    }
    this.raiseOnChange();
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
}
