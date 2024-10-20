import { Log } from '@microsoft/sp-core-library';
import { BaseApplicationCustomizer } from '@microsoft/sp-application-base';
import { Dialog } from '@microsoft/sp-dialog';
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

    // Apply customizations on initial load
    await this.applyCustomizations();

    // Listen for navigation events in modern SharePoint
    this.context.application.navigatedEvent.add(this, this.onNavigated);
    
    // Add click listener for the "Draft" navigation link
    this.addDraftClickListener();

    return Promise.resolve();
  }

  private async onNavigated(): Promise<void> {
    console.log('Navigation detected, applying customizations...');
    await this.applyCustomizations();
  }

  private addDraftClickListener(): void {
    const draftLink: HTMLElement | null = document.querySelector('a[href*="Draft"]');
    if (draftLink) {
      draftLink.addEventListener('click', async () => {
        console.log('Draft link clicked, applying customizations...');
        await this.applyCustomizations();
      });
    }
  }

  private async applyCustomizations(): Promise<void> {
    const listabsUrl = this.context.pageContext.list?.serverRelativeUrl.toString();
    const listTitle = listabsUrl?.split('/').pop();

    if (listTitle === "Draft" || listTitle === "Baselines" ||
        listTitle === "Applicable Documents" || listTitle === "Previous Versions") {

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

      if (listTitle === "Draft" && this.isChildFolder()) {
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
    }
  }

  private injectCustomCss(): void {
    if (!document.querySelector(`link[href="${this.cssUrl}"]`)) {
      const head: HTMLElement = document.getElementsByTagName("head")[0] || document.documentElement;
      const customStyle: HTMLLinkElement = document.createElement("link");
      customStyle.href = this.cssUrl;
      customStyle.rel = "stylesheet";
      customStyle.type = "text/css";
      head.insertAdjacentElement("beforeend", customStyle);
      console.log("Custom CSS injected.");
    }
  }

  private isChildFolder(): boolean {
    const currentUrl = window.location.href;
    const viewid = currentUrl.includes('viewid');
    return viewid; // Adjust based on your condition to detect child folders
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
      newCommandButton.style.display = "inline-block"; // Override to make the button visible
      console.log("New command button made visible for Draft/Baselines.");
    }
  }

  private hideNewCommandButton(): void {
    const newCommandButton: HTMLElement | null = document.querySelector('button[data-automationid="newCommand"]');
    if (newCommandButton) {
      newCommandButton.style.display = "none"; // Hide the button if not in Draft/Baselines
      console.log("New command button hidden for non-Baselines libraries.");
    }
  }
}
