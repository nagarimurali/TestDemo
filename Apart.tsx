import * as React from 'react';
import { TextField, IconButton, PrimaryButton } from '@fluentui/react';
import { ITextFieldStyles } from '@fluentui/react/lib/TextField';

// Define the structure of a part number row
export interface IPartNumber {
  reference: string;
  revision: string;
}

// Define the state of the component
export interface IMyComponentState {
  partNumbers: IPartNumber[];
}

// Main component class
export default class MyComponent extends React.Component<{}, IMyComponentState> {
  constructor(props: {}) {
    super(props);

    // Initialize state with one row
    this.state = {
      partNumbers: [{ reference: '', revision: '' }],
    };
  }

  // Function to add a new row
  private addRow = () => {
    this.setState((prevState) => ({
      partNumbers: [...prevState.partNumbers, { reference: '', revision: '' }],
    }));
  };

  // Function to remove a row by index
  private removeRow = (index: number) => {
    const { partNumbers } = this.state;
    if (partNumbers.length > 1) {
      this.setState({
        partNumbers: partNumbers.filter((_, i) => i !== index),
      });
    }
  };

  // Handle input changes for reference and revision fields
  private handleInputChange = (index: number, field: string, value: string) => {
    const updatedPartNumbers = [...this.state.partNumbers];
    updatedPartNumbers[index][field] = value;
    this.setState({ partNumbers: updatedPartNumbers });
  };

  // Validate and save the data
  private saveData = () => {
    const { partNumbers } = this.state;

    // Validate fields are not empty
    const isValid = partNumbers.every(
      (part) => part.reference.trim() !== '' && part.revision.trim() !== ''
    );

    if (!isValid) {
      alert('Please fill all fields before saving.');
      return;
    }

    // Save logic (replace with actual save implementation)
    console.log('Saving Data:', partNumbers);
  };

  public render(): React.ReactElement<{}> {
    const textFieldStyles: Partial<ITextFieldStyles> = { root: { marginRight: 8 } };

    return (
      <div className="alstom-part-numbers-container">
        <h3>Alstom Part Numbers</h3>
        {this.state.partNumbers.map((part, index) => (
          <div className="row-container" key={index}>
            <TextField
              className="text-field"
              placeholder="Reference"
              value={part.reference}
              onChange={(e, newValue) => this.handleInputChange(index, 'reference', newValue || '')}
              styles={textFieldStyles}
              required
            />
            <TextField
              className="text-field"
              placeholder="Revision"
              value={part.revision}
              onChange={(e, newValue) => this.handleInputChange(index, 'revision', newValue || '')}
              styles={textFieldStyles}
              required
            />
            <IconButton
              className="icon-button"
              iconProps={{ iconName: 'Delete' }}
              title="Remove"
              ariaLabel="Remove"
              onClick={() => this.removeRow(index)}
              disabled={this.state.partNumbers.length === 1}
            />
            {index === this.state.partNumbers.length - 1 && (
              <IconButton
                className="icon-button"
                iconProps={{ iconName: 'Add' }}
                title="Add"
                ariaLabel="Add"
                onClick={this.addRow}
              />
            )}
          </div>
        ))}
        <PrimaryButton className="save-button" text="Save" onClick={this.saveData} />
      </div>
    );
  }
}
