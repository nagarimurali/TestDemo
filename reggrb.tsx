type InputDataType = {
    ChildBaselineId: string | null;
    ContentType: "Baseline" | "Technical Document";
    DocumentId: string | null;
    SiteUrl: string;
    index: number;
    isSelected: boolean;
    Title?: string;
};

type BaselineDataType = {
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

type TechnicalDataType = {
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
