/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @rushstack/no-new-null */
import * as React from "react";
import {
    Dropdown,
    IDropdownOption,
    TextField,
    PrimaryButton,
    DetailsList,
    Spinner,
    MessageBar,
    MessageBarType,
    IconButton,
    Stack
} from "@fluentui/react";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { SearchService } from "../service/SearchService";
import { columnsConfig } from "../constants/ColumnsConfig";
import { IListColumn } from "../interfaces/IListColumn";
import { ISearchResults } from "../interfaces/ISearchResults.ts";


interface ISearchState {
    columns: IListColumn[];
    selectedColumn: string;
    rows: { columnKey: string, query: string }[]; // Dynamic rows with selected column and query
    results: ISearchResults[];
    loading: boolean;
    error: string | null;
}

interface ISearchProps {
    context: WebPartContext;
    listName: string;
}

class SearchComponent extends React.Component<ISearchProps, ISearchState> {
    private searchService: SearchService;

    constructor(props: ISearchProps) {
        super(props);
        this.searchService = new SearchService(props.context, props.listName);

        this.state = {
            columns: [],
            selectedColumn: "",
            rows: [{ columnKey: "", query: "" }], // Initially one row
            results: [],
            loading: false,
            error: null,
        };
    }

    async componentDidMount() {
        try {
            const columns = await this.searchService.loadColumns();
            this.setState({ columns });
        } catch (error) {
            this.setState({ error: error.message });
        }
    }

    // handleSearch = async () => {
    //     const { rows, columns } = this.state;
    //     if (rows.some(row => !row.columnKey || !row.query)) return;

    //     this.setState({ loading: true, error: null, results: [] });

    //     try {
    //         let results: ISearchResults[] = [];
    //         for (const row of rows) {
    //             const selectedColumnInfo = columns.find(col => col.key === row.columnKey);
    //             if (!selectedColumnInfo) throw new Error("Selected column not found");

    //             let searchResults: ISearchResults[] = [];
    //             if (selectedColumnInfo.fieldType === "Lookup") {
    //                 searchResults = await this.searchService.handleLookupSearch(selectedColumnInfo, row.query);
    //             } else {
    //                 searchResults = await this.searchService.handleStandardSearch([{ columnName: row.columnKey, query: row.query }]);
    //             }

    //             results = [...results, ...searchResults];
    //         }

    //         this.setState({ results, loading: false });
    //     } catch (error) {
    //         this.setState({ error: error.message, loading: false });
    //     }
    // };
    handleSearch = async () => {
        const { rows, columns } = this.state;
        if (rows.some(row => !row.columnKey || !row.query)) return;

        this.setState({ loading: true, error: null, results: [] });

        try {
            // Collect all standard filters (non-lookup)
            const standardFilters = rows
                .filter(row => {
                    const column = columns.find(col => col.key === row.columnKey);
                    return column?.fieldType !== "Lookup"; // Exclude Lookup columns
                })
                .map(row => ({ columnName: row.columnKey, query: row.query }));

            // Collect Lookup filters
            const lookupFilters = rows
                .filter(row => {
                    const column = columns.find(col => col.key === row.columnKey);
                    return column?.fieldType === "Lookup";
                });

            let results: ISearchResults[] = [];

            // Handle standard filters (AND logic)
            if (standardFilters.length > 0) {
                const standardResults = await this.searchService.handleStandardSearch(standardFilters);
                results = standardResults;
            }

            // Handle Lookup filters (AND logic)
            if (lookupFilters.length > 0) {
                for (const row of lookupFilters) {
                    const column = columns.find(col => col.key === row.columnKey);
                    if (!column) throw new Error("Column not found");
                    const lookupResults = await this.searchService.handleLookupSearch(column, row.query);
                    // Merge results only if there are existing results
                    results = results.length > 0
                        ? results.filter(item => lookupResults.some(lr => lr.Id === item.Id))
                        : lookupResults;
                }
            }

            this.setState({ results, loading: false });
        } catch (error) {
            this.setState({ error: error.message, loading: false });
        }
    };

    handleColumnChange = (index: number, _event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
        const { rows } = this.state;
        rows[index].columnKey = option?.key.toString() || "";
        this.setState({ rows: [...rows] });
    };

    handleQueryChange = (index: number, _event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        const { rows } = this.state;
        rows[index].query = newValue || "";
        this.setState({ rows: [...rows] });
    };

    addRow = () => {
        const { rows } = this.state;
        this.setState({ rows: [...rows, { columnKey: "", query: "" }] });
    };

    removeRow = (index: number) => {
        const { rows } = this.state;
        rows.splice(index, 1);
        this.setState({ rows: [...rows] });
    };

    render() {
        const { columns, rows, results, loading, error } = this.state;
        const columnsWithAction = columnsConfig.map((column) => {
            if (column.key === "approvalDetails") {
                return {
                    ...column,
                    onRender: (item: ISearchResults) => {
                        // Construct the SharePoint list URL with filters
                        const siteUrl = this.props.context.pageContext.web.absoluteUrl;
                        const listName = encodeURIComponent(this.props.listName);
                        const titleFilter = encodeURIComponent(item.Title);

                        const listUrl = `${siteUrl}/Lists/${listName}/AllItems.aspx?FilterField1=LinkTitle&FilterValue1=${titleFilter}&FilterType1=Computed`;

                        return (
                            <PrimaryButton
                                text="Approval Details"
                                onClick={() => window.open(listUrl, "_blank")}
                            />
                        );
                    },
                };
            }
            return column;
        });

        return (
            <div className="search-container" style={{ padding: 20 }}>
                {/* Dynamic Rows */}
                {rows.map((row, index) => (
                    <Stack horizontal tokens={{ childrenGap: 10 }} style={{ margin: 14 }} verticalAlign="center" key={index}>
                        <Dropdown
                            placeholder="Select Column"
                            options={columns.map(c => ({ key: c.key, text: c.text }))}
                            selectedKey={row.columnKey}
                            onChange={(e, option) => this.handleColumnChange(index, e, option)}
                            styles={{ dropdown: { width: 200 } }}
                        />

                        <TextField
                            placeholder="Enter search value"
                            value={row.query}
                            onChange={(e, newValue) => this.handleQueryChange(index, e, newValue)}
                            disabled={!row.columnKey}
                            styles={{ root: { width: 250 } }}
                        />

                        <IconButton
                            iconProps={{ iconName: "Add" }}
                            title="Add"
                            onClick={this.addRow}
                        />

                        <IconButton
                            iconProps={{ iconName: "Remove" }}
                            title="Remove"
                            onClick={() => this.removeRow(index)}
                            disabled={rows.length <= 1} // Disable Remove for the last row
                        />
                    </Stack>
                ))}

                {/* Search Button */}
                <PrimaryButton
                    text="Search"
                    onClick={this.handleSearch}
                    disabled={rows.some(row => !row.columnKey || !row.query)} // Disable if any row is incomplete
                    styles={{ root: { marginTop: 15 } }}
                />

                {/* Loading Indicator */}
                {loading && <Spinner label="Searching..." />}

                {/* Error Message */}
                {error && (
                    <MessageBar messageBarType={MessageBarType.error} styles={{ root: { marginBottom: 15 } }}>
                        {error}
                    </MessageBar>
                )}

                {/* Search Results */}
                {results.length > 0 && (
                    <DetailsList
                        items={results}
                        columns={columnsWithAction}
                        isHeaderVisible={true}
                        styles={{ root: { marginTop: 20 } }}
                    />
                )}

                {/* No Results Message */}
                {!loading && !error && results.length === 0 && (
                    <MessageBar styles={{ root: { marginTop: 15 } }}>
                        No results found
                    </MessageBar>
                )}
            </div>
        );
    }
}

export default SearchComponent;
//------------------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
import { SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { IListColumn } from "../interfaces/IListColumn";
import { ISearchResults } from "../interfaces/ISearchResults.ts";


export class SearchService {
    private context: WebPartContext;
    private listName: string;

    constructor(context: WebPartContext, listName: string) {
        this.context = context;
        this.listName = listName;
    }

    async loadColumns(): Promise<IListColumn[]> {
        try {
            const listUrl = `${this.context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(this.listName)}')/fields?$filter=Hidden eq false and ReadOnlyField eq false`;
            const response = await this.context.spHttpClient.get(listUrl, SPHttpClient.configurations.v1);
            const data = await response.json();

            return data.value.map((field: any) => ({
                key: field.InternalName,
                text: field.Title,
                fieldType: field.TypeAsString,
                lookupListId: field.LookupList,
                lookupField: field.LookupField
            }));
        } catch (err) {
            throw new Error(`Failed to load columns: ${err.message}`);
        }
    }
//Update
   
    async handleLookupSearch(columnInfo: IListColumn, query: string): Promise<ISearchResults[]> {

        
        // if (!columnInfo.lookupListId) throw new Error("Lookup list ID not found for this column");

        // const lookupField = columnInfo.lookupField || 'Title';
        // const lookupListUrl = `${this.context.pageContext.web.absoluteUrl}/_api/web/lists(guid'${columnInfo.lookupListId}')/items?$filter=startswith(${lookupField}, '${query}')&$select=Id`;

        // const lookupResponse = await this.context.spHttpClient.get(lookupListUrl, SPHttpClient.configurations.v1);
        // const lookupData = await lookupResponse.json();

        if (!columnInfo.lookupListId) throw new Error("Lookup list ID not found");

        const lookupField = columnInfo.lookupField || 'Title';
        const lookupListUrl = `${this.context.pageContext.web.absoluteUrl}/_api/web/lists(guid'${columnInfo.lookupListId}')/items?$filter=substringof('${query}', ${lookupField})`; // Use substringof for partial matches

        const lookupResponse = await this.context.spHttpClient.get(lookupListUrl, SPHttpClient.configurations.v1);
        const lookupData = await lookupResponse.json();

        if (!lookupData.value || lookupData.value.length === 0) {
            throw new Error("No matching items found in the lookup list");
        }

        const lookupIds = lookupData.value.map((item: any) => item.Id).join(",");
        const searchUrl = `${this.context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('${this.listName}')/items?$select=Title,DocType/Title,Status,BU,PartNumber&$expand=DocType&$filter=${columnInfo.key}/Id in (${lookupIds})`;

        const response = await this.context.spHttpClient.get(searchUrl, SPHttpClient.configurations.v1);
        const data = await response.json();

        return data.value || [];
    }

    // async handleStandardSearch(columnName: string, query: string): Promise<ISearchResults[]> {
    //     const searchUrl = `${this.context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(this.listName)}')/items?$select=Title,DocType/Title,Status,BU,PartNumber&$expand=DocType`;

    //     const response = await this.context.spHttpClient.get(searchUrl, SPHttpClient.configurations.v1);
    //     const data = await response.json();

    //     return data.value.filter((item: any) =>
    //         item[columnName]?.toString().toLowerCase().includes(query.toLowerCase())
    //     );
    // }

    
    // async handleStandardSearch(filters: { columnName: string; query: string }[]): Promise<ISearchResults[]> {
    //     try {
    //         const searchUrl = `${this.context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(this.listName)}')/items?$select=Title,DocType/Title,Status,BU,PartNumber&$expand=DocType`;
    //         const response: SPHttpClientResponse = await this.context.spHttpClient.get(searchUrl, SPHttpClient.configurations.v1);
    //         const data = await response.json();

    //         // Apply AND logic: All filters must match
    //         const filteredResults = data.value.filter((item: any) =>
    //             filters.every(filter => {
    //                 const fieldValue = item[filter.columnName]?.toString().toLowerCase() || "";
    //                 const queryValue = filter.query.toLowerCase();
    //                 return fieldValue === queryValue; // Exact match
    //                 // return fieldValue.includes(queryValue); // For partial matches
    //             })
    //         );

    //         return filteredResults;
    //     } catch (error) {
    //         throw new Error(`Search failed: ${error.message}`);
    //     }
    // }
//Update
    async handleStandardSearch(filters: { columnName: string; query: string }[]): Promise<ISearchResults[]> {
        try {
            const searchUrl = `${this.context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(this.listName)}')/items?$select=Title,DocType/Title,Status,BU,PartNumber&$expand=DocType`;
            const response: SPHttpClientResponse = await this.context.spHttpClient.get(searchUrl, SPHttpClient.configurations.v1);
            const data = await response.json();

            // Case-insensitive partial matching (e.g., "bu" matches "BuTest", "TESTBU")
            const filteredResults = data.value.filter((item: any) =>
                filters.every(filter => {
                    const fieldValue = item[filter.columnName]?.toString().toLowerCase() || "";
                    const queryValue = filter.query.toLowerCase();
                    return fieldValue.includes(queryValue); // Partial match
                })
            );

            return filteredResults;
        } catch (error) {
            throw new Error(`Search failed: ${error.message}`);
        }
    }




}

