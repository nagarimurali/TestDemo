import { Log } from '@microsoft/sp-core-library';
import { BaseApplicationCustomizer } from '@microsoft/sp-application-base';
import { override } from '@microsoft/decorators';
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';

const LOG_SOURCE: string = 'HideButtonsInRootFolder';

export default class HideButtonsInRootFolder extends BaseApplicationCustomizer<{}> {

  @override
  public onInit(): Promise<void> {
    Log.info(LOG_SOURCE, `Initialized HideButtonsInRootFolder`);

    // Function to hide or show elements by selector
    const toggleElementVisibility = (selector: string, elementName: string, show: boolean) => {
      const element: any = document.querySelector(selector);
      if (element) {
        element.style.display = show ? "inline-block" : "none";
        console.log(`${elementName} ${show ? 'shown' : 'hidden'}`);
      } else {
        console.warn(`${elementName} not found`);
      }
    };

    // Check if we're in the root folder or the Technical Document folder by examining the URL or breadcrumb
    const getFolderLevel = (): string => {
      const currentUrl = window.location.href;

      // Root folder logic based on URL (adjust this part if necessary)
      if (currentUrl.includes('/Forms/AllItems.aspx')) {
        return 'root';
      }

      // Logic to detect Technical Document level
      const breadcrumb = document.querySelector('.ms-Breadcrumb-listItem span')?.textContent || '';
      if (breadcrumb.includes('Technical Document')) {
        return 'technicalDocument';
      }

      // Default to sub-folder if none of the above match
      return 'subfolder';
    };

    // Function to hide or show "New" and "Upload" buttons based on the folder level
    const toggleButtonsVisibility = () => {
      const folderLevel = getFolderLevel();

      if (folderLevel === 'root') {
        toggleElementVisibility('button[aria-label="New"]', "New Button", false);
        toggleElementVisibility('button[aria-label="Upload"]', "Upload Button", false);
      } else if (folderLevel === 'technicalDocument') {
        toggleElementVisibility('button[aria-label="New"]', "New Button", true);
        toggleElementVisibility('button[aria-label="Upload"]', "Upload Button", true);
      }
    };

    // Initially hide or show buttons based on the folder level
    toggleButtonsVisibility();

    // Use MutationObserver to recheck whenever the DOM updates (e.g., folder navigation)
    const observer = new MutationObserver(() => {
      toggleButtonsVisibility();
    });

    const config = { childList: true, subtree: true };
    const targetNode = document.body || document.documentElement;
    observer.observe(targetNode, config);

    return Promise.resolve();
  }
}
=============================

import { Log } from '@microsoft/sp-core-library';
import { BaseApplicationCustomizer } from '@microsoft/sp-application-base';
import { override } from '@microsoft/decorators';

const LOG_SOURCE: string = 'HideButtonsInRootFolder';

export default class HideButtonsInRootFolder extends BaseApplicationCustomizer<{}> {

  @override
  public onInit(): Promise<void> {
    Log.info(LOG_SOURCE, `Initialized HideButtonsInRootFolder`);

    // Function to hide elements by selector
    const hideElement = (selector: string, elementName: string) => {
      const element: any = document.querySelector(selector);
      if (element) {
        element.style.display = "none";
        console.log(`${elementName} hidden`);
      } else {
        console.warn(`${elementName} not found`);
      }
    };

    // Check if we're in the root folder by examining the current URL or breadcrumb
    const isRootFolder = (): boolean => {
      const currentUrl = window.location.href;
      const breadcrumb = document.querySelector('.ms-Breadcrumb-listItem span')?.textContent || '';

      // Assuming root folder doesn't have '/Forms' or sub-folder path in URL
      return currentUrl.includes('/Forms/AllItems.aspx') && breadcrumb === 'Documents'; // adjust as needed
    };

    // Function to hide "New" and "Upload" buttons if we're in the root folder
    const hideButtonsIfRootFolder = () => {
      if (isRootFolder()) {
        hideElement('button[aria-label="New"]', "New Button");
        hideElement('button[aria-label="Upload"]', "Upload Button");
      }
    };

    // Initially hide buttons if we're in the root folder
    hideButtonsIfRootFolder();

    // Use MutationObserver to recheck whenever the DOM updates (e.g., folder navigation)
    const observer = new MutationObserver(() => {
      hideButtonsIfRootFolder();
    });

    const config = { childList: true, subtree: true };
    const targetNode = document.body || document.documentElement;
    observer.observe(targetNode, config);

    return Promise.resolve();
  }
}

