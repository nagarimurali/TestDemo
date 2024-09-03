import React, { Component } from "react";

interface InputItem {
    ChildBaselineId: string | null;
    ContentType: string;
    DocumentId: string | null;
    SiteUrl: string;
    index: number;
    isSelected: boolean;
}

interface BaselineDataItem {
    BaselineStatus: string;
    CRID: string | null;
    ChangeRequest: string | null;
    Code: string | null;
    ContentType: string;
    DocId: string;
    DocumentId: string | null;
    DocumentStatus: string | null;
    ItemId: string;
    SiteUrl: string;
    Label: string | null;
}

interface TechnicalDataItem {
    BaselineStatus: string | null;
    CRID: string | null;
    ChangeRequest: string | null;
    Code: string | null;
    ContentType: string;
    DocId: string;
    DocumentId: string;
    DocumentStatus: string | null;
    ItemId: string;
    Label: string | null;
    ProjectReference: string | null;
    ProjectRevision: string | null;
}

interface State {
    baselineData: BaselineDataItem[];
    technicalData: TechnicalDataItem[];
    loading: boolean;
}

const InputData: InputItem[] = [
    {
        ChildBaselineId: "9",
        ContentType: "Baseline",
        DocumentId: null,
        SiteUrl: "https://alstomgrouppp.sharepoint.com/sites/DMS-DEV1",
        index: 1,
        isSelected: false
    },
    {
        ChildBaselineId: null,
        ContentType: "Technical Document",
        DocumentId: "CNK7JPPEYVHU-76372886-86",
        SiteUrl: "https://alstomgrouppp.sharepoint.com/sites/DMS-DEV1",
        index: 2,
        isSelected: false
    }
];

class DataChecker extends Component<{}, State> {
    private baseURL: string = "https://your-api-domain.com/api"; // Replace with your actual base URL

    constructor(props: {}) {
        super(props);
        this.state = {
            baselineData: [],
            technicalData: [],
            loading: true
        };
    }

    componentDidMount() {
        this.fetchData("baseline", "baselineData");
        this.fetchData("technical", "technicalData");
    }

    fetchData = async (endpoint: string, stateKey: "baselineData" | "technicalData") => {
        try {
            const response = await fetch(`${this.baseURL}/${endpoint}`);
            const data = await response.json();
            this.setState({ [stateKey]: data } as Pick<State, typeof stateKey>);
        } catch (error) {
            console.error(`Error fetching ${endpoint} data:`, error);
            alert(`Error fetching ${endpoint} data.`);
        } finally {
            this.setState({ loading: false });
        }
    };

    checkBaseline = async (item: InputItem): Promise<boolean> => {
        const matchingBaseline = this.state.baselineData.find(
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

    checkTechnicalDocument = async (item: InputItem): Promise<boolean> => {
        const matchingTechnical = this.state.technicalData.find(
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

    processInputData = async () => {
        const checks = InputData.map(item => {
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
        if (this.state.loading) {
            return <div>Loading data...</div>;
        }

        return (
            <div>
                <button onClick={this.processInputData}>Check Data</button>
            </div>
        );
    }
}

export default DataChecker;
