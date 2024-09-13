interface IPartNumber {
  reference: string;
  revision: string;
}

interface IAlstomPartNumbersFieldState extends IDmsDynamicFieldState {
  partNumbers: IPartNumber[];  // Add part numbers array to the state
}
class AlstomPartNumbersField extends DmsDynamicFieldBase<IConfidentialityLevelFieldProps, IAlstomPartNumbersFieldState> {

  constructor(props: IConfidentialityLevelFieldProps) {
    super(props);
    this.state = {
      ...this.state,
      partNumbers: [{ reference: '', revision: '' }] // Initialize with one empty part number row
    };
  }

  // Handle input change for part numbers
  handleInputChange = (index: number, field: keyof IPartNumber, value: string) => {
    const updatedParts = [...this.state.partNumbers];
    updatedParts[index][field] = value;
    this.setState({ partNumbers: updatedParts });
  };

  // Add new row for part numbers
  handleAddRow = () => {
    this.setState(prevState => ({
      partNumbers: [...prevState.partNumbers, { reference: '', revision: '' }]
    }));
  };

  // Remove a row
  handleRemoveRow = (index: number) => {
    this.setState(prevState => ({
      partNumbers: prevState.partNumbers.filter((_, i) => i !== index)
    }));
  };

  // Concatenate part numbers and revisions into a single string
  getConcatenatedPartNumbers = (): string => {
    return this.state.partNumbers
      .filter(part => part.reference && part.revision)  // Ensure both fields are filled
      .map(part => `${part.reference}/${part.revision}`)
      .join('; ');
  };

  // Form submit logic
  handleSubmit = () => {
    const concatenatedValues = this.getConcatenatedPartNumbers();
    console.log('Formatted Value for SharePoint:', concatenatedValues);
    // You can add logic to save concatenatedValues to SharePoint
  };

  render() {
    const { partNumbers } = this.state;

    return (
      <div className={styles.ConfidentialityLevelField}>
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
            {/* Add "+" button if last row is filled */}
            {part.reference && part.revision && index === partNumbers.length - 1 && (
              <button type="button" onClick={this.handleAddRow}>+</button>
            )}
            {/* Add "-" button if more than one row */}
            {partNumbers.length > 1 && (
              <button type="button" onClick={() => this.handleRemoveRow(index)}>-</button>
            )}
          </div>
        ))}

        <textarea
          value={this.getConcatenatedPartNumbers()} // Display the concatenated part numbers
          readOnly
          rows={3}
          style={{ width: '100%', marginTop: '20px' }}
        />

        <button type="button" onClick={this.handleSubmit} style={{ marginTop: '10px' }}>Save</button>
      </div>
    );
  }
}
-----------------
.part-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
----------------------------------
import { sp } from "@pnp/sp/presets/all";

const saveToSharePoint = async (value: string) => {
  await sp.web.lists.getByTitle("YourListName").items.getById(itemId).update({
    MultiLineFieldName: value
  });
};
additionalFieldOptions[FieldNames.AlstomPartNumbers] = {
    ...additionalFieldOptions[FieldNames.AlstomPartNumbers],
    render: (props) => (
        <AlstomPartNumbersField
            {...props}
            ref={props.ref as React.RefObject<AlstomPartNumbersField>}
        />
    ),
  ----------------------------------------------------------------------------
    preSaveOperationLabel: strings.AlstomPartNumbersPreSaveOperationLabel,
    preSaveOperation: (value: string, ref: React.RefObject<AlstomPartNumbersField>, values: IListItemFormUpdateValue[]) => {
        if (ref.current) {
            const internalValue = ref.current.state.value;
            if (!internalValue) {
                throw new Error("AlstomPartNumbersField is not set");
            }
            // Assuming you need to concatenate part numbers
            const partNumberValue = internalValue
                .split(';') // Assuming each part number is separated by semicolons
                .map(v => `${values.find(v => v.FieldName === FieldNames.ProjectReference)?.FieldValue}-${values.find(v => v.FieldName === FieldNames.Revision)?.FieldValue}`);
            
            // Return the concatenated part numbers
            return partNumberValue.join('; ');
        }
    }
};
