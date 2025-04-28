/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @rushstack/no-new-null */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { FormDisplayMode } from '@microsoft/sp-core-library';
import { FormCustomizerContext } from '@microsoft/sp-listview-extensibility';
import * as React from 'react';
import styles from '../Employeedetails.module.scss';
import { Spinner, SpinnerSize } from "@fluentui/react/lib/Spinner";
import { TooltipDelay, TooltipHost } from "@fluentui/react/lib/Tooltip";
import { TextField } from "@fluentui/react/lib/TextField";
import { DefaultButton, PrimaryButton } from "@fluentui/react/lib/Button";
import { FieldNames, IRequiredFields } from '../../../../helper/QueryHelper';
import { BaselineHelper } from '../../../../service/Helper';
import EmployeeService from '../../../../service/EmployeeService';
import { ComboBox, IComboBox, IComboBoxOption } from '@fluentui/react/lib/ComboBox';
import { ModernTaxonomyPicker } from '@pnp/spfx-controls-react/lib/ModernTaxonomyPicker';
import DmsFieldValidationWrapper from './DmsFieldValidationWrapper'
import { IFieldInfo } from '@pnp/sp/fields';
import { SPFI } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/fields";
import "@pnp/sp/webs";
import "@pnp/sp/site-users/web";
import { getSP } from '../../../../pnpjs-config';
import { BaselineCommanBar } from '../CommanBar/CommanToolBar';
import { Pivot, PivotItem } from '@fluentui/react';
export interface ITermLabel {
    name: string;
    isDefault: boolean;
    languageTag: string;
}

export interface ITerm {
    labels: ITermLabel[];
    id: string;
}

export interface IFormContainerState {
    title: string;
    managercomments: string;
    isPageLoading: boolean;
    isSaving: boolean;
    errorControls: IRequiredFields[];
    errorMessage?: string;
    qualification: string | undefined;
    employeeFirstName: string | undefined;
    absTerms: ITerm[]
    joiningDate: string | undefined; // Add a new state for the date picker
    pbsTerms: ITerm[]; // Add PBS state
    isLoading: boolean// Add a state to store field information
    section: string | undefined;
    fieldInfos?: { [key: string]: IFieldInfo };
    createdBy?: string;
    createdDate?: string;
    modifiedDate?: string;
    modifiedBy?: string;
}

export interface IFormContainerProps {
    context: FormCustomizerContext;
    displayMode: FormDisplayMode;
    onSave: () => void;
    onClose: () => void;
    itemID: number;
    item: any;
}
const PROJECT_CONFIG_FIELDS = [
    FieldNames.ABS,
    FieldNames.PBS,
    FieldNames.Qualification,
    FieldNames.Section,
];
const requiredFields: IRequiredFields[] = [
    { stateName: "title", fieldName: "Title" },
    { stateName: "qualification", fieldName: "Qualification" },
    { stateName: "employeeFirstName", fieldName: "Employee First Name" },
    { stateName: "absTerms", fieldName: "ABS" },
    { stateName: "pbsTerms", fieldName: "PBS" },

];
export default class EmployeeFormCustom extends React.Component<IFormContainerProps, IFormContainerState> {
    private _sp: SPFI;
    constructor(props: IFormContainerProps) {
        super(props);
        this.state = {
            title: "",
            isPageLoading: false,
            managercomments: "",
            isSaving: false,
            errorControls: [],
            qualification: "",
            section: "",
            employeeFirstName: "Murali",
            absTerms: [],
            joiningDate: "", // Initialize the new state
            pbsTerms: [], // Initialize PBS state

            isLoading: false// Initialize fieldInfos
        };
        this._sp = getSP(this.props.context);
    }

    public componentDidMount(): void {
        const [batch, execute] = this._sp.batched();
        const { item, itemID } = this.props;

        // Fetch field information
        Promise.all(PROJECT_CONFIG_FIELDS.map(fieldName => batch.web.fields.getByInternalNameOrTitle(fieldName)()))
            .then(fieldInfoArray => {
                const fieldInfos = fieldInfoArray.reduce((acc, fieldInfo) => {
                    acc[fieldInfo.InternalName] = fieldInfo;
                    return acc;
                }, {} as { [key: string]: IFieldInfo });

                this.setState({ fieldInfos });
            })
            .catch(err => console.error(err))


        execute().catch(err => console.error(err));

        // Populate state if itemID is defined
        if (itemID !== undefined) {
            const sanitizedComments = this._sanitizeHtml(item.ManagerComments);
            this.setState({
                title: item.Title,
                qualification: item.Qualification,
                section: item.Section1,
                employeeFirstName: item.EmployeeFirstName,
                managercomments: sanitizedComments,
                absTerms: this.createTaxonomyTerm(item.ABS),
                joiningDate: item.StartDate1?.split('T')[0] || "",
                pbsTerms: this.createTaxonomyTerm(item.PBS),
            });
            this.fetchUserDetails(item.AuthorId, item.EditorId);
        }
    }

    private async fetchUserDetails(authorId: number, editorId: number): Promise<void> {
        try {
            const [author, editor] = await Promise.all([
                this._sp.web.getUserById(authorId).select("Title")(),
                this._sp.web.getUserById(editorId).select("Title")()
            ]);

            this.setState({
                createdBy: author.Title,
                modifiedBy: editor.Title
            });
        } catch (error) {
            console.error("Error fetching user details:", error);
        }
    }

    private createTaxonomyTerm(term: any): any[] {
        if (!term) return [];

        return [{
            labels: [{
                name: term.Label,
                isDefault: true,
                languageTag: 'en-US'
            }],
            id: term.TermGuid
        }];
    }

    private _sanitizeHtml(html: string): string {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        return tempDiv.textContent || tempDiv.innerText || "";
    }
    private _onTaxPickerChange(propertyName: string, newValue: never[], fieldName: string): void {
        const newState = { ...this.state, [propertyName]: newValue };
        this.setState(newState);
        this.setState(prevState => ({
            //         ...prevState,
            errorControls: prevState.errorControls.filter(e => e.stateName !== propertyName)
            // this._validate(fieldName, newValue);
        }));
    }

    public resetError(field: string): void {
        const errors = this.state.errorControls;
        const index = errors.findIndex((obj) => obj.stateName === field);
        if (index >= 0) {
            errors.splice(index, 1);
            this.setState({
                errorControls: errors,
                errorMessage: errors.length > 0 ? this.state.errorMessage : "",
            });
        }
    }



    // TEXTFIELDS ON CHANGE
    private onTextChange(field: keyof IFormContainerState, value: string): void {
        const newState = { [field]: value } as unknown as Pick<IFormContainerState, keyof IFormContainerState>;
        this.setState(newState);
        const errors = this.state.errorControls;
        const index = errors.findIndex((obj) => obj.stateName === field);
        if (index >= 0) {
            errors.splice(index, 1);
            this.setState({
                errorControls: errors,
                errorMessage: errors.length > 0 ? this.state.errorMessage : "",
            });
        }
        this.resetError(field);
    }
    public async validateFields(): Promise<void> {


        try {
            BaselineHelper.checkRequiredFields(this.state, requiredFields);
        } catch (e) {
            this.setState({
                errorControls: e.targetFields,
                errorMessage: e.message,
            });
            throw new Error(e.message);
        }
    }
    private getTaxonomyFieldValue(terms: any[] | null | undefined): { Label: string; TermGuid: string; WssId: number } | null {
        if (!terms || terms.length === 0) return null;

        return {
            Label: terms[0]?.labels?.[0]?.name || "",
            TermGuid: terms[0]?.id,
            WssId: -1
        };
    }

    private async submitForm(): Promise<void> {
        await this.validateFields();
        this.setState({ isSaving: true });
        try {
            const createObject = {
                Title: this.state.title,
                ManagerComments: this.state.managercomments,
                Qualification: this.state.qualification,
                EmployeeFirstName: this.state.employeeFirstName,
                Section1: this.state.section,
                ABS: this.getTaxonomyFieldValue(this.state.absTerms),
                StartDate1: this.state.joiningDate ? `${this.state.joiningDate}T00:00:00Z` : null, // Convert to ISO 8601 format
                PBS: this.getTaxonomyFieldValue(this.state.pbsTerms), // Include PBS in submission
            };
            if (this.props.itemID) {
                await EmployeeService.updateListItem(this.props.context.list.title, createObject, this.props.itemID);
                alert("Item Updated Successfully");

            } else {
                await EmployeeService.createListItem(this.props.context.list.title, createObject);
                alert("Item Created Successfully");

            }

            this.props.onSave();
        } catch (err) {
            this.setState({ isSaving: false });
            alert("Error creating item: " + err.message);
        }
    }

    private getColumnOptions(columnName: string): IComboBoxOption[] {
        const { fieldInfos } = this.state;
        return fieldInfos?.[columnName]?.Choices?.map(choice => ({
            key: choice,
            text: choice
        })) || [];
    }

    public render(): React.ReactElement<{}> {
        const { context } = this.props;
        const { pbsTerms, fieldInfos, errorControls } = this.state;

        // Filter errors specific to the "Main Information" tab
        const mainTabFields = ["title", "employeeFirstName", "joiningDate", "absTerms", "managercomments"];
        const mainTabErrorCount = errorControls.filter((e) => mainTabFields.includes(e.stateName)).length;

        return (
            <div className={styles.formWrapper}>
                <BaselineCommanBar
                    displayMode={this.props.displayMode}
                    onSave={() => this.submitForm()}
                    onCancel={this.props.onClose}
                />

                <div className={`${styles.formOuterContainer} `}>
                    <div className={`${styles.formMidContainer} `}>
                        <div>
                            {this.state.isLoading ? (
                                <div>
                                    <Spinner
                                        size={SpinnerSize.large}
                                        defaultValue={"Please wait loading..."}
                                    >
                                        Please wait loading...
                                    </Spinner>
                                </div>
                            ) : (
                                <div className={`${styles.formInnerContainer} `}>
                                    <Pivot>
                                        {/* Main Tab */}
                                        <PivotItem headerText={`Main Information${mainTabErrorCount > 0 ? ` (${mainTabErrorCount})` : ''}`}>
                                            <div className={styles.column}>
                                                <div className={styles.row}>

                                                    <div className={styles.fieldWrapper}>
                                                        <TooltipHost content="Title" delay={TooltipDelay.long}>
                                                            <TextField
                                                                required
                                                                value={this.state.title}
                                                                label="Title"
                                                                placeholder="Title"
                                                                onChange={(
                                                                    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
                                                                    newValue: string
                                                                ) => this.onTextChange("title", newValue)}
                                                                className={this.state.errorControls.some(
                                                                    (e) => e.stateName === "title"
                                                                )
                                                                    ? styles.required
                                                                    : ""
                                                                }
                                                                errorMessage={
                                                                    this.state.errorControls.some(e => e.stateName === "title")
                                                                        ? "Title is required"
                                                                        : undefined
                                                                }
                                                            />
                                                        </TooltipHost>
                                                    </div>

                                                    <div className={styles.fieldWrapper}>
                                                        <TooltipHost content="EmployeeFirstName" delay={TooltipDelay.long}>
                                                            <TextField
                                                                required
                                                                value={this.state.employeeFirstName}
                                                                label="Employee FirstName"
                                                                placeholder="Employee FirstName"
                                                                onChange={(
                                                                    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
                                                                    newValue: string
                                                                ) => this.onTextChange("employeeFirstName", newValue)}
                                                                errorMessage={
                                                                    this.state.errorControls.some(e => e.stateName === "employeeFirstName")
                                                                        ? "Employee First Name is required"
                                                                        : undefined
                                                                }
                                                            />
                                                        </TooltipHost>
                                                    </div>

                                                    <div className={styles.fieldWrapper}>
                                                        <TooltipHost content="Joining Date" delay={TooltipDelay.long}>
                                                            <TextField
                                                                type={this.props.displayMode === FormDisplayMode.Display ? undefined : 'date'}
                                                                label="Joining Date"
                                                                value={this.state.joiningDate}
                                                                onChange={(
                                                                    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
                                                                    newValue: string
                                                                ) => this.onTextChange("joiningDate", newValue)}
                                                                errorMessage={
                                                                    this.state.errorControls.some(e => e.stateName === "joiningDate")
                                                                        ? "Joining Date is required"
                                                                        : undefined
                                                                }
                                                                disabled={this.props.displayMode === FormDisplayMode.Display}
                                                            />
                                                        </TooltipHost>
                                                    </div>

                                                    {fieldInfos && (
                                                        <div className={styles.fieldWrapper}>
                                                            <DmsFieldValidationWrapper
                                                                validationError={
                                                                    this.state.errorControls.some(e => e.stateName === "absTerms")
                                                                        ? "ABS is required"
                                                                        : undefined
                                                                }
                                                            >
                                                                <ModernTaxonomyPicker
                                                                    allowMultipleSelections={false}
                                                                    termSetId={(fieldInfos[FieldNames.ABS] as IFieldInfo & { TermSetId: string }).TermSetId}
                                                                    panelTitle="Select ABS Category"
                                                                    label="ABS"
                                                                    context={this.props.context as any}
                                                                    onChange={(terms) => {
                                                                        this._onTaxPickerChange('absTerms', terms as any, 'ABS');
                                                                        this.resetError('absTerms'); // Reset error when a valid value is selected
                                                                    }}
                                                                    required={true}
                                                                    initialValues={this.state.absTerms as never}
                                                                    disabled={this.props.displayMode === FormDisplayMode.Display}
                                                                    termPickerProps={{ itemLimit: 1 }}
                                                                />
                                                            </DmsFieldValidationWrapper>
                                                            {/* {this.state.errorControls.some(e => e.stateName === "absTerms") && (
                                                                <span className={styles.errorMessage}>ABS is required</span>
                                                            )} */}
                                                        </div>
                                                    )}

                                                    <div className={styles.fieldWrapper}>
                                                        <TooltipHost content="Manager Comments" delay={TooltipDelay.long}>
                                                            <TextField
                                                                value={this.state.managercomments}
                                                                label="Comments"
                                                                placeholder="comments"
                                                                multiline={true}
                                                                rows={5}
                                                                onChange={(
                                                                    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
                                                                    newValue: string
                                                                ) => this.onTextChange("managercomments", newValue)}
                                                            />
                                                        </TooltipHost>
                                                    </div>
                                                </div>
                                            </div>
                                        </PivotItem>

                                        {/* Additional Details Tab */}
                                        <PivotItem headerText="Additional Details">
                                            <div className={styles.column}>
                                                <div className={styles.row}>
                                                    {fieldInfos && (
                                                        <>
                                                            <div className={styles.fieldWrapper}>
                                                                <DmsFieldValidationWrapper validationError={
                                                                    this.state.errorControls.some(e => e.stateName === "pbsTerms")
                                                                        ? "PBS is required"
                                                                        : undefined
                                                                }>
                                                                    <ModernTaxonomyPicker
                                                                        allowMultipleSelections={false}
                                                                        label="PBS"
                                                                        context={context as never}
                                                                        required
                                                                        termSetId={(fieldInfos[FieldNames.PBS] as IFieldInfo & { TermSetId: string }).TermSetId}
                                                                        panelTitle={"ProductPanelTitle"}
                                                                        onChange={(terms) => this._onTaxPickerChange('pbsTerms', terms as never[], FieldNames.PBS)}
                                                                        initialValues={pbsTerms as never[]}
                                                                    />
                                                                </DmsFieldValidationWrapper>
                                                            </div>

                                                            <div className={styles.fieldWrapper}>
                                                                <ComboBox
                                                                    label="Qualification"
                                                                    required
                                                                    placeholder="Select a Qualification"
                                                                    options={this.getColumnOptions(FieldNames.Qualification)}
                                                                    selectedKey={this.state.qualification}
                                                                    onChange={(
                                                                        event: React.FormEvent<IComboBox>,
                                                                        option?: IComboBoxOption
                                                                    ) => this.onTextChange("qualification", option?.key as string)}
                                                                    errorMessage={
                                                                        this.state.errorControls.some(e => e.stateName === "qualification")
                                                                            ? "Qualification is required"
                                                                            : undefined
                                                                    }
                                                                />
                                                            </div>

                                                            <div className={styles.fieldWrapper}>
                                                                <ComboBox
                                                                    label="Section"
                                                                    required
                                                                    placeholder="Select a Section"
                                                                    options={this.getColumnOptions(FieldNames.Section)}
                                                                    selectedKey={this.state.section}
                                                                    onChange={(
                                                                        event: React.FormEvent<IComboBox>,
                                                                        option?: IComboBoxOption
                                                                    ) => this.onTextChange("section", option?.key as string)}
                                                                />
                                                            </div>

                                                            {/* CreatedBy and Created Fields */}
                                                            {this.props.displayMode !== FormDisplayMode.New && (
                                                                <>
                                                                    <div className={styles.fieldWrapper}>
                                                                        <TextField
                                                                            label="Created By"
                                                                            value={this.props.item?.CreatedBy || ""}
                                                                            readOnly
                                                                        />
                                                                    </div>
                                                                    <div className={styles.fieldWrapper}>
                                                                        <TextField
                                                                            label="Created"
                                                                            value={this.props.item?.Created || ""}
                                                                            readOnly
                                                                        />
                                                                    </div>
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </PivotItem>
                                    </Pivot>


                                    {/* Footer Buttons */}
                                    <div className={styles.formFooter}>
                                        <DefaultButton text="Cancel" onClick={this.props.onClose} />
                                        <PrimaryButton
                                            text="Save"
                                            onClick={() => this.submitForm()}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
