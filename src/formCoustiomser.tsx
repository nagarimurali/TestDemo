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


export interface IFormContainerState {
    title: string;
    managercomments: string;
    isPageLoading: boolean;
    isSaving: boolean;
    errorControls: IRequiredFields[];
    errorMessage?: string;
    qualification: string | undefined;
    employeeFirstName: string | undefined;
    absTerms?: { labels: { name: string; isDefault: boolean; languageTag: string }[]; id: string }[];
    isTouchedABS: boolean;
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
            isTouchedABS: false,
        };
    }

    public componentDidMount(): void {
        const { item, itemID } = this.props;
        if (itemID !== undefined) {
            const absTerms = item.ABS ? [{
                labels: [{
                    name: item.ABS.Label,
                    isDefault: true,
                    languageTag: 'en-US'
                }],
                id: item.ABS.TermGuid
            }] : [];

            this.setState({
                title: item.Title,
                qualification: item.Qualification,
                employeeFirstName: item.EmployeeFirstName,
                managercomments: this._sanitizeHtml(item.ManagerComments),
                absTerms: absTerms,

            });
        }
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
            isTouchedABS: true,
            errorControls: prevState.errorControls.filter(e => e.stateName !== "absTerms")
        }));
        this._validateField(fieldName, newValue);
    };

    private _validateField(fieldName: string, value: any[]): void {
        if (fieldName === 'ABS' && value.length === 0) {
            this.setState({
                errorControls: [...this.state.errorControls, { stateName: "absTerms", fieldName: "ABS" }],
                errorMessage: "ABS is required"
            });
        }
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
        const requiredFields: IRequiredFields[] = [
            { stateName: "title", fieldName: "Title" },
            { stateName: "qualification", fieldName: "Qualification" },
            { stateName: "employeeFirstName", fieldName: "Employee First Name" },
            { stateName: "absTerms", fieldName: "ABS" }
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

    private async submitForm(): Promise<void> {
        await this.validateFields();
        this.setState({ isSaving: true });

        try {
            const absValue = (this.state.absTerms ?? []).length > 0 ? {
                Label: this.state.absTerms?.[0]?.labels?.[0]?.name || "",
                TermGuid: this.state.absTerms?.[0]?.id,
                WssId: -1
            } : null;

            const createObject = {
                Title: this.state.title,
                ManagerComments: this.state.managercomments,
                EmployeeFirstName: this.state.employeeFirstName,
                Qualification: this.state.qualification,
                ABS: absValue
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

            const updateObject = {
                Title: this.state.title,
                ManagerComments: this.state.managercomments,
                EmployeeFirstName: this.state.employeeFirstName,
                Qualification: this.state.qualification,
                ABS: absValue
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
            <div className={styles.formWrapper}>

                <div className={`${styles.formOuterContainer} `}>
                    <div className={`${styles.formMidContainer} `}>
                        <div>
                            {this.state.isPageLoading ? (
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
                                                <ModernTaxonomyPicker
                                                    key={(this.state.absTerms && this.state.absTerms.length > 0) ? this.state.absTerms[0].id : "empty"}
                                                    allowMultipleSelections={false}
                                                    termSetId="7c70a5f2-e02e-4de6-ba74-eb4ab398376c"
                                                    panelTitle="Select ABS Category"
                                                    label="ABS"
                                                    context={this.props.context as any}
                                                    onChange={(terms) => this._onTaxPickerChange('absTerms', terms as any, 'ABS')}
                                                    required={true}
                                                    initialValues={this.state.absTerms as never}
                                                    disabled={this.props.displayMode === FormDisplayMode.Display}
                                                    termPickerProps={{ itemLimit: 1 }}
                                                />
                                                {/* 


                                                {/* <ModernTaxonomyPicker
                                                        allowMultipleSelections={false}
                                                        termSetId="7c70a5f2-e02e-4de6-ba74-eb4ab398376c"
                                                        panelTitle="Select ABS Category"
                                                        label="ABS"
                                                        context={this.props.context as any}
                                                        onChange={(terms) => this._onTaxPickerChange('absTerms', terms as any, 'ABS')}
                                                        required={true}
                                                        initialValues={this.state.absTerms as never}
                                                        disabled={this.props.displayMode === FormDisplayMode.Display}
                                                        termPickerProps={{ itemLimit: 1 }}
                                                        // errorMessage={this.state.errorControls.some(e => e.stateName === "absTerms")
                                                        //     ? "ABS is required"
                                                        //     : ""}
                                                    /> */}
                                                {/* <ModernTaxonomyPicker
                                                    
                                                        allowMultipleSelections={false} // Set based on your ABS field type
                                                        termSetId="7c70a5f2-e02e-4de6-ba74-eb4ab398376c" // Replace with actual TermSetId
                                                        panelTitle="ABSTest1"
                                                        label="ABS"
                                                        context={this.props.context as any}
                                                        onChange={this._handleABSTaxPickerChange}
                                                        required={true}
                                                        initialValues={this.state.absTerms.map(term => ({
                                                            id: term.id,
                                                            labels: term.labels.map(label => ({
                                                                name: label.name,
                                                                isDefault: true, // Set a default value
                                                                languageTag: "en-US" // Set a default language tag
                                                            }))
                                                        }))}
                                                        disabled={this.props.displayMode === FormDisplayMode.Display}
                                                        termPickerProps={{ itemLimit: 1 }} // For single selection
                                                        // errorMessage={this.state.errorControls.some(e => e.stateName === "absTerms") ? "ABS is required" : ""}
                                                        // className={this.state.errorControls.some(e => e.stateName === "absTerms") ? styles.required : ""}
                                                    /> */}
                                            </div>

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
                                                        className={this.state.errorControls.some(
                                                            (e) => e.stateName === "employeeFirstName"
                                                        )
                                                            ? styles.required
                                                            : ""
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
// 
import { IRequiredFields } from "../helper/QueryHelper";

export class BaselineHelper {


    public static checkRequiredFields = (
        currentStates: any,
        requiredFields: IRequiredFields[]
    ) => {
        const errorTargets: IRequiredFields[] = [];
        requiredFields.forEach((i) => {
            const stateCheck = currentStates[i.stateName];
            if (typeof currentStates[i.stateName] === "object" && i.stateName.toLocaleLowerCase().indexOf('object') > 0) {
                stateCheck.map((po: any, index: number) => {
                    i.fields?.map((flds) => {
                        const objectStateCheck = po[flds];
                        if (objectStateCheck === undefined || objectStateCheck === "" || objectStateCheck === null || objectStateCheck.length === 0) {
                            errorTargets.push({ stateName: i.stateName, fieldName: flds, index: index });
                        }
                    })
                })

            }
            else
                if (stateCheck === undefined || stateCheck === "" || stateCheck === null || stateCheck.length === 0) {
                    errorTargets.push({ stateName: i.stateName, fieldName: i.fieldName });
                }
        });
        if (errorTargets.length > 1) {
            throw {
                targetFields: errorTargets,
                message: "The below fields are required.",
            };
        } else if (errorTargets.length === 1) {
            throw {
                targetFields: errorTargets,
                message: 'The field "' + errorTargets[0].fieldName + '" is required',
            };
        }
    };

}
//
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { FormCustomizerContext } from "@microsoft/sp-listview-extensibility";
import { SPFI } from "@pnp/sp";
import { getSP } from "../pnpjs-config";
import "@pnp/sp/webs";
import "@pnp/sp/sites";
import "@pnp/sp/lists";
import "@pnp/sp/items";

class EmployeeService {

    private sp: SPFI;
    private context: FormCustomizerContext

    public async init(context: FormCustomizerContext) {
        if (!!context) {
            this.sp = getSP(context);
            this.context = context;
        }
        return this.sp;
    }
    public async getBaseLineContentTypeId() {
        if ('list' in this.context) {
            const cType = await this.sp.web.lists.getByTitle(this.context.list.title)();
            console.log(cType);


        }
    }
    public async createListItem<T extends Record<string, unknown>>(listTitle: string, object: T) {
        const i = await this.sp.web.lists.getByTitle(listTitle).items.add(object);
        return i;
    }
    public async updateListItem(listTitle: string, object: any, itemId: number) {
        const i = await this.sp.web.lists.getByTitle(listTitle).items.getById(itemId).update(object);
        return i;
    }

    // public static async updateListItem(listName: string, itemId: number, data: any): Promise<any> {
    //     try {
    //         const sp = getSP(); // Ensure SP context is initialized
    //         const result = await sp.web.lists.getByTitle(listName).items.getById(itemId).update(data);
    //         return result;
    //     } catch (error) {
    //         console.error("Error updating list item:", error);
    //         throw error;
    //     }
    // }
}
export default new EmployeeService();
