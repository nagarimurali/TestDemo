private onTextChange = (field: any, value: string) => {
  if (field === 'baselineVersion') {
    const specialCharaRegex = /[^a-zA-Z0-9]/g; // Regex for special characters

    if (specialCharaRegex.test(value)) {
      // If special characters are found, set the error
      this.setState({
        errorMessage: `Special characters are not allowed in ${field}.`,
        errorControls: [...this.state.errorControls, { stateName: field }]
      });
      return; // Stop further execution if invalid
    } else {
      // Reset the error for this field if the input is valid
      this.resetError(field);
    }
  }

  // Proceed to update state with valid input
  const newState = { [field]: value } as Pick<IFormContainerState, keyof IFormContainerState>;
  this.setState(newState);
};
<TooltipHost content="Baseline Version" delay={TooltipDelay.long}>
  <TextField required
    label="Version"
    placeholder='Version'
    value={this.state.baselineVersion}
    disabled={this.state.currentMode === "New" ? false : true}
    onChange={(event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue: string) => this.onTextChange('baselineVersion', newValue)}
    className={this.state.errorControls.some(e => e.stateName === 'baselineVersion') ? styles.required : ''}
  />
</TooltipHost>
