/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { override } from '@microsoft/decorators';
import { Log } from '@microsoft/sp-core-library';
import { BaseApplicationCustomizer } from '@microsoft/sp-application-base';
// import * as strings from 'HideMenuOptionsApplicationCustomizerStrings';
// import './../hideMenuOptions'
const LOG_SOURCE: string = 'HideMenuOptionsApplicationCustomizer';

export interface IHideMenuOptionsApplicationCustomizerProperties {
  // Define any properties if needed.
}

export default class HideMenuOptionsApplicationCustomizer extends BaseApplicationCustomizer<IHideMenuOptionsApplicationCustomizerProperties> {

  @override
  public onInit(): Promise<void> {
    Log.info(LOG_SOURCE, `Initialized HideMenuOptionsApplicationCustomizer`);
    alert("123");
    
    const cssUrl: string = `${this.context.pageContext.site.absoluteUrl}/SiteAssets/customHideMenuOptions.css`;
   console.log("cssUrl",cssUrl)
   
    const head: any = document.getElementsByTagName("head")[0] || document.documentElement;
    const customStyle: HTMLLinkElement = document.createElement("link");
    customStyle.href = cssUrl;
    customStyle.rel = "stylesheet";
    customStyle.type = "text/css";
   
    head.insertAdjacentElement("beforeEnd", customStyle);
   
    // const newbutton: any = document.getElementsByName("Sync")[0] || document.documentElement;  
    // newbutton.style.display = "none";

    const sideEditBtn: any = document.querySelector('button[data-automationid="navEditLink"]') || document.documentElement;

    if (sideEditBtn) {
        // Hide the "Edit" button
        sideEditBtn.style.display = "none";
    } else {
        console.warn("Edit button not found");
    }
    const returnClassicLink: any = document.querySelector('a.LeftNav-notificationLink[aria-label="Click or enter to return to classic SharePoint"]') || document.documentElement;

    if (returnClassicLink) {
        returnClassicLink.style.display = "none";
    } else {
        console.warn("Return to classic SharePoint link not found");
    }
    const hideSyncButton = () => {
        const syncButton: any = document.querySelector('button[data-automationid="syncCommand"]');
        if (syncButton) {
            syncButton.style.display = "none";
        } else {
            console.warn("Sync button not found");
        }
    };

    // Call the function to hide the "Sync" button initially
    hideSyncButton();

    // Use MutationObserver to watch for changes in the DOM and re-hide the "Sync" button
    const observer = new MutationObserver(() => {
        hideSyncButton();
    });

    // Start observing the body or the container that contains the toolbar buttons
    const config = { childList: true, subtree: true };
    const targetNode = document.body || document.documentElement;
    observer.observe(targetNode, config);

    return Promise.resolve();
  }
}


========================================

  #sp-appBar {
    background: rgb(0, 4, 255)
}

.ms-OverflowSet-overflowButton {
    display: none !important;
}

a[aria-label="Click or enter to return to classic SharePoint"] {
    display: none !important;
}


button[data-automationid="shareSplit"],
button[data-automationid="alertMeCommand"],
button[data-automationid="automateCommand"],
button[name="Manage access"],
button[name="Share"],
button[name="Automate"] {
    display: none !important;
}
