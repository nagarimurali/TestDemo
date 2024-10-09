import { override } from '@microsoft/decorators';
import { Log } from '@microsoft/sp-core-library';
import { BaseApplicationCustomizer } from '@microsoft/sp-application-base';

const LOG_SOURCE: string = 'HideMenuOptionsApplicationCustomizer';

export interface IHideMenuOptionsApplicationCustomizerProperties {
  // Define any properties if needed.
}

export default class HideMenuOptionsApplicationCustomizer extends BaseApplicationCustomizer<IHideMenuOptionsApplicationCustomizerProperties> {

  @override
  public onInit(): Promise<void> {
    Log.info(LOG_SOURCE, `Initialized HideMenuOptionsApplicationCustomizer`);

    // Get Hub Site ID from the context
    const hubSiteId = this.context.pageContext.legacyPageContext.hubSiteId;

    let cssUrl: string;

    if (hubSiteId) {
      // If the site is part of a Hub, load CSS from the Hub Site's "Site Assets"
      const hubSiteUrl = this.context.pageContext.legacyPageContext.hubSiteUrl;
      cssUrl = `${hubSiteUrl}/SiteAssets/customHideMenuOptionsHub.css`;
      Log.info(LOG_SOURCE, `Site is part of a Hub. Loading CSS from Hub: ${cssUrl}`);
    } else {
      // If the site is not part of a Hub, load CSS from the current site's "Site Assets"
      cssUrl = `${this.context.pageContext.site.absoluteUrl}/SiteAssets/customHideMenuOptions.css`;
      Log.info(LOG_SOURCE, `Site is not part of a Hub. Loading local CSS: ${cssUrl}`);
    }

    // Inject the CSS dynamically into the page
    this.injectCustomCSS(cssUrl);

    // Hide specific elements on the page
    this.hideElements();

    return Promise.resolve();
  }

  private injectCustomCSS(cssUrl: string): void {
    const head: any = document.getElementsByTagName("head")[0] || document.documentElement;
    const customStyle: HTMLLinkElement = document.createElement("link");
    customStyle.href = cssUrl;
    customStyle.rel = "stylesheet";
    customStyle.type = "text/css";

    head.insertAdjacentElement("beforeEnd", customStyle);
  }

  private hideElements(): void {
    const sideEditBtn: any = document.querySelector('button[data-automationid="navEditLink"]') || document.documentElement;

    if (sideEditBtn) {
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

    const config = { childList: true, subtree: true };
    const targetNode = document.body || document.documentElement;
    observer.observe(targetNode, config);
  }
}
