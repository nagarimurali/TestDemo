import { sp } from "@pnp/sp/presets/all";

export type BaselineDataType = {
    BaselineStatus: "Frozen" | "Ongoing";
    CRID: string;
    ChangeRequest: string | null;
    Code: string;
    ContentType: "Baseline";
    DocId: string;
    DocumentId: string | null;
    DocumentStatus: string | null;
    ItemId: string;
    SiteUrl: string;
    Label: string;
};

export type TechnicalDataType = {
    BaselineStatus: string | null;
    CRID: string | null;
    ChangeRequest: string | null;
    Code: string | null;
    ContentType: "Technical Document";
    DocId: string;
    DocumentId: string;
    DocumentStatus: "Under Review" | "Applicable";
    ItemId: string;
    Label: string | null;
    ProjectReference: string;
    ProjectRevision: string;
};

export default class DataService {
    public async fetchBaselineData(): Promise<BaselineDataType[]> {
        // Example REST API call to fetch baseline data
        const baselineItems: any[] = await sp.web.lists.getByTitle("BaselineList").items.getAll();
        return baselineItems.map(item => ({
            BaselineStatus: item.BaselineStatus,
            CRID: item.CRID,
            ChangeRequest: item.ChangeRequest,
            Code: item.Code,
            ContentType: "Baseline",
            DocId: item.DocId,
            DocumentId: item.DocumentId,
            DocumentStatus: item.DocumentStatus,
            ItemId: item.Id,
            SiteUrl: item.SiteUrl,
            Label: item.Label
        }));
    }

    public async fetchTechnicalData(): Promise<TechnicalDataType[]> {
        // Example REST API call to fetch technical document data
        const technicalItems: any[] = await sp.web.lists.getByTitle("TechnicalDocumentsList").items.getAll();
        return technicalItems.map(item => ({
            BaselineStatus: item.BaselineStatus,
            CRID: item.CRID,
            ChangeRequest: item.ChangeRequest,
            Code: item.Code,
            ContentType: "Technical Document",
            DocId: item.DocId,
            DocumentId: item.DocumentId,
            DocumentStatus: item.DocumentStatus,
            ItemId: item.Id,
            Label: item.Label,
            ProjectReference: item.ProjectReference,
            ProjectRevision: item.ProjectRevision
        }));
    }
}
/__________________________________________________________________


import * as React from 'react';
import DataService, { BaselineDataType, TechnicalDataType } from '../services/DataService'; // Adjust the path as necessary

type InputDataType = {
    ChildBaselineId: string | null;
    ContentType: "Baseline" | "Technical Document";
    DocumentId: string | null;
    SiteUrl: string;
    index: number;
    isSelected: boolean;
    Title?: string;
};

interface IState {
    baselineData: BaselineDataType[];
    technicalData: TechnicalDataType[];
    loading: boolean;
}

class DataChecker extends React.Component<{}, IState> {
    private dataService: DataService;

    constructor(props: {}) {
        super(props);
        this.dataService = new DataService();
        this.state = {
            baselineData: [],
            technicalData: [],
            loading: true
        };
    }

    async componentDidMount() {
        try {
            const baselineData = await this.dataService.fetchBaselineData();
            const technicalData = await this.dataService.fetchTechnicalData();
            this.setState({ baselineData, technicalData, loading: false });
        } catch (error) {
            console.error("Error fetching data", error);
            this.setState({ loading: false });
        }
    }

    checkBaseline = async (item: InputDataType): Promise<boolean> => {
        const { baselineData } = this.state;
        const matchingBaseline = baselineData.find(
            baseline => baseline.ItemId === item.ChildBaselineId && baseline.SiteUrl === item.SiteUrl
        );
        if (matchingBaseline) {
            if (matchingBaseline.BaselineStatus === "Frozen") {
                console.log("Baseline data check passed: Frozen status found");
                return true;
            } else {
                alert("Error: Baseline status is not Frozen.");
                return false;
            }
        } else {
            alert("Error: Matching Baseline data not found.");
            return false;
        }
    };

    checkTechnicalDocument = async (item: InputDataType): Promise<boolean> => {
        const { technicalData } = this.state;
        const matchingTechnical = technicalData.find(
            technical => technical.DocumentId === item.DocumentId
        );
        if (matchingTechnical) {
            if (matchingTechnical.DocumentStatus === "Applicable") {
                console.log("Technical Document check passed: Applicable status found");
                return true;
            } else {
                alert("Error: Technical Document status is not Applicable.");
                return false;
            }
        } else {
            alert("Error: Matching Technical Document data not found.");
            return false;
        }
    };

    processInputData = async (inputData: InputDataType[]): Promise<void> => {
        const checks = inputData.map(item => {
            if (item.ContentType === "Baseline") {
                return this.checkBaseline(item);
            } else if (item.ContentType === "Technical Document") {
                return this.checkTechnicalDocument(item);
            } else {
                alert("Error: Unsupported ContentType.");
                return false;
            }
        });

        const results = await Promise.all(checks);

        if (results.every(result => result === true)) {
            console.log("All checks passed, data success saved.");
        } else {
            console.log("One or more checks failed, data not saved.");
        }
    };

    render() {
        const { loading } = this.state;
        return (
            <div>
                {loading ? (
                    <p>Loading data...</p>
                ) : (
                    <button onClick={() => this.processInputData(InputData)}>Check Data</button>
                )}
            </div>
        );
    }
}

export default DataChecker;
