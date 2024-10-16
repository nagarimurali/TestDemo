import { Log } from '@microsoft/sp-core-library';
import {
  BaseApplicationCustomizer
} from '@microsoft/sp-application-base';

import * as strings from 'DmlCustomUiChangesApplicationCustomizerStrings';

import { spfi, SPFx } from "@pnp/sp";
import { IHubSiteInfo } from "@pnp/sp/hubsites";
import "@pnp/sp/hubsites";

const LOG_SOURCE: string = 'DmlCustomUiChangesApplicationCustomizer';

export interface IDmlCustomUiChangesApplicationCustomizerProperties {
}

export default class DmlCustomUiChangesApplicationCustomizer
  extends BaseApplicationCustomizer<IDmlCustomUiChangesApplicationCustomizerProperties> {

    private sp: ReturnType<typeof spfi>;
    private cssUrl: string;
    
    public async onInit(): Promise<void> {
      Log.info(LOG_SOURCE, `Initialized ${strings.Title}`);
      this.sp = spfi().using(SPFx(this.context));

      // Call function on initial page load
      await this.applyCustomizations();

      // Subscribe to page navigation events
      this.context.application.navigatedEvent.add(this, this.onNavigated);
      
      return Promise.resolve();
    }

    private onNavigated = async (): Promise<void> => {
      // Call function when a new page is loaded
      await this.applyCustomizations();
    };

    private async applyCustomizations(): Promise<void> {
      const listabsUrl = this.context.pageContext.list?.serverRelativeUrl.toString();
      const isDraftLibrary = listabsUrl?.split('/').pop();

      if (isDraftLibrary === "Draft" || isDraftLibrary === "Baselines" || isDraftLibrary === "ApplicableDocuments" || isDraftLibrary === "PreviousVersions") {
        const hubSiteId = this.context.pageContext.legacyPageContext.hubSiteId;

        if (hubSiteId) {
          try {
            const hubsite: IHubSiteInfo = await this.sp.hubSites.getById(hubSiteId)();
            const hubSiteUrl = hubsite.SiteUrl;

            if (hubSiteUrl) {
              this.cssUrl = `${hubSiteUrl}/SiteAssets/customHideMenuOptions.css`;

              this.injectCustomCss();
            }
          } catch (error) {
            console.error("Error fetching hub site info: ", error);
          }
        }

        this.toggleButtonVisibility();
      }
    }

    private injectCustomCss(): void {
      // Ensure CSS is not already injected
      if (!document.querySelector(`link[href="${this.cssUrl}"]`)) {
        const head: any = document.getElementsByTagName("head")[0] || document.documentElement;
        const customStyle: HTMLLinkElement = document.createElement("link");
        customStyle.href = this.cssUrl;
        customStyle.rel = "stylesheet";
        customStyle.type = "text/css";
        head.insertAdjacentElement("beforeEnd", customStyle);
      }
    }

    private toggleButtonVisibility(): void {
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
          toggleElementVisibility('button[data-automationid="customactionNavigation"]', "Create DMS DocumentSet", false);
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
}
