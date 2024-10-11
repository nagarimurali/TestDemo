import { Log } from '@microsoft/sp-core-library';
import {
  BaseListViewCommandSet,
  type IListViewCommandSetListViewUpdatedParameters,
  type IListViewCommandSetExecuteEventParameters,
} from '@microsoft/sp-listview-extensibility';
import { MessageBar, MessageBarType } from '@fluentui/react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { spfi } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/site-users/web";
import { override } from '@microsoft/decorators';
import { getSP } from '../../pnpjs-config';
import { ContentTypeSiteIds } from '../../constants';

export interface IDmsDocumentSetCreationCommandSetProperties {
  targetContentTypeId: string;
  draftlistname: string;
}

const LOG_SOURCE: string = 'DmsDocumentSetCreationCommandSet';
const ERROR_MESSAGE_CONTAINER_ID = 'custom-error-message-container';

export default class DmsDocumentSetCreationCommandSet extends BaseListViewCommandSet<IDmsDocumentSetCreationCommandSetProperties> {
  private sp: ReturnType<typeof spfi>;
  private _errorMessage: string = '';
  private _errorMessageElement: any;
  private _contentTypeId: string;

  @override
  public async onInit(): Promise<void> {
    Log.info(LOG_SOURCE, 'Initialized DmsDocumentSetCreationCommandSet');

    // Initialize PnP JS
    this.sp = getSP(this.context);

    const listId = this.context.pageContext.list?.id.toString();
    const currentUser = await this.sp.web.currentUser();
    console.log("currentUser", currentUser);

    let errorMessageContainer = document.getElementById(ERROR_MESSAGE_CONTAINER_ID);
    if (!errorMessageContainer) {
      errorMessageContainer = document.createElement('div');
      errorMessageContainer.id = ERROR_MESSAGE_CONTAINER_ID;
      document.body.appendChild(errorMessageContainer);
    }

    // Fetch content types for the current list
    if (listId) {
      try {
        const contentTypes = await this.sp.web.lists.getById(listId).contentTypes
          .select('StringId')
          .filter(`startswith(StringId,'${ContentTypeSiteIds.TechnicalDocuments}')`)();
        if (!contentTypes || contentTypes.length === 0) {
          console.error("No content types found for the list");
          this._errorMessage = "No content types found for the list";
        } else {
          this._contentTypeId = contentTypes[0].StringId;
        }
      } catch (error) {
        console.error("Error fetching content types: ", error);
        this._errorMessage = "Error fetching content types";
      }
    }

    // Check group membership and command visibility
    await this.updateCommandVisibility();

    return Promise.resolve();
  }

  private async _checkUserInGroups(): Promise<boolean> {
    try {
      const currentUser = await this.sp.web.currentUser();
      
      // Get users in the Document Controller and Project Admin groups
      const documentControllerUsers = await this.sp.web.siteGroups.getByName("Document Controller").users();
      const projectAdminUsers = await this.sp.web.siteGroups.getByName("Project Admin").users();

      const isMemberOfGroup = documentControllerUsers.some(user => user.Id === currentUser.Id) ||
        projectAdminUsers.some(user => user.Id === currentUser.Id);

      return isMemberOfGroup;
    } catch (error) {
      console.error("Error checking group membership: ", error);
      this._showErrorMessage(error.message);
      return false;
    }
  }

  private async updateCommandVisibility(): Promise<void> {
    const { draftlistname } = this.properties;
    const isUserInGroups = await this._checkUserInGroups();
    const hasPermissionConfigItems = await this._hasPermissionConfigItems();

    const command2 = this.tryGetCommand('COMMAND_2');
    
    if (command2) {
      const isDraftLibrary = this.context.pageContext.list?.title === draftlistname;
      // Only show the command if user is in the right group and it's the draft library
      command2.visible = isUserInGroups && hasPermissionConfigItems && isDraftLibrary;
    }
  }

  private async _hasPermissionConfigItems(): Promise<boolean> {
    try {
      const items = await this.sp.web.lists.getByTitle("PermissionsConfigurations").items.filter("Title eq 'Document Controller'")();
      return items.length > 0;
    } catch (error) {
      console.error("Error fetching items from Permissionconfig list: ", error);
      this._showErrorMessage(error.message);
      return false;
    }
  }

  @override
  public onListViewUpdated(event: IListViewCommandSetListViewUpdatedParameters): void {
    this.updateCommandVisibility().then(() => {
      // Command visibility updated
    }).catch((error) => {
      console.error("Error updating command visibility: ", error);
      this._showErrorMessage(error.message);
    });
  }

  @override
  public onExecute(event: IListViewCommandSetExecuteEventParameters): void {
    const listId = this.context.pageContext.list?.id.toString();
    const listabsUrl = this.context.pageContext.list?.serverRelativeUrl.toString();
    const webUrl = this.context.pageContext.web.absoluteUrl;
    const redirecturl = `${webUrl}/_layouts/15/SPListForm.aspx?PageType=8&List=${encodeURIComponent(listId || '').replace(/-/g, '%2D')}&Source=${encodeURIComponent(location.href)}&ContentTypeId=${encodeURIComponent(this._contentTypeId)}&RootFolder=${encodeURIComponent(listabsUrl || '')}`; // working

    switch (event.itemId) {
      case 'COMMAND_2':
        window.location.href = redirecturl;
        break;
      default:
        throw new Error('Unknown command');
    }
  }

  private _showErrorMessage(message: string): void {
    this._errorMessage = message;
    this.render();
  }

  @override
  public render(): void {
    if (this._errorMessage) {
      this._errorMessageElement = React.createElement(MessageBar, {
        messageBarType: MessageBarType.error,
        isMultiline: false,
        onDismiss: () => { this._errorMessage = ''; this.render(); },
        dismissButtonAriaLabel: 'Close'
      }, this._errorMessage);

      const errorMessageContainer = document.getElementById(ERROR_MESSAGE_CONTAINER_ID);
      if (errorMessageContainer) {
        ReactDOM.render(this._errorMessageElement, errorMessageContainer);
      }
    }
  }

  protected onDispose(): void {
    const errorMessageContainer = document.getElementById(ERROR_MESSAGE_CONTAINER_ID);
    if (errorMessageContainer && this._errorMessageElement) {
      ReactDOM.unmountComponentAtNode(this._errorMessageElement);
    }
  }
}
