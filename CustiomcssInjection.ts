import { Log } from '@microsoft/sp-core-library';
import { BaseApplicationCustomizer } from '@microsoft/sp-application-base';
import * as strings from 'DmlCustomUiChangesApplicationCustomizerStrings';

import { spfi, SPFx } from "@pnp/sp";
import { IHubSiteInfo } from "@pnp/sp/hubsites";
import "@pnp/sp/hubsites";

const LOG_SOURCE: string = 'DmlCustomUiChangesApplicationCustomizer';

export interface IDmlCustomUiChangesApplicationCustomizerProperties {}

export default class DmlCustomUiChangesApplicationCustomizer
  extends BaseApplicationCustomizer<IDmlCustomUiChangesApplicationCustomizerProperties> {

    private sp: ReturnType<typeof spfi>;
    private cssUrl: string;

    public async onInit(): Promise<void> {
      Log.info(LOG_SOURCE, `Initialized ${strings.Title}`);
      this.sp = spfi().using(SPFx(this.context));

      // Call applyCustomizations on initial load
      await this.applyCustomizations();

      // Subscribe to navigation events
      this.context.application.navigatedEvent.add(this, this.onNavigated);

      return Promise.resolve();
    }

    private onNavigated = async (): Promise<void> => {
      // Apply customizations every time navigation occurs
      await this.applyCustomizations();
    };

    private async applyCustomizations(): Promise<void> {
      const listabsUrl = this.context.pageContext.list?.serverRelativeUrl?.toString();
      const isDraftLibrary = listabsUrl?.split('/').pop();

      if (isDraftLibrary === "Draft" || isDraftLibrary === "Baselines" || 
          isDraftLibrary === "ApplicableDocuments" || isDraftLibrary === "PreviousVersions") {

        const hubSiteId = this.context.pageContext.legacyPageContext.hubSiteId;

        if (hubSiteId) {
          try {
            const hubsite: IHubSiteInfo = await this.sp.hubSites.getById(hubSiteId)();
            const hubSiteUrl = hubsite.SiteUrl;

            if (hubSiteUrl) {
              this.cssUrl = `${hubSiteUrl}/SiteAssets/customHideMenuOptions.css`;

              // Inject the CSS
              this.injectCustomCss();
            }
          } catch (error) {
            console.error("Error fetching hub site info: ", error);
          }
        }

        // Toggle the visibility of certain buttons based on folder type or URL
        this.toggleButtonVisibility();
      } else {
        // Remove the CSS if the current page is not part of the target libraries
        this.removeCustomCss();
      }
    }

    private injectCustomCss(): void {
      // Check if the CSS is already injected
      if (!document.querySelector(`link[href="${this.cssUrl}"]`)) {
        const head: HTMLElement = document.getElementsByTagName("head")[0] || document.documentElement;
        const customStyle: HTMLLinkElement = document.createElement("link");
        customStyle.href = this.cssUrl;
        customStyle.rel = "stylesheet";
        customStyle.type = "text/css";
        // Corrected insert position: "beforeend" (all lowercase)
        head.insertAdjacentElement("beforeend", customStyle);
        console.log("Custom CSS injected.");
      }
    }

    private removeCustomCss(): void {
      // Check if the CSS is already injected, then remove it
      const customStyle: HTMLElement | null = document.querySelector(`link[href="${this.cssUrl}"]`);
      if (customStyle) {
        customStyle.remove();
        console.log("Custom CSS removed.");
      }
    }

    private toggleButtonVisibility(): void {
      const currentUrl = window.location.href;
      const isChildFolder = (): boolean => currentUrl.includes('viewid');

      const toggleElementVisibility = (selector: string, show: boolean) => {
        const element: HTMLElement | null = document.querySelector(selector);
        if (element) {
          element.style.display = show ? "inline-block" : "none";
        }
      };

      if (isChildFolder()) {
        toggleElementVisibility('button[data-automationid="newCommand"]', true);  // Show New button
        toggleElementVisibility('button[aria-label="Upload"]', true);           // Show Upload button
      } else {
        toggleElementVisibility('button[data-automationid="newCommand"]', false); // Hide New button
        toggleElementVisibility('button[aria-label="Upload"]', false);           // Hide Upload button
      }
    }
}
