import { Log } from '@microsoft/sp-core-library';
import { BaseApplicationCustomizer } from '@microsoft/sp-application-base';
import * as strings from 'DmlCustomUiChangesApplicationCustomizerStrings';

import { spfi, SPFx } from "@pnp/sp";
import { IHubSiteInfo } from  "@pnp/sp/hubsites";
import "@pnp/sp/hubsites";

const LOG_SOURCE: string = 'DmlCustomUiChangesApplicationCustomizer';

export interface IDmlCustomUiChangesApplicationCustomizerProperties {
  testMessage: string;
}

export default class DmlCustomUiChangesApplicationCustomizer
  extends BaseApplicationCustomizer<IDmlCustomUiChangesApplicationCustomizerProperties> {

  private sp: ReturnType<typeof spfi>;
  private cssUrl: string;

  public async onInit(): Promise<void> {
    Log.info(LOG_SOURCE, `Initialized ${strings.Title}`);

    const message: string = this.properties.testMessage || 'No message provided';
    console.log("Message:", message);

    try {
      const listAbsUrl = this.context.pageContext.list?.serverRelativeUrl;
      if (this.isDraftLibrary(listAbsUrl)) {
        console.log("This is a draft library.");
        await this.loadCustomCSS();
        this.initializeUIObservers();
      }
    } catch (error) {
      Log.error(LOG_SOURCE, error);
    }

    return Promise.resolve();
  }

  /**
   * Check if the current library is the 'Draft' library.
   * @param listAbsUrl The relative URL of the current list
   * @returns boolean
   */
  private isDraftLibrary(listAbsUrl: string | undefined): boolean {
    if (!listAbsUrl) return false;
    const libraryName = listAbsUrl.split('/').pop();
    return libraryName === 'Draft';
  }

  /**
   * Load the custom CSS from the hub site if the current site is part of a hub.
   */
  private async loadCustomCSS(): Promise<void> {
    const hubSiteId = this.context.pageContext.legacyPageContext.hubSiteId;

    if (hubSiteId) {
      try {
        this.sp = spfi().using(SPFx(this.context));
        const hubSiteInfo: IHubSiteInfo = await this.sp.hubSites.getById(hubSiteId)();
        this.cssUrl = `${hubSiteInfo.SiteUrl}/SiteAssets/customHideMenuOptions.css`;

        this.injectCustomCSS(this.cssUrl);
        console.log(`Custom CSS applied from: ${this.cssUrl}`);
      } catch (error) {
        console.error("Failed to load hub site info or apply custom CSS.", error);
      }
    } else {
      console.warn("No Hub Site ID found. Skipping custom CSS.");
    }
  }

  /**
   * Dynamically inject custom CSS into the page.
   * @param url The URL of the CSS file to inject
   */
  private injectCustomCSS(url: string): void {
    const head = document.getElementsByTagName("head")[0] || document.documentElement;
    const customStyle = document.createElement("link");
    customStyle.href = url;
    customStyle.rel = "stylesheet";
    customStyle.type = "text/css";
    head.insertAdjacentElement("beforeEnd", customStyle);
  }

  /**
   * Initialize MutationObserver and other UI-related functionality.
   */
  private initializeUIObservers(): void {
    this.toggleButtonsVisibility();
    this.hideSyncButton();

    const observer = new MutationObserver(() => {
      this.toggleButtonsVisibility();
      this.hideSyncButton();
    });

    const config = { childList: true, subtree: true };
    const targetNode = document.body || document.documentElement;
    observer.observe(targetNode, config);
  }

  /**
   * Check if the current view is inside a child folder.
   * @returns boolean
   */
  private isChildFolder(): boolean {
    const currentUrl = window.location.href;
    return currentUrl.includes('viewid');  // Adjust as per specific URL patterns
  }

  /**
   * Toggle visibility of certain buttons based on the folder level.
   */
  private toggleButtonsVisibility(): void {
    if (this.isChildFolder()) {
      this.setElementVisibility('button[data-automationid="newCommand"]', true);
      this.setElementVisibility('button[aria-label="Upload"]', true);
    } else {
      this.setElementVisibility('button[data-automationid="newCommand"]', false);
      this.setElementVisibility('button[aria-label="Upload"]', false);
    }
  }

  /**
   * Set the visibility of a specific element.
   * @param selector The CSS selector of the element
   * @param isVisible Whether to show or hide the element
   */
  private setElementVisibility(selector: string, isVisible: boolean): void {
    const element: HTMLElement | null = document.querySelector(selector);
    if (element) {
      element.style.display = isVisible ? "inline-block" : "none";
      console.log(`Element ${selector} visibility set to ${isVisible ? 'visible' : 'hidden'}`);
    } else {
      console.warn(`Element ${selector} not found`);
    }
  }

  /**
   * Hide the 'Sync' button on the current page.
   */
  private hideSyncButton(): void {
    const syncButton: HTMLElement | null = document.querySelector('button[data-automationid="syncCommand"]');
    if (syncButton) {
      syncButton.style.display = "none";
      console.log("Sync button hidden");
    } else {
      console.warn("Sync button not found");
    }
  }
}
==========================================================

import { Log } from '@microsoft/sp-core-library';
import {
  BaseApplicationCustomizer
} from '@microsoft/sp-application-base';

import * as strings from 'DmlCustomUiChangesApplicationCustomizerStrings';

import { spfi, SPFx } from "@pnp/sp";
import { IHubSiteInfo } from  "@pnp/sp/hubsites";
import "@pnp/sp/hubsites";

const LOG_SOURCE: string = 'DmlCustomUiChangesApplicationCustomizer';

export interface IDmlCustomUiChangesApplicationCustomizerProperties {
  testMessage: string;
}

export default class DmlCustomUiChangesApplicationCustomizer
  extends BaseApplicationCustomizer<IDmlCustomUiChangesApplicationCustomizerProperties> {

    private sp: ReturnType<typeof spfi>;
    private cssUrl: string;
    
    public async onInit(): Promise<void> {
      Log.info(LOG_SOURCE, `Initialized ${strings.Title}`);

      let message: string = this.properties.testMessage;
      console.log("message", message);
      
      const listabsUrl = this.context.pageContext.list?.serverRelativeUrl.toString();
      const isDraftLibrary = listabsUrl?.split('/').pop();
    
      this.sp = spfi().using(SPFx(this.context));

      if (isDraftLibrary === "Draft") {
        alert("success1");

        const hubSiteId = this.context.pageContext.legacyPageContext.hubSiteId;

        if (hubSiteId) {
          try {
            const hubsite: IHubSiteInfo = await this.sp.hubSites.getById(hubSiteId)();
            const hubSiteUrl = hubsite.SiteUrl;
            console.log("hubSiteUrl", hubSiteUrl);

            if (hubSiteUrl) {
              // Use hubSiteUrl to construct the correct CSS URL
              this.cssUrl = `${hubSiteUrl}/SiteAssets/customHideMenuOptions.css`;

              const head: any = document.getElementsByTagName("head")[0] || document.documentElement;
              const customStyle: HTMLLinkElement = document.createElement("link");
              customStyle.href = this.cssUrl;
              customStyle.rel = "stylesheet";
              customStyle.type = "text/css";
              head.insertAdjacentElement("beforeEnd", customStyle);

              console.log("customStyle", customStyle);
              console.log("head", head);
            }
          } catch (error) {
            console.error("Error fetching hub site info: ", error);
          }
        }

        const currentUrl = window.location.href;
        const isChildFolder = (): boolean => {
          return currentUrl.includes('viewid');
        };

        const toggleElementVisibility = (selector: string, elementName: string, show: boolean) => {
          const element: any = document.querySelector(selector);
          if (element) {
            element.style.display = show ? "inline-block" : "none";
            console.log(`${elementName} ${show ? 'shown' : 'hidden'}`);
          } else {
            console.warn(`${elementName} not found`);
          }
        };

        const toggleButtonsVisibility = () => {
          if (isChildFolder()) {
            toggleElementVisibility('button[data-automationid="newCommand"]', "New Button", true);
            toggleElementVisibility('button[aria-label="Upload"]', "Upload Button", true);
          } else {
            toggleElementVisibility('button[data-automationid="newCommand"]', "New Button", false);
            toggleElementVisibility('button[aria-label="Upload"]', "Upload Button", false);
          }
        };

        toggleButtonsVisibility();

        const hideSyncButton = () => {
          const syncButton: any = document.querySelector('button[data-automationid="syncCommand"]');
          if (syncButton) {
            syncButton.style.display = "none";
          }
        };

        hideSyncButton();
        
        const observer = new MutationObserver(() => {
          hideSyncButton();
          toggleButtonsVisibility();
        });

        const config = { childList: true, subtree: true };
        const targetNode = document.body || document.documentElement;
        observer.observe(targetNode, config);
      }

      return Promise.resolve();
    }
}

