import * as React from 'react';

interface PartNumber {
  reference: string;
  revision: string;
}

interface AlstomPartNumbersFieldProps {
  value: string; // Single-line value containing multiple part numbers
  onChange: (value: string) => void; // Callback when the value changes
}

interface AlstomPartNumbersFieldState {
  partNumbers: PartNumber[]; // Array to store multiple part numbers and revisions
}

class AlstomPartNumbersField extends React.Component<AlstomPartNumbersFieldProps, AlstomPartNumbersFieldState> {
  constructor(props: AlstomPartNumbersFieldProps) {
    super(props);
    
    this.state = {
      partNumbers: this.parseValueToPartNumbers(props.value) // Parse the initial value into partNumbers array
    };
  }

  // Parse the single-line value into an array of PartNumber objects
  parseValueToPartNumbers = (value: string): PartNumber[] => {
    if (!value) return [{ reference: '', revision: '' }]; // If empty, return a default row
    return value.split(';').map((part) => {
      const [reference, revision] = part.split('/');
      return { reference: reference.trim(), revision: revision?.trim() || '' }; // Handle missing revision case
    });
  };

  // Convert partNumbers array back to a single-line value
  partNumbersToSingleLine = (): string => {
    return this.state.partNumbers
      .filter(part => part.reference && part.revision) // Only include filled rows
      .map(part => `${part.reference}/${part.revision}`) // Format as "Reference/Revision"
      .join('; '); // Join with semicolons
  };

  // Handle input changes for reference or revision fields
  handleInputChange = (index: number, field: keyof PartNumber, value: string) => {
    const updatedParts = [...this.state.partNumbers];
    updatedParts[index][field] = value;
    this.setState({ partNumbers: updatedParts }, this.notifyParent); // Notify parent of the change
  };

  // Notify parent component about the change
  notifyParent = () => {
    const singleLineValue = this.partNumbersToSingleLine();
    this.props.onChange(singleLineValue);
  };

  // Add a new row for part numbers
  handleAddRow = () => {
    this.setState((prevState) => ({
      partNumbers: [...prevState.partNumbers, { reference: '', revision: '' }]
    }));
  };

  // Remove a row from the part numbers
  handleRemoveRow = (index: number) => {
    this.setState((prevState) => ({
      partNumbers: prevState.partNumbers.filter((_, i) => i !== index)
    }), this.notifyParent);
  };

  // Check if a row is fully filled
  isRowFilled = (part: PartNumber): boolean => {
    return part.reference !== '' && part.revision !== '';
  };

  render() {
    const { partNumbers } = this.state;

    return (
      <div>
        <h3>Alstom Part Numbers</h3>
        {partNumbers.map((part, index) => (
          <div key={index} className="part-row">
            <input
              type="text"
              placeholder="Reference"
              value={part.reference}
              onChange={(e) => this.handleInputChange(index, 'reference', e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Revision"
              value={part.revision}
              onChange={(e) => this.handleInputChange(index, 'revision', e.target.value)}
              required
            />
            {/* Show + button only for the last row */}
            {this.isRowFilled(part) && index === partNumbers.length - 1 && (
              <button type="button" onClick={this.handleAddRow}>+</button>
            )}
            {/* Show - button only if there are more than one rows */}
            {partNumbers.length > 1 && (
              <button type="button" onClick={() => this.handleRemoveRow(index)}>-</button>
            )}
          </div>
        ))}
      </div>
    );
  }
}
-----------------------------------------------------------------------------
additionalFieldOptions[FieldNames.AlstomPartNumbers] = {
  ...additionalFieldOptions[FieldNames.AlstomPartNumbers],
  render: (props) => (
    <AlstomPartNumbersField
      value={this.state.alstomPartNumbersValue}
      onChange={(newValue: string) => this.setState({ alstomPartNumbersValue: newValue })}
    />
  ),
  saveOperation: async (_, spfi, values) => {
    const alstomPartNumbers = values.find((v) => v.FieldName === FieldNames.AlstomPartNumbers)?.FieldValue;
    if (!alstomPartNumbers) {
      throw new Error('AlstomPartNumbersField is not set');
    }
    // Logic to save alstom part numbers to SharePoint list
    await spfi.utility.saveAlstomPartNumbers(alstomPartNumbers);
  }
};
-----------------------------------------------------------

export default AlstomPartNumbersField;
