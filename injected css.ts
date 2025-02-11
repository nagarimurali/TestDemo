import { Log } from '@microsoft/sp-core-library';
import { BaseApplicationCustomizer } from '@microsoft/sp-application-base';
import * as strings from 'DmlCustomUiChangesApplicationCustomizerStrings';
import { spfi } from "@pnp/sp";
import { IHubSiteInfo } from "@pnp/sp/hubsites";
import "@pnp/sp/hubsites";
import { getSP } from '../../pnpjs-config';

const LOG_SOURCE: string = 'DmlCustomUiChangesApplicationCustomizer';

export interface IDmlCustomUiChangesApplicationCustomizerProperties { }

export default class DmlCustomUiChangesApplicationCustomizer
  extends BaseApplicationCustomizer<IDmlCustomUiChangesApplicationCustomizerProperties> {

  private sp: ReturnType<typeof spfi>;
  private cssUrl: string;

  public async onInit(): Promise<void> {
    Log.info(LOG_SOURCE, `Initialized ${strings.Title}`);
    this.sp = getSP(this.context);
    
    await this.applyCustomizations();
    this.observeNavigationChanges();

    return Promise.resolve();
  }

  private observeNavigationChanges(): void {
    const observer = new MutationObserver(() => {
      this.onNavigated().catch(error => console.error("Error during navigation handling:", error));
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  private async onNavigated(): Promise<void> {
    await this.applyCustomizations();
  }

  private async applyCustomizations(): Promise<void> {
    const listabsUrl = this.context.pageContext.list?.serverRelativeUrl;
    const listTitle = listabsUrl?.split('/').pop();

    if (!listTitle) return;

    if (["Draft", "Baselines", "Applicaple", "PreviousVersions"].includes(listTitle)) {
      await this.setCustomCssFromHub();

      if (listTitle === "Applicaple" && this.isChildFolder()) {
        document.body.classList.add('draft-library');
        this.showNewCommandButton();
      } else {
        document.body.classList.remove('draft-library');
        this.hideNewCommandButton();
      }

      if (listTitle === "Baselines") {
        document.body.classList.add('baselines-library');
        this.showNewCommandButton();
      } else {
        document.body.classList.remove('baselines-library');
        this.hideNewCommandButton();
      }
    } else {
      this.removeCustomCss();
      this.showNewCommandButton();
    }
  }

  private async setCustomCssFromHub(): Promise<void> {
    const hubSiteId = this.context.pageContext.legacyPageContext.hubSiteId;
    if (!hubSiteId) return;

    try {
      const hubsite: IHubSiteInfo = await this.sp.hubSites.getById(hubSiteId)();
      this.cssUrl = `${hubsite.SiteUrl}/SiteAssets/customHideMenuOptions.css`;
      this.injectCustomCss();
    } catch (error) {
      console.error("Error fetching hub site info:", error);
    }
  }

  private injectCustomCss(): void {
    if (!document.querySelector(`link[href="${this.cssUrl}"]`)) {
      const linkElement = document.createElement("link");
      linkElement.href = this.cssUrl;
      linkElement.rel = "stylesheet";
      linkElement.type = "text/css";
      document.head.appendChild(linkElement);
      console.log("Custom CSS injected.");
    }
  }

  private removeCustomCss(): void {
    const customStyle = document.querySelector(`link[href="${this.cssUrl}"]`);
    if (customStyle) {
      customStyle.remove();
      console.log("Custom CSS removed.");
    }
  }

  private isChildFolder(): boolean {
    return document.querySelector('.ms-Breadcrumb-list') !== null;
  }

  private showNewCommandButton(): void {
    const newCommandButton = document.querySelector('button[data-automationid="newCommand"]');
    if (newCommandButton) {
      newCommandButton.style.display = "inline-block";
    }
  }

  private hideNewCommandButton(): void {
    const newCommandButton = document.querySelector('button[data-automationid="newCommand"]');
    if (newCommandButton) {
      newCommandButton.style.display = "none";
    }
  }
}
#######################
deepSeek
##########################
import { Log } from '@microsoft/sp-core-library';
import { BaseApplicationCustomizer } from '@microsoft/sp-application-base';
import * as strings from 'DmlCustomUiChangesApplicationCustomizerStrings';
import { spfi, SPFI, SPFx } from "@pnp/sp";
import { IHubSiteInfo } from "@pnp/sp/hubsites";
import "@pnp/sp/hubsites";
import "@pnp/sp/webs";

const LOG_SOURCE: string = 'DmlCustomUiChangesApplicationCustomizer';

export interface IDmlCustomUiChangesApplicationCustomizerProperties { }

export default class DmlCustomUiChangesApplicationCustomizer
  extends BaseApplicationCustomizer<IDmlCustomUiChangesApplicationCustomizerProperties> {

  private _sp: SPFI;
  private cssUrl: string;

  public async onInit(): Promise<void> {
    Log.info(LOG_SOURCE, `Initialized ${strings.Title}`);

    // Initialize PnP JS with the current context
    this._sp = spfi().using(SPFx(this.context));

    // Inject the custom CSS file
    await this.applyCustomizations();

    // Attach a MutationObserver to detect navigation changes
    this.observeNavigationChanges();

    return Promise.resolve();
  }

  private observeNavigationChanges(): void {
    // Observe changes in the DOM to detect navigation
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Check if the navigation has occurred
          this.onNavigated().catch(error => {
            console.error("Error during navigation handling:", error);
          });
        }
      });
    });

    // Start observing the body for changes
    observer.observe(document.body, { childList: true, subtree: true });
  }

  private async onNavigated(): Promise<void> {
    console.log("Navigation detected. Applying customizations...");
    await this.applyCustomizations();
  }

  private async applyCustomizations(): Promise<void> {
    const listabsUrl = this.context.pageContext.list?.serverRelativeUrl.toString();
    const listTitle = listabsUrl?.split('/').pop();

    if (listTitle === "Draft" || listTitle === "Baselines" ||
      listTitle === "Applicaple" || listTitle === "PreviousVersions") {

      const hubSiteId = this.context.pageContext.legacyPageContext.hubSiteId;

      if (hubSiteId) {
        try {
          // Fetch hub site information using PnP JS
          const hubsite: IHubSiteInfo = await this._sp.hubSites.getById(hubSiteId)();
          const hubSiteUrl = hubsite.SiteUrl;

          if (hubSiteUrl) {
            // Construct the CSS URL dynamically
            this.cssUrl = `${hubSiteUrl}/SiteAssets/customHideMenuOptions.css`;
            this.injectCustomCss();
          }
        } catch (error) {
          console.error("Error fetching hub site info: ", error);
        }
      }

      if (listTitle === "Applicaple" && this.isChildFolder()) {
        document.body.classList.add('draft-library');
        this.showNewCommandButton();
      } else {
        document.body.classList.remove('draft-library');
        this.hideNewCommandButton();
      }

      if (listTitle === "Baselines") {
        document.body.classList.add('baselines-library');
        this.showNewCommandButton();
      } else {
        document.body.classList.remove('baselines-library');
        this.hideNewCommandButton();
      }
    } else {
      this.removeCustomCss();
      this.showNewCommandButton();
    }
  }

  private injectCustomCss(): void {
    // Check if the CSS is already injected
    const existingLink = document.querySelector(`link[href="${this.cssUrl}"]`);
    if (existingLink) {
      console.log("Custom CSS is already injected.");
      return;
    }

    // Create a new <link> element
    const linkElement = document.createElement('link');
    linkElement.href = this.cssUrl;
    linkElement.rel = 'stylesheet';
    linkElement.type = 'text/css';

    // Append the <link> element to the <head>
    document.head.appendChild(linkElement);
    console.log("Custom CSS injected successfully.");
  }

  private isChildFolder(): boolean {
    const isChildItem: HTMLElement | null = document.querySelector('.ms-Breadcrumb-list');
    return isChildItem !== null;
  }

  private removeCustomCss(): void {
    const customStyle: HTMLElement | null = document.querySelector(`link[href="${this.cssUrl}"]`);
    if (customStyle) {
      customStyle.remove();
      console.log("Custom CSS removed.");
    }
  }

  private showNewCommandButton(): void {
    const newCommandButton: HTMLElement | null = document.querySelector('button[data-automationid="newCommand"]');
    if (newCommandButton) {
      newCommandButton.style.display = "inline-block";
    }
  }

  private hideNewCommandButton(): void {
    const newCommandButton: HTMLElement | null = document.querySelector('button[data-automationid="newCommand"]');
    if (newCommandButton) {
      newCommandButton.style.display = "none";
    }
  }
}
