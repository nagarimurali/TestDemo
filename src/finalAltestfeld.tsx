import * as React from 'react';

interface PartNumber {
  reference: string;
  revision: string;
}

interface State {
  partNumbers: PartNumber[];
}

class AlstomPartNumbersForm extends React.Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = {
      partNumbers: [{ reference: '', revision: '' }] // Initial state with one empty row
    };
  }

  // Handle change in inputs
  handleInputChange = (index: number, field: keyof PartNumber, value: string) => {
    const updatedParts = [...this.state.partNumbers];
    updatedParts[index][field] = value;
    this.setState({ partNumbers: updatedParts });
  };

  // Add new row
  handleAddRow = () => {
    this.setState((prevState) => ({
      partNumbers: [...prevState.partNumbers, { reference: '', revision: '' }]
    }));
  };

  // Remove row
  handleRemoveRow = (index: number) => {
    this.setState((prevState) => ({
      partNumbers: prevState.partNumbers.filter((_, i) => i !== index)
    }));
  };

  // Check if the current row is filled
  isRowFilled = (part: PartNumber): boolean => {
    return part.reference !== '' && part.revision !== '';
  };

  // Concatenate parts in a single line with semicolons
  getSingleLineText = (): string => {
    return this.state.partNumbers
      .filter(part => this.isRowFilled(part)) // Only include filled rows
      .map(part => `${part.reference}/${part.revision}`) // Format as "Reference/Revision"
      .join('; '); // Join with semicolons
  };

  // Form submission
  handleSubmit = () => {
    // Validation: Ensure all rows have reference and revision
    const isValid = this.state.partNumbers.every(part => part.reference && part.revision);
    if (!isValid) {
      alert('Please fill out all fields.');
      return;
    }

    // Get the formatted value for the multi-line text box
    const formattedValue = this.getSingleLineText();

    // Save to SharePoint multiline text box (You can use PnP JS for this)
    console.log('Formatted Value:', formattedValue);
    // saveToSharePoint(formattedValue); // Function to save the value to SharePoint
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
            {/* Show + button if the current row is filled */}
            {this.isRowFilled(part) && index === partNumbers.length - 1 && (
              <button type="button" onClick={this.handleAddRow}>+</button>
            )}
            {/* Show - button only if there are more than one rows */}
            {partNumbers.length > 1 && (
              <button type="button" onClick={() => this.handleRemoveRow(index)}>-</button>
            )}
          </div>
        ))}
        
        {/* Multi-line text box showing the concatenated values in a single line */}
        <textarea
          value={this.getSingleLineText()}
          readOnly
          rows={3}
          style={{ width: '100%', marginTop: '20px' }}
        />

        <button type="button" onClick={this.handleSubmit} style={{ marginTop: '10px' }}>Save</button>
      </div>
    );
  }
}

export default AlstomPartNumbersForm;
