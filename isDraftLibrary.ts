import { Log } from '@microsoft/sp-core-library';
import { BaseApplicationCustomizer } from '@microsoft/sp-application-base';
import * as strings from 'DmlCustomUiChangesApplicationCustomizerStrings';

import { spfi, SPFx } from "@pnp/sp";
import { IHubSiteInfo } from "@pnp/sp/hubsites";
import "@pnp/sp/hubsites";

const LOG_SOURCE: string = 'DmlCustomUiChangesApplicationCustomizer';

export interface IDmlCustomUiChangesApplicationCustomizerProperties { }

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

            // Inject the CSS every time we navigate
            this.injectCustomCss();
          }
        } catch (error) {
          console.error("Error fetching hub site info: ", error);
        }
      }

      // Check conditions for the "New" and "Upload" buttons
      if (isDraftLibrary === "Draft" && this.isChildFolder()) {
        this.showNewUploadButtons();
      } else {
        this.hideNewUploadButtons();
      }
    } else {
      // Remove the CSS if the current page is not part of the target libraries
      this.removeCustomCss();
    }
  }

  private injectCustomCss(): void {
    // Ensure CSS is not already injected
    if (!document.querySelector(`link[href="${this.cssUrl}"]`)) {
      const head: HTMLElement = document.getElementsByTagName("head")[0] || document.documentElement;
      const customStyle: HTMLLinkElement = document.createElement("link");
      customStyle.href = this.cssUrl;
      customStyle.rel = "stylesheet";
      customStyle.type = "text/css";
      head.appendChild(customStyle);
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

  private showNewUploadButtons(): void {
    const newCommandButton: HTMLElement | null = document.querySelector('button[data-automationid="newCommand"]');
    const uploadCommandButton: HTMLElement | null = document.querySelector('button[aria-label="Upload"]');

    if (newCommandButton) {
      newCommandButton.style.display = "inline-block"; // Show the New button
      console.log("New command button made visible for Draft.");
    }
    if (uploadCommandButton) {
      uploadCommandButton.style.display = "inline-block"; // Show the Upload button
      console.log("Upload command button made visible for Draft.");
    }
  }

  private hideNewUploadButtons(): void {
    const newCommandButton: HTMLElement | null = document.querySelector('button[data-automationid="newCommand"]');
    const uploadCommandButton: HTMLElement | null = document.querySelector('button[aria-label="Upload"]');

    if (newCommandButton) {
      newCommandButton.style.display = "none"; // Hide the New button
      console.log("New command button hidden for non-child folders.");
    }
    if (uploadCommandButton) {
      uploadCommandButton.style.display = "none"; // Hide the Upload button
      console.log("Upload command button hidden for non-child folders.");
    }
  }

  private isChildFolder(): boolean {
    const currentUrl = window.location.href;
    const viewIdPattern = /viewid=[a-zA-Z0-9\-]+/; // Adjust the pattern if necessary
    const viewPathPattern = /viewpath=[^&]+/; // Adjust the pattern if necessary
    const folderNamePattern = /id=%2Fsites%2FDOC4A%2DINT%2FDraft%2F(.+?)%2DA/; // Adjust folder name if needed

    return viewIdPattern.test(currentUrl) &&
      viewPathPattern.test(currentUrl && folderNamePattern.test(currentUrl));
  }
}
