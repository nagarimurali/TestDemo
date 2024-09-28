/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @rushstack/no-new-null */
import * as React from 'react';
import styles from './ProjectPLOwnershipField.module.scss';
import DmsDynamicFieldBase, { IDmsDynamicFieldProps, IDmsDynamicFieldState } from '../../components/DmsDynamicFieldBase';
import { FieldNames } from '../../../../constants';
import { IFieldInfo } from '@pnp/sp/fields';
import {
  TaxonomyPicker,
  IPickerTerms
} from '@pnp/spfx-controls-react';
import {
  HttpClient, HttpClientResponse, IHttpClientOptions,
} from '@microsoft/sp-http';

export interface IPLOwnershipFieldValue {
  value?: string;

}
export interface IProjectMetadata {
  dms_x005f_pl_x005f_owner_x005f_guid: string;
  dms_x005f_pl_x005f_owner_x005f_display: string;
}
const PROPERTY_BAG_NAMES = [

  "dms_pl_owner_guid",
  "dms_pl_owner_display",

];
const PROJECT_CONFIG_FIELDS = [
  FieldNames.PLOwnership
];
export interface IPLOwnershipFieldState extends IDmsDynamicFieldState {
  value: any;
  hasChanged: boolean;
  internalValue: IPLOwnershipFieldValue;
  fieldInfos?: { [key: string]: IFieldInfo & { TermSetId: string } };
  plOwnershipTerms?: { labels: { name: string, isDefault: boolean, languageTag: string }[], id: string }[];
  plOwnershipallTerms?: { labels: { name: string, isDefault: boolean, languageTag: string }[], id: string }[];
  disabledTermIds?: string[];
  selectedPlOwnership: IPickerTerms;
  testPlO?: string | null
}
export default class PLOwnershipField extends DmsDynamicFieldBase<IPLOwnershipFieldState> {

  constructor(props: IDmsDynamicFieldProps) {
    super(props);

    this.state = {
      selectedPlOwnership: [],
      isLoading: true,
      value: '',
      hasChanged: false,
      internalValue: { value: '' },
      disabledTermIds: [],
      testPlO: '',
      plOwnershipallTerms: []
    };

  }

  public componentDidMount(): void {

    console.log("value", this.state.value);
    const isEditForm = !!this.props.context.item?.ID;

    const [batch, execute] = this._sp.batched();
    Promise.all([
      Promise.all(PROJECT_CONFIG_FIELDS.map((fieldName) => batch.web.fields.getByInternalNameOrTitle(fieldName)())),
      batch.web.allProperties.select(...PROPERTY_BAG_NAMES)() as Promise<IProjectMetadata>,
      isEditForm ? this._getSharePointItemTerms() : Promise.resolve(null)
    ]).then(([fieldInfoArray, propertyBags, listItemTerms]) => {
      const plOwnershipLabels = propertyBags.dms_x005f_pl_x005f_owner_x005f_display ? propertyBags.dms_x005f_pl_x005f_owner_x005f_display.split('|') : [];
      const plOwnershipIds = propertyBags.dms_x005f_pl_x005f_owner_x005f_guid ? propertyBags.dms_x005f_pl_x005f_owner_x005f_guid.split('|') : [];
      console.log("plOwnershipLabels", plOwnershipLabels);
      console.log("plOwnershipIds", plOwnershipIds);
      const plOwnershipTerms = plOwnershipLabels.map((label, i) => ({ labels: [{ name: label, isDefault: true, languageTag: "en-US" }], id: plOwnershipIds[i] }));
      const plOwnershipTermIds = plOwnershipTerms.map(term => term.id);
      console.log("plOwnershipTerms", plOwnershipTerms)
      console.log("PL Ownership Term IDs:", plOwnershipTermIds);
      // const fieldInfos = fieldInfoArray.reduce((acc, fieldInfo) => {
      //   acc[fieldInfo.InternalName] = fieldInfo;
      //   return acc;
      // }, {} as { [key: string]: IFieldInfo });

      this.setState({
        // fieldInfos,
        plOwnershipTerms,
      }, () => {

        this.fetchTaxonomyTerms(plOwnershipTermIds);
      });
    }).catch(err => {

      this.setState({ isLoading: false });
      console.error(err);
      console.log(err);

    });
    execute().catch(err => {

      this.setState({ isLoading: false });
      console.error(err);
      console.log(err);

    });
    if (super.componentDidMount) super.componentDidMount();
    // this.initializeField();
    // this.fetchTaxonomyTerms();
  }
  private onTaxonomyPickerChange = (terms: IPickerTerms): void => {
    alert("okK")
    console.log("terms", terms);
    const testterm = terms.map((item) => item.key)
    console.log("testterm", testterm)
    if (testterm && testterm.length > 0) {
      this.fetchTaxonomyTerms1(testterm)
    }
    this.setState({
      selectedPlOwnership: terms,
      hasChanged: true
    });

  }

  private _getSharePointItemTerms(): Promise<any[]> {
    const listTitle = this.props.context.pageContext.list?.title;
    const itemId = this.props.context.item?.ID;
    if (!itemId) {
      console.error("Item ID not found.");
      return Promise.resolve([]);
    }
    const spurl = this.props.context.pageContext.web.absoluteUrl;
    const requestUrl = `${spurl}/_api/web/lists/getByTitle('${listTitle}')/items(${itemId})?$select=PLOwnership`;
    alert(requestUrl)
    console.log("Requrl", requestUrl);
    const httpClientOptions: IHttpClientOptions = {
      headers: {
        'Accept': 'application/json;odata=nometadata'
      }
    };
    return this.props.context.httpClient.get(requestUrl, HttpClient.configurations.v1, httpClientOptions)
      .then((response: HttpClientResponse): Promise<any> => {

        if (response.ok) {
          return response.text();
        } else {
          console.log("Failed to fetch SharePoint item terms. Status:", response.status);
          return Promise.reject(new Error(response.statusText));
        }
      })
      .then((responseText) => {
        const trimmedResponse = responseText.trim();
        if (trimmedResponse.startsWith('{') || trimmedResponse.startsWith('[')) {
          // Response is likely JSON
          try {
            const jsonResponse = JSON.parse(responseText);
            console.log("Response is in JSON format.");

            if (jsonResponse.PLOwnership) {
              const termGuid = jsonResponse.PLOwnership.TermGuid;
              this.fetchTaxonomyTerms1(termGuid)
              console.log("TermGuid from JSON:", termGuid);
              alert("TermGuid from JSON: " + termGuid);
              this.setState({
                testPlO: termGuid
              })
              return [{
                key: termGuid,
                name: '',
                path: '',
                termSet: `${(this.props.fieldInfo as IFieldInfo & { TermSetId: string }).TermSetId}`
              }];
            } else {
              console.error("PLOwnership not found in JSON.");
            }
          } catch (error) {
            console.error("Error parsing JSON response:", error);
          }
        } else {
          // Response is likely XML, parse it accordingly
          console.log("Response is in XML format.");

          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(responseText, "application/xml");

          // Get the 'd:PLOwnership' node
          const plOwnershipNode = xmlDoc.getElementsByTagName("d:PLOwnership")[0];

          if (plOwnershipNode) {
            // Get the 'd:TermGuid' node inside 'd:PLOwnership'
            const termGuidNode = plOwnershipNode.getElementsByTagName("d:TermGuid")[0];

            if (termGuidNode) {
              const termGuid = termGuidNode.textContent;

              if (termGuid) {
                this.fetchTaxonomyTerms1([termGuid]); 
              } this.setState({ testPlO: termGuid })
              alert("TermGuid from XML: " + termGuid);
            } else {
              console.error("TermGuid not found in XML response.");
            }
          } else {
            console.error("PLOwnership node not found in XML response.");
          }
        }

        return [];
      })
      .catch((error) => {
        console.log(error);
        console.error("Error fetching PLOwnership terms from SharePoint list:", error);
        return [];
      });
  }
  public render(): React.ReactElement<{}> {
    const { plOwnershipTerms, fieldInfos, disabledTermIds, plOwnershipallTerms } = this.state;
    const { fieldInfo, disabled: propsDisabled } = this.props;
    const disabled = propsDisabled || fieldInfo.ReadOnlyField;
    console.log("Fieldinfo", fieldInfo);
    
    console.log("plOwnershipallTerms", plOwnershipallTerms);

    const filtestPlO = plOwnershipallTerms ? plOwnershipallTerms.filter((item) => item.id === this.state.testPlO) : []
    const initialValues = filtestPlO ? filtestPlO.map(term => ({
      key: term.id,
      name: term.labels[0].name,
      path: '',
      termSet: `${(fieldInfo as IFieldInfo & { TermSetId: string }).TermSetId}`
    })) : [];
    console.log("this.state.selectedPlOwnership" + this.state.selectedPlOwnership)
    console.log("initialValues", initialValues)
    console.log("PLOwnership", plOwnershipTerms);
    return (
      <div className={styles.ProjectPLOwnershipField}>
        {fieldInfos && plOwnershipTerms && plOwnershipTerms.length > 0 && (
          <TaxonomyPicker
            allowMultipleSelections={false}
            termsetNameOrID={`${
              (fieldInfo as IFieldInfo & { TermSetId: string }).TermSetId
            }`}
            required={true}
            panelTitle="PL Ownership"
            label={`${fieldInfo.Title}`}
            context={this.props.context as any}
            isTermSetSelectable={false}
            disabledTermIds={disabledTermIds}
            disabled={disabled}
            onChange={this.onTaxonomyPickerChange}
            initialValues={
              this.state.hasChanged
                ? this.state.selectedPlOwnership
                : initialValues
            }
          />
        )}
      </div>
    );
  }
  private fetchTaxonomyTerms(plOwnershipTermIds: string[]): void {
    const termSetId = `${
      (this.props.fieldInfo as IFieldInfo & { TermSetId: string }).TermSetId
    }`;
    console.log("Props", this.props.context.pageContext.web.absoluteUrl);
    const spurl = this.props.context.pageContext.web.absoluteUrl;
    const requestUrl = `${spurl}/_api/v2.1/termStore/sets/${termSetId}/terms`;

    this.props.context.httpClient.get(requestUrl, HttpClient.configurations.v1)
      .then((response: HttpClientResponse): Promise<{ value: any[] }> => {
        if (response.ok) {
          return response.json();
        } else {
          return Promise.reject(new Error(response.statusText));
        }
      })
      .then((data) => {
        console.log("Fetched child terms from term store:", data.value);
        const allTermsValue = data.value.map((terms) => ({
          id: terms.id,
          labels: terms.labels.map((label: any) => ({
            name: label.name,
            isDefault: true,
            languageTag: "en-US"

          }))

        }));
        console.log("allTermsValue", allTermsValue);

        this.setState({
          plOwnershipallTerms: allTermsValue
        })

        const disabledTermIds = data.value
          .filter(term => !plOwnershipTermIds.includes(term.id))
          .map(term => term.id);
        console.log("Disabled term IDs:", disabledTermIds);
        this.setState({
          disabledTermIds
        });
      })

      .catch(error => {
        console.error("Error fetching taxonomy terms: ", error);
      });
  }

  private fetchTaxonomyTerms1(plOwnershipTermIds: string[]): void {
    const termSetId = `${
      (this.props.fieldInfo as IFieldInfo & { TermSetId: string }).TermSetId
    }`;
    console.log("Props", this.props.context.pageContext.web.absoluteUrl);
    const spurl = this.props.context.pageContext.web.absoluteUrl;
    const requestUrl = `${spurl}/_api/v2.1/termStore/sets/${termSetId}/terms`;
    this.props.context.httpClient.get(requestUrl, HttpClient.configurations.v1)
      .then((response: HttpClientResponse): Promise<{ value: any[] }> => {
        if (response.ok) {
          return response.json();
        } else {
          return Promise.reject(new Error(response.statusText));
        }
      })
      .then((data) => {
        const filteredTerms = data.value.filter(term =>
          plOwnershipTermIds.includes(term.id)
        );
        console.log("Filtered matching terms Test23:", filteredTerms);
        console.log("Fetched child terms from term store:", data.value);
        this.setState({
          value: filteredTerms
        });
      })
      .catch(error => {
        console.error("Error fetching taxonomy terms: ", error);
      });
  }


  // public async initializeField(): Promise<void> {
  //   const { value } = this.props;
  //   this.setState({
  //     isLoading: false,
  //     value: value as string,
  //     hasChanged: false,
  //   });
  // }

}
