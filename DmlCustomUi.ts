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

              // Inject the CSS every time we navigate
              this.injectCustomCss();
            }
          } catch (error) {
            console.error("Error fetching hub site info: ", error);
          }
        }

        // Add or remove the baselines-library class based on the current library
        if (isDraftLibrary === "Baselines") {
          document.body.classList.add('baselines-library');
          this.showNewCommandButton();
        } else {
          document.body.classList.remove('baselines-library');
          this.hideNewCommandButton();
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

    private showNewCommandButton(): void {
      const newCommandButton: HTMLElement | null = document.querySelector('button[data-automationid="newCommand"]');
      if (newCommandButton) {
        newCommandButton.style.display = "inline-block"; // Override to make the button visible
        console.log("New command button made visible for Baselines.");
      }
    }

    private hideNewCommandButton(): void {
      const newCommandButton: HTMLElement | null = document.querySelector('button[data-automationid="newCommand"]');
      if (newCommandButton) {
        newCommandButton.style.display = "none"; // Hide the button if not in Baselines
        console.log("New command button hidden for non-Baselines libraries.");
      }
    }
}
================================================
/* General styles to hide certain buttons */
#sp-appBar {
    background-color: rgba(0, 255, 85, 0.61) !important;
}

/* Hide multiple buttons by default */
button[data-automationid="shareSplit"],
button[data-automationid="automateCommand"],
button[data-automationid="addShortcutFromTeamSiteCommand"],
button[data-automationid="manageAccessCommand"],
button[data-automationid="pinDocLibToQuickAccessCommand"],
button[data-automationid="FlowCommand"],
button[data-automationid="FieldRender-ShareHero"],
button[data-automationid="addShortcutHeroCommand"],
button[data-automationid="Link"],
button[data-automationid="uploadFolderCommand"],
button[data-automationid="UploadTemplate"],
button[data-automationid="syncCommand"],
button[data-automationid="shareCommand"],
button[name="Link"],
button[name="Integrate"],
button[name="Edit New menu"],
button[name="Add template"],
button[name="Pin to Quick access"],
button[name="More"],
button[name="Share"],
button[name="Add shortcut to OneDrive"],
button[name="Details"],
button[name="Manage access"],
button[name="Sync"],
button[name="Automate"] {
    display: none !important; /* Hide these buttons */
}

/* Default to hide the newCommand button */
button[data-automationid="newCommand"],
button[data-automationid="uploadCommand"] {
    display: none; 
}

/* Override styles for Baselines library */
body.baselines-library button[data-automationid="newCommand"] {
    display: inline-block !important; /* Make the newCommand button visible */
}

/* Additional styling for classic SharePoint link */
a[aria-label="Click or enter to return to classic SharePoint"] {
    display: none !important; /* Hide the link to classic SharePoint */
}


