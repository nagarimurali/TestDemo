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
import { IRequiredFields } from '../../../../helper/QueryHelper';
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
import { getSP } from '../../../../pnpjs-config';
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
    absTermSetId: string | null; // Add state for ABS termSetId
    pbsTermSetId: string | null; // Add state for PBS termSetId
    fields: IFieldInfo[];
    isLoading:boolean// Add a state to store field information

}

export interface IFormContainerProps {
    context: FormCustomizerContext;
    displayMode: FormDisplayMode;
    onSave: () => void;
    onClose: () => void;
    itemID: number;
    item: any;
}

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
            employeeFirstName: "",
            absTerms: [],
            joiningDate: "", // Initialize the new state
            pbsTerms: [], // Initialize PBS state
            absTermSetId: null, // Initialize ABS termSetId
            pbsTermSetId: null, // Initialize PBS termSetId
            fields: [],
            isLoading:false// Initialize fieldInfos
        };
        this._sp = getSP(this.props.context);
    }

    public async componentDidMount(): Promise<void> {
        const { item, itemID } = this.props;
        this.setState({ isLoading: true });

        const [absTermSetId, pbsTermSetId] = await Promise.all([
            this._getTermSetId('ABS'),
            this._getTermSetId('PBS')
        ]);

        this.setState({
            absTermSetId,
            pbsTermSetId,
            isLoading: false
        });

        this._fetchFields(["Title", "EmployeeFirstName", "Qualification", "StartDate1", "ABS", "Manager", "ManagerComments"])
            .then(fields => {
                this.setState({ fields });
                console.log("Fields fetched successfully:", fields);
            })
            .catch(error => {
                console.error("Error fetching fields:", error);
            });
        console.log("DidMount", this.state);
        if (itemID !== undefined) {
            this.setState({
                title: item.Title,
                qualification: item.Qualification,
                employeeFirstName: item.EmployeeFirstName,
                managercomments: this._sanitizeHtml(item.ManagerComments),
                absTerms: this.createTaxonomyTerm(item.ABS),
                joiningDate: item.StartDate1 ? item.StartDate1.split('T')[0] : "",
                pbsTerms: this.createTaxonomyTerm(item.PBS),
            });
        }
    }

    private _getTermSetId = async (fieldName: string): Promise<string> => {
        const field = await this._sp.web.lists
            .getById(this.props.context.list.guid.toString())
            .fields.getByInternalNameOrTitle(fieldName)();

        return (field as any).TermSetId;
    };

    private async _fetchFields(fieldNames: string[]): Promise<IFieldInfo[]> {
        try {
            const list = this._sp.web.lists.getById(this.props.context.list.guid.toString());
            const fieldPromises = fieldNames.map(fieldName => list.fields.getByInternalNameOrTitle(fieldName)());
            const fields = await Promise.all(fieldPromises);
            return fields;
        } catch (error) {
            console.error("Error fetching fields:", error);
            throw error;
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


    private _onTaxPickerChange = (
        propertyName: string,
        newValue: { labels: { name: string; isDefault: boolean; languageTag: string }[]; id: string }[],
        fieldName: string
    ): void => {
        this.setState(prevState => ({
            ...prevState,
            [propertyName]: newValue,
            errorControls: prevState.errorControls.filter(e => e.stateName !== propertyName)
        }));
    };

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
        const requiredFields: IRequiredFields[] = [
            { stateName: "title", fieldName: "Title" },
            { stateName: "qualification", fieldName: "Qualification" },
            { stateName: "employeeFirstName", fieldName: "Employee First Name" },
            { stateName: "absTerms", fieldName: "ABS" },
         
        ];

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
                EmployeeFirstName: this.state.employeeFirstName,
                Qualification: this.state.qualification,
                ABS: this.getTaxonomyFieldValue(this.state.absTerms),
                StartDate1: this.state.joiningDate ? `${this.state.joiningDate}T00:00:00Z` : null, // Convert to ISO 8601 format
                PBS: this.getTaxonomyFieldValue(this.state.pbsTerms), // Include PBS in submission
            };

            await EmployeeService.createListItem(this.props.context.list.title, createObject);
            alert("Item Created Successfully");
            this.props.onSave();
        } catch (err) {
            this.setState({ isSaving: false });
            alert("Error creating item: " + err.message);
        }
    }
    private async UpdateForm(): Promise<void> {

        await this.validateFields();
        this.setState({ isSaving: true });
        try {
            const absValue = (this.state.absTerms ?? []).length > 0 ? {
                Label: this.state.absTerms?.[0]?.labels?.[0]?.name || "",
                TermGuid: this.state.absTerms?.[0]?.id,
                WssId: -1
            } : null;

            const pbsValue = (this.state.pbsTerms ?? []).length > 0 ? {
                Label: this.state.pbsTerms?.[0]?.labels?.[0]?.name || "",
                TermGuid: this.state.pbsTerms?.[0]?.id,
                WssId: -1
            } : null;

            const updateObject = {
                Title: this.state.title,
                ManagerComments: this.state.managercomments,
                EmployeeFirstName: this.state.employeeFirstName,
                Qualification: this.state.qualification,
                ABS: absValue,
                StartDate1: this.state.joiningDate ? `${this.state.joiningDate}T00:00:00Z` : null, // Convert to ISO 8601 format
                PBS: pbsValue, // Include PBS in update
            };
            await EmployeeService.updateListItem(this.props.context.list.title, updateObject, this.props.itemID);
            alert("Item Updated Successfully");
            this.props.onSave();
        } catch (err) {
            this.setState({ isSaving: false });
            alert("Error updating item: " + err.message);
            console.error(err);
        }
    }


    public render(): React.ReactElement<{}> {
        const options: IComboBoxOption[] = [
            { key: 'MSC', text: 'MSC' },
            { key: 'Degree', text: 'Degree' },
            { key: 'Intermediate', text: 'Intermediate' },
            { key: 'SSC', text: 'SSC' }]
        console.log("props", this.props);

        console.log("States", this.state);
        return (
            <div className={styles.formWrapper} >

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

                                    {/* Label & Status*/}
                                    <div className={styles.column}>
                                        <div className={styles.row}>
                                            <div className={styles.fieldWrapper}>
                                                <DmsFieldValidationWrapper
                                                    validationError={
                                                        this.state.errorControls.some(e => e.stateName === "absTerms")
                                                            ? "ABS is required"
                                                            : undefined
                                                    }
                                                >
                                                    <TooltipHost content="ABS" delay={TooltipDelay.long}>
                                                            {this.state.absTermSetId && <ModernTaxonomyPicker
                                                                key={(this.state.absTerms && this.state.absTerms.length > 0) ? this.state.absTerms[0].id : "empty"}
                                                                allowMultipleSelections={false}
                                                                termSetId={this.state.absTermSetId || ''}
                                                                panelTitle="Select ABS Category"
                                                                label="ABS"
                                                                context={this.props.context as any}
                                                                onChange={(terms) =>
                                                                    this._onTaxPickerChange('absTerms', terms as any, 'ABS')
                                                                }
                                                                required={true}
                                                                initialValues={this.state.absTerms as never}
                                                                disabled={this.props.displayMode === FormDisplayMode.Display}
                                                                termPickerProps={{ itemLimit: 1 }}
                                                            />
                                                            }
                                                    </TooltipHost>
                                                </DmsFieldValidationWrapper>


                                            </div>

                                            {/* <div className={styles.fieldWrapper}>
                                                <DmsFieldValidationWrapper
                                                    validationError={
                                                        this.state.errorControls.some(e => e.stateName === "pbsTerms")
                                                            ? "PBS is required"
                                                            : undefined
                                                    }
                                                >
                                                    <TooltipHost content="PBS" delay={TooltipDelay.long}>
                                                        <ModernTaxonomyPicker
                                                            key={(this.state.pbsTerms && this.state.pbsTerms.length > 0) ? this.state.pbsTerms[0].id : "empty"}
                                                            allowMultipleSelections={false}
                                                            termSetId={(this.state.fields.find(field => field.InternalName === "PBS") as IFieldInfo & { TermSetId: string })?.TermSetId || ""}
                                                            panelTitle="Select PBS Category"
                                                            label="PBS"
                                                            context={this.props.context as any}
                                                            onChange={(terms) =>
                                                                this._onTaxPickerChange('pbsTerms', terms as any, 'PBS')
                                                            }
                                                            required={true}
                                                            initialValues={this.state.pbsTerms as never}
                                                            disabled={this.props.displayMode === FormDisplayMode.Display}
                                                            termPickerProps={{ itemLimit: 1 }}
                                                        />
                                                    </TooltipHost>
                                                </DmsFieldValidationWrapper>
                                            </div> */}


                                            <div className={styles.fieldWrapper}>
                                                <TooltipHost content="Title" delay={TooltipDelay.long}>
                                                    <TextField
                                                        required
                                                        value={this.state.title}
                                                        label="Title"
                                                        placeholder="Title"
                                                        onChange={(
                                                            event: React.FormEvent<
                                                                HTMLInputElement | HTMLTextAreaElement
                                                            >,
                                                            newValue: string
                                                        ) => this.onTextChange("title", newValue)}
                                                        className={this.state.errorControls.some(
                                                            (e) => e.stateName === "title"
                                                        )
                                                            ? styles.required
                                                            : ""
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
                                                            event: React.FormEvent<
                                                                HTMLInputElement | HTMLTextAreaElement
                                                            >,
                                                            newValue: string
                                                        ) => this.onTextChange("employeeFirstName", newValue)}
                                                        errorMessage={
                                                            this.state.errorControls.some(e => e.stateName === "employeeFirstName")
                                                                ? "Qualification is required"
                                                                : undefined
                                                        }


                                                    />
                                                </TooltipHost>
                                            </div>
                                            <div className={styles.fieldWrapper}>
                                                <TooltipHost content="Qualification" delay={TooltipDelay.long}>
                                                    {/* <ComboBox
                                                        label="Qualification"
                                                        required
                                                        placeholder="Select a Qualification"
                                                        options={options}
                                                        selectedKey={this.state.qualification}
                                                        onChange={(
                                                            event: React.FormEvent<IComboBox>,
                                                            option?: IComboBoxOption
                                                        ) => this.onTextChange("qualification", option?.key as string)}
                                                        className={this.state.errorControls.some(
                                                            (e) => e.stateName === "qualification"
                                                        )
                                                            ? styles.required
                                                            : ""
                                                        }


                                                    /> */}

                                                    <ComboBox
                                                        label="Qualification"
                                                        required
                                                        placeholder="Select a Qualification"
                                                        options={options}
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
                                                        className={
                                                            this.state.errorControls.some(e => e.stateName === "qualification")
                                                                ? styles.required
                                                                : ""
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

                                            <div className={styles.fieldWrapper}>&nbsp;</div>
                                        </div>
                                    </div>
                                    <div className={styles.column}>
                                        <div className={styles.row}>
                                            <div className={styles.fieldWrapper}>
                                                <TooltipHost
                                                    content="Manager Comments"
                                                    delay={TooltipDelay.long}
                                                >
                                                    <TextField
                                                        value={this.state.managercomments}
                                                        label="Comments"
                                                        placeholder="comments"
                                                        multiline={true}
                                                        rows={5}
                                                        // disabled={
                                                        //   this.state.currentMode === "New" ? false : true
                                                        // }
                                                        onChange={(
                                                            event: React.FormEvent<
                                                                HTMLInputElement | HTMLTextAreaElement
                                                            >,
                                                            newValue: string
                                                        ) => this.onTextChange("managercomments", newValue)}
                                                    />
                                                </TooltipHost>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Linked Items Content*/}


                                    {/* Footer Button section */}
                                    <div className={styles.formFooter}>
                                        <DefaultButton text="Cancel" onClick={this.props.onClose} />
                                        <PrimaryButton
                                            text="Save"
                                            // onClick={()=>this.submitForm()}
                                            onClick={
                                                this.props.itemID === undefined
                                                    ? this.submitForm.bind(this)
                                                    : this.UpdateForm.bind(this)
                                            }
                                        // disabled={this.state.isSaving}
                                        >
                                            Save
                                            {/* {this.state.isSaving && (
                                                <Spinner
                                                    size={SpinnerSize.small}
                                                    className={styles.spinnerIcon}
                                                />
                                            )} */}
                                        </PrimaryButton>
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
