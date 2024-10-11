import { override } from '@microsoft/decorators';
import { Log } from '@microsoft/sp-core-library';
import { BaseListViewCommandSet, Command } from '@microsoft/sp-listview-extensibility';
import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/site-users/web";

const LOG_SOURCE: string = 'ListViewCommandSetExtension';

export interface IListViewCommandSetProperties {
  // Define your custom properties here
}

export default class ListViewCommandSetExtension extends BaseListViewCommandSet<IListViewCommandSetProperties> {

  @override
  public async onInit(): Promise<void> {
    Log.info(LOG_SOURCE, 'Initialized ListViewCommandSetExtension');

    // Initialize PnP JS
    sp.setup({
      spfxContext: this.context
    });

    // Check group membership
    const currentUser = await sp.web.currentUser.get();
    const userGroups = await sp.web.siteGroups.getByName("Document Controller").users.get();
    const projectAdminGroups = await sp.web.siteGroups.getByName("Project Admin").users.get();
    
    let isMemberOfGroup = userGroups.some(user => user.Id === currentUser.Id) ||
                          projectAdminGroups.some(user => user.Id === currentUser.Id);

    // Hide the button if the user is not in the groups
    if (!isMemberOfGroup) {
      this.context.commandManager.hideCommands(['COMMAND_ID']);
    }
  }

  @override
  public onExecute(event: any): void {
    const command: Command = event.commandId;
    switch (command) {
      case 'COMMAND_ID':
        // Your button click logic here
        break;
      default:
        throw new Error('Unknown command');
    }
  }
}
