import * as React from 'react';
import styles from './PLOwnershipField.module.scss';
import { IDynamicFieldProps, IDynamicFieldState } from '../../components/DynamicFieldBase';
import { Constants } from '../../constants';
import { TaxonomyPicker, IPickerTerms } from 'react-taxonomypicker'; // Assuming you have this picker
import { sp } from "@pnp/sp/presets/all"; // PnP JS for SharePoint calls
import { SPHttpClient } from '@microsoft/sp-http';

// Define the interface for the field state
export interface IPLOwnershipFieldState extends IDynamicFieldState {
    isLoading: boolean;
    selectedPLOwnership: IPickerTerms; // Holds selected terms
    disabledTermIds: string[]; // To disable certain terms
}

// Define the field name constants
export const FieldNames = {
    PLOwnership: 'pl_owner_guid',
};

export default class PLOwnershipField extends React.Component<IDynamicFieldProps, IPLOwnershipFieldState> {
    constructor(props: IDynamicFieldProps) {
        super(props);
        this.state = {
            isLoading: false,
            selectedPLOwnership: [], // Initialize as an empty array
            disabledTermIds: []
        };
    }

    // Initialize the field by loading existing data if present
    componentDidMount(): void {
        this.initializeField();
    }

    // Initialize the field, e.g., load initial data or prepopulate state
    private async initializeField(): Promise<void> {
        this.setState({ isLoading: true });

        try {
            const fieldName = this.props.fieldInfo.InternalName;
            const result = await sp.web.lists.getByTitle(Constants.PROJECT_CONFIG_FIELDS_LIST)
                .items.getById(this.props.itemId)
                .select(fieldName)();

            if (result) {
                const terms = result[fieldName].split(';#').map((termString: string) => {
                    const [name, key] = termString.split('|');
                    return { name, key }; // Format for TaxonomyPicker
                });
                this.setState({ selectedPLOwnership: terms });
            }
        } catch (err) {
            console.error("Error initializing field: ", err);
        } finally {
            this.setState({ isLoading: false });
        }
    }

    // Fetch the taxonomy terms based on TermSetId (for disabling specific terms)
    private fetchTaxonomyTerms = async (termSetId: string): Promise<void> => {
        const spUrl = `${this.props.context.pageContext.web.absoluteUrl}/_api/v2.1/termStore/sets('${termSetId}')/terms`;

        try {
            const response = await this.props.context.httpClient.get(spUrl, SPHttpClient.configurations.v1);
            if (response.ok) {
                const data = await response.json();
                const disabledTermIds = data.value.filter((term: any) => this.state.disabledTermIds.includes(term.id));

                this.setState({ disabledTermIds });
            } else {
                throw new Error(response.statusText);
            }
        } catch (error) {
            console.error("Error fetching taxonomy terms: ", error);
        }
    };

    // Handle changes to the TaxonomyPicker selection
    private onTaxonomyPickerChange = (terms: IPickerTerms): void => {
        this.setState({ selectedPLOwnership: terms });
    };

    // Render method to display the component
    public render(): React.ReactElement<IDynamicFieldProps> {
        const { fieldInfo } = this.props;
        const disabled = fieldInfo.Disabled || fieldInfo.ReadOnlyField;

        return (
            <div className={styles.PLOwnershipField}>
                <TaxonomyPicker
                    allowMultipleSelections={true}
                    termSetId={fieldInfo.TermSetId}
                    panelTitle="PL Ownership"
                    label="PL Ownership"
                    context={this.props.context}
                    disabled={disabled}
                    disabledTermIds={this.state.disabledTermIds}
                    onChange={this.onTaxonomyPickerChange}
                    initialValues={this.state.selectedPLOwnership}
                />
            </div>
        );
    }
}
--------------------------------------------------------------

  import { SPFI } from "@pnp/sp";
import { SPHttpClient } from "@microsoft/sp-http";
import { IListItemFormUpdateValue } from '@pnp/sp/lists';

// Extend the field options for PLOwnershipField
additionalFieldOptions[FieldNames.PLOwnership] = {
    ...additionalFieldOptions[FieldNames.PLOwnership],
    renderer: (props) => (
        <PLOwnershipField
            {...props}
            ref={props.ref as React.RefObject<PLOwnershipField>}
        />
    ),
    presaveOperation: async (
        sp: SPFI,
        spHttpClient: SPHttpClient,
        ref: React.RefObject<PLOwnershipField>,
        values: IListItemFormUpdateValue[]
    ) => {
        if (!ref.current) {
            throw new Error("PLOwnershipField ref is not set");
        }

        const { selectedPLOwnership, hasChanged } = ref.current.state;

        if (!hasChanged) return; // If no change, return

        // Create the string in SharePoint Taxonomy format: TermName|TermGuid;#TermName2|TermGuid2
        const taxonomyValue = selectedPLOwnership.map(term => `${term.name}|${term.key}`).join(';#');

        // Find the corresponding field value for PLOwnership in the form data
        const plOwnershipFieldValue = values.find((v) => v.FieldName === FieldNames.PLOwnership);

        if (plOwnershipFieldValue) {
            plOwnershipFieldValue.FieldValue = taxonomyValue; // Save the formatted value
        }
    },
};
