import { Log } from '@microsoft/sp-core-library';
import { BaseApplicationCustomizer } from '@microsoft/sp-application-base';
import * as strings from 'DmlCustomUiChangesApplicationCustomizerStrings';

import { spfi, SPFx } from "@pnp/sp";
import { IHubSiteInfo } from "@pnp/sp/hubsites";
import "@pnp/sp/hubsites";
import { Dialog, DialogType, DialogFooter, Spinner, SpinnerSize } from '@fluentui/react'; // Fluent UI components
import * as ReactDOM from 'react-dom'; // For rendering the popup

const LOG_SOURCE: string = 'DmlCustomUiChangesApplicationCustomizer';

export interface IDmlCustomUiChangesApplicationCustomizerProperties { }

export default class DmlCustomUiChangesApplicationCustomizer
  extends BaseApplicationCustomizer<IDmlCustomUiChangesApplicationCustomizerProperties> {

  private sp: ReturnType<typeof spfi>;
  private cssUrl: string;
  private previousUrl: string = window.location.href;
  private loaderDialogElement: HTMLElement;

  public async onInit(): Promise<void> {
    Log.info(LOG_SOURCE, `Initialized ${strings.Title}`);
    this.sp = spfi().using(SPFx(this.context));

    // Create a container for the loader dialog
    this.loaderDialogElement = document.createElement('div');
    document.body.appendChild(this.loaderDialogElement);

    // Apply customizations on initial load
    await this.applyCustomizations();

    // Listen for navigation changes
    this.setupNavigationListener();

    // Add click listener for the "Draft" navigation link
    this.addDraftClickListener();

    return Promise.resolve();
  }

  // Function to handle URL changes via popstate or history API changes
  private setupNavigationListener(): void {
    window.addEventListener('popstate', () => this.handleUrlChange());
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.handleUrlChange();
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.handleUrlChange();
    };
  }

  private handleUrlChange(): void {
    const currentUrl = window.location.href;

    if (this.previousUrl !== currentUrl) {
      this.previousUrl = currentUrl;
      this.applyCustomizations();  // Reapply customizations based on the new URL
    }
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
    const listTitle = this.context.pageContext.list?.title;

    if (listTitle === "Draft" || listTitle === "Baselines" ||
        listTitle === "Applicable Documents" || listTitle === "Previous Versions") {

      // Show loader before applying customizations
      this.showLoaderDialog();

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

      // Hide loader after customizations are applied
      this.hideLoaderDialog();
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
    // Add additional conditions if needed for checking if the current folder is a child folder
    return viewid; // Return true or false based on your criteria
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

  // Show loader popup with Fluent UI Spinner
  private showLoaderDialog(): void {
    const LoaderDialog = () => (
      <Dialog
        hidden={false}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Applying Customizations...',
        }}
        modalProps={{
          isBlocking: true
        }}>
        <Spinner label="Please wait..." size={SpinnerSize.large} />
      </Dialog>
    );

    ReactDOM.render(<LoaderDialog />, this.loaderDialogElement);
  }

  // Hide loader popup
  private hideLoaderDialog(): void {
    ReactDOM.unmountComponentAtNode(this.loaderDialogElement);
  }
}
