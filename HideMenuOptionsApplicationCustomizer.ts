import { override } from '@microsoft/decorators';
import { Log } from '@microsoft/sp-core-library';
import { BaseApplicationCustomizer } from '@microsoft/sp-application-base';
import * as strings from 'HideMenuOptionsApplicationCustomizerStrings';

const LOG_SOURCE: string = 'HideMenuOptionsApplicationCustomizer';

export interface IHideMenuOptionsApplicationCustomizerProperties {
  // Define any properties if needed.
}

export default class HideMenuOptionsApplicationCustomizer extends BaseApplicationCustomizer<IHideMenuOptionsApplicationCustomizerProperties> {

  @override
  public onInit(): Promise<void> {
    Log.info(LOG_SOURCE, `Initialized HideMenuOptionsApplicationCustomizer`);

    // Inject custom CSS
    const cssUrl: string = `${this.context.pageContext.site.absoluteUrl}/SiteAssets/customHideMenuOptions.css`;
    const head: any = document.getElementsByTagName("head")[0] || document.documentElement;
    const customStyle: HTMLLinkElement = document.createElement("link");
    customStyle.href = cssUrl;
    customStyle.rel = "stylesheet";
    customStyle.type = "text/css";
    head.insertAdjacentElement("beforeEnd", customStyle);

    return Promise.resolve();
  }
}

==========================================

/* Hide 'Favorite' */
li[data-automationid="favoriteCommand"] {
  display: none !important;
}

/* Hide 'Add shortcut to OneDrive' */
li[data-automationid="addToOneDrive"] {
  display: none !important;
}

/* Hide 'Copy link' */
li[data-automationid="copyLink"] {
  display: none !important;
}

/* Hide 'Alert me' */
li[data-automationid="alertMe"] {
  display: none !important;
}

/* Hide 'Move to' */
li[data-automationid="moveTo"] {
  display: none !important;
}

/* Hide 'Details' */
li[data-automationid="detailsCommand"] {
  display: none !important;
}

/* Hide other options as needed, based on their automation id */

