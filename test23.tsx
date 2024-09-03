import * as React from 'react';
import { CommandBar } from '@fluentui/react/lib/CommandBar';
import { Dialog } from '@fluentui/react/lib/Dialog';
import { DefaultButton } from '@fluentui/react/lib/Button';
import BaselineService from '../../services/BaselineService';
import { IBaselineCommandBarProps, IBaselineCommandBarState } from './BaselineCommandBar.types';

export class BaselineCommandBar extends React.Component<IBaselineCommandBarProps, IBaselineCommandBarState> {
  constructor(props: IBaselineCommandBarProps) {
    super(props);
    this.state = {
      isFreezeDialogVisible: false,
      isSuccessMsg: false
    };
  }

  private async openFreezeDialog(): Promise<void> {
    try {
      const technicalDocuments = this.filterTechnicalDocuments(this.props.linkedSearchItems);

      if (technicalDocuments.length === 0) {
        this.handleNoTechnicalDocuments();
        return;
      }

      // Run the queries in parallel
      const [technicalData, baselineData] = await Promise.all([
        this.fetchBaselineData('Technical Document'),
        this.fetchBaselineData('Baseline')
      ]);

      if (this.shouldShowDialog(technicalData, baselineData)) {
        this.showDialog(technicalData, baselineData);
      }

    } catch (error) {
      this.handleError(error);
    }
  }

  private filterTechnicalDocuments(items: any[]): any[] {
    return items.filter(item => item.ContentType === 'Technical Document' && item.DocumentId);
  }

  private async fetchBaselineData(contentType: string): Promise<ICustomSearchResults[]> {
    const query = `ContentType:"${contentType}"`;
    return await BaselineService.getSearchResults(query);
  }

  private shouldShowDialog(technicalData: ICustomSearchResults[], baselineData: ICustomSearchResults[]): boolean {
    if (this.hasFrozenBaseline(baselineData)) {
      this.setState({ isFreezeDialogVisible: false, isSuccessMsg: false });
      return false;
    }
    if (this.areAllDocumentsDraft(technicalData)) {
      this.setState({ isFreezeDialogVisible: true, isSuccessMsg: true });
      return true;
    }
    return true;
  }

  private hasFrozenBaseline(baselineData: ICustomSearchResults[]): boolean {
    return baselineData.some(item => item.BaselineStatus === 'Frozen');
  }

  private areAllDocumentsDraft(technicalData: ICustomSearchResults[]): boolean {
    return technicalData.every(item => item.DocumentStatus === 'Draft');
  }

  private showDialog(technicalData: ICustomSearchResults[], baselineData: ICustomSearchResults[]): void {
    if (!this.areAllDocumentsDraft(technicalData)) {
      console.log('Non-draft documents in Technical Data', technicalData.filter(item => item.DocumentStatus !== 'Draft'));
    }
    console.log('Baseline Data', baselineData); // Log baseline data for additional checks if needed
    this.setState({ isFreezeDialogVisible: true, isSuccessMsg: false });
  }

  private handleNoTechnicalDocuments(): void {
    console.warn('No technical documents found in the linked items.');
  }

  private handleError(error: any): void {
    console.error('Error in openFreezeDialog', error);
  }

  private closeDialog(): void {
    this.setState({ isFreezeDialogVisible: false });
  }

  render() {
    return (
      <>
        <CommandBar items={this.props.commandBarItems} />
        {this.state.isFreezeDialogVisible && (
          <Dialog onDismiss={this.closeDialog.bind(this)}>
            <p>{this.state.isSuccessMsg ? 'All documents are in Draft status.' : 'There are non-draft documents.'}</p>
            <DefaultButton onClick={this.closeDialog.bind(this)} text="Close" />
          </Dialog>
        )}
      </>
    );
  }
}
