import * as React from "react";
import {
  TextField,
  Dropdown,
  IDropdownOption,
  IIconProps,
  Stack,
  FontIcon,
  Icon,
  DefaultButton,
  PrimaryButton,
} from "@fluentui/react";
import styles from "./TransmittalDetailTab.module.scss";
import {
  getFileTypeIconProps,
  initializeFileTypeIcons,
} from "@fluentui/react-file-type-icons";

initializeFileTypeIcons();

export interface ITransmittalDocument {
  docChildItems?: ITransmittalDocument[];
  docId?: string;
  name: string;
  type: "folder" | "file";
  url?: string;
  filetype?: string;
  children?: ITransmittalDocument[];
  id?: string;
}

export interface ITransmittal {
  id: string;
  name: string;
  status: "Pending" | "Approved" | "Rejected";
  deliveryDate: string;
  feedbackDate?: string;
  documents: ITransmittalDocument[];
}

interface ITransmittalDetailTabProps {
  transmittal: ITransmittal;
  onBack: () => void;
}

interface ITransmittalDetailTabState {
  expandedDocs: { [key: string]: boolean };
  checkStatuses: { [key: string]: "Approved" | "Rejected" | "" };
  comments: { [docId: string]: string };
  isFinalized: boolean;
}

const statusOptions: IDropdownOption[] = [
  { key: "Approved", text: "Approved" },
  { key: "Rejected", text: "Rejected" },
];

const backIcon: IIconProps = { iconName: "ChevronLeft" };

class TransmittalDetailTab extends React.Component<
  ITransmittalDetailTabProps,
  ITransmittalDetailTabState
> {
  constructor(props: ITransmittalDetailTabProps) {
    super(props);
    this.state = {
      expandedDocs: {},
      checkStatuses: {},
      comments: {},
      isFinalized: false,
    };
  }

  toggleExpand = (docId: string): void => {
    this.setState((prevState) => ({
      expandedDocs: {
        ...prevState.expandedDocs,
        [docId]: !prevState.expandedDocs[docId],
      },
    }));
  };

  handleStatusChange = (docId: string, option?: IDropdownOption): void => {
    if (!option) return;
    this.setState((prevState) => ({
      checkStatuses: {
        ...prevState.checkStatuses,
        [docId]: option.key as "Approved" | "Rejected",
      },
    }));
  };

  handleView = (url: string) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  handleDownload = (url: string, filename: string) => {
    if (!url) return;

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  handleCommentChange = (docId: string, value?: string) => {
    this.setState((prevState) => ({
      comments: {
        ...prevState.comments,
        [docId]: value || "",
      },
    }));
  };

  // Derive Coversheet status
  getCoversheetStatus = (): "Approved" | "Rejected" | "" => {
    const { checkStatuses } = this.state;
    const { documents } = this.props.transmittal;

    const childDocs = documents[0]?.docChildItems?.slice(1); // skip coversheet

    if (!childDocs || childDocs.length === 0) return "";

    const statuses = childDocs.map((doc: any) => checkStatuses[doc.id] || "");
    if (statuses.includes("Rejected")) return "Rejected";
    if (statuses.length > 0 && statuses.every((s) => s === "Approved"))
      return "Approved";
    return "";
  };

  handleFinalize = () => {
    if (window.confirm("Are you sure you want to finalize approval?")) {
      this.setState({ isFinalized: true });
      // 🔗 API call could be added here
    }
  };

  render() {
    const { transmittal, onBack } = this.props;
    const { checkStatuses, comments, isFinalized } = this.state;

    const coversheet = transmittal.documents[0]?.docChildItems?.[0]; // first file
    const otherDocs = transmittal.documents[0]?.docChildItems?.slice(1) || [];

    return (
      <div className={styles.container}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <DefaultButton
            style={{ minWidth: "0px", padding: "0px 4px" }}
            iconProps={backIcon}
            onClick={onBack}
          >
            Back
          </DefaultButton>
        </div>

        <Stack
          className={styles.fileContainer}
          horizontal
          verticalAlign="center"
          tokens={{ childrenGap: 12 }}
        >
          <Icon iconName="ZipFolder" style={{ fontSize: 20 }} />
          <span className={styles.fileName}>{transmittal.name}</span>
          <DefaultButton
            onRenderText={() => (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                Download package
                <Icon iconName="Download" />
              </span>
            )}
          />
        </Stack>

        <div className={styles.docContainer}>
          {/* Coversheet row */}
          {coversheet && (
            <Stack
              horizontal
              verticalAlign="center"
              tokens={{ childrenGap: 12 }}
              style={{ marginBottom: "10px", paddingBottom: "10px" }}
            >
              <Stack.Item grow={2}>
                <Icon
                  {...getFileTypeIconProps({
                    extension: coversheet.name.split(".").pop(),
                    size: 24,
                    imageFileType: "png",
                  })}
                />
                <span style={{ fontWeight: 600, marginLeft: "3px" }}>
                  {coversheet.name} (Coversheet)
                </span>
                <div className={styles.xlsxIcons}>
                  <Icon
                    iconName="View"
                    title="View"
                    style={{ cursor: "pointer", marginRight: "4px" }}
                    onClick={() => this.handleView(coversheet.url!)}
                  />
                  <Icon
                    iconName="Download"
                    title="Download"
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      this.handleDownload(
                        coversheet.url!,
                        coversheet.name || "download"
                      )
                    }
                  />
                </div>
              </Stack.Item>
              <Stack.Item grow={1}>
                <Dropdown
                  options={statusOptions}
                  selectedKey={this.getCoversheetStatus()}
                  disabled
                />
              </Stack.Item>
            </Stack>
          )}

          {/* Other documents */}
          {otherDocs.map((doc: any) => {
            const checkStatuse = checkStatuses[doc.id] || "";

            if (doc.type === "file") {
              // Render file
              return (
                <Stack
                  key={doc.id}
                  horizontal
                  verticalAlign="center"
                  tokens={{ childrenGap: 12 }}
                  style={{ marginBottom: "10px", paddingBottom: "10px" }}
                >
                  <Stack.Item grow={2}>
                    <Icon
                      {...getFileTypeIconProps({
                        extension: doc.name.split(".").pop(),
                        size: 24,
                        imageFileType: "png",
                      })}
                    />
                    <span style={{ fontWeight: 600, marginLeft: "3px" }}>
                      {doc.name}
                    </span>
                    <div className={styles.xlsxIcons}>
                      <Icon
                        iconName="View"
                        title="View"
                        style={{ cursor: "pointer", marginRight: "4px" }}
                        onClick={() => this.handleView(doc.url!)}
                      />
                      <Icon
                        iconName="Download"
                        title="Download"
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          this.handleDownload(doc.url!, doc.name || "download")
                        }
                      />
                    </div>
                  </Stack.Item>
                  <Stack.Item grow={1}>
                    <Dropdown
                      options={statusOptions}
                      placeholder="Status"
                      className={styles.ddlStatus}
                      selectedKey={checkStatuse || undefined}
                      onChange={(_, option) =>
                        this.handleStatusChange(doc.id, option)
                      }
                      disabled={isFinalized}
                    />
                  </Stack.Item>
                  <Stack.Item grow={3}>
                    <TextField
                      className={styles.txtComments}
                      placeholder="Comment(s)"
                      value={comments[doc.id] || ""}
                      onChange={(_, val) =>
                        this.handleCommentChange(doc.id, val)
                      }
                      disabled={isFinalized}
                    />
                  </Stack.Item>
                </Stack>
              );
            }

            if (doc.type === "folder") {
              // Render folder
              return (
                <div
                  key={doc.id}
                  style={{ paddingBottom: 10, marginBottom: 10 }}
                >
                  <Stack
                    horizontal
                    verticalAlign="center"
                    tokens={{ childrenGap: 12 }}
                  >
                    <Stack.Item grow={2}>
                      <Icon iconName="FabricFolder" />
                      <span style={{ fontWeight: 600, marginLeft: "3px" }}>
                        {doc.name}
                      </span>
                      <Icon
                        iconName={
                          this.state.expandedDocs[doc.id]
                            ? "ChevronUp"
                            : "ChevronDown"
                        }
                        onClick={() => this.toggleExpand(doc.id)}
                        style={{ minWidth: 0, padding: 4, cursor: "pointer" }}
                      />
                    </Stack.Item>
                  </Stack>

                  {this.state.expandedDocs[doc.id] && (
                    <div className={styles.childContainer}>
                      <Stack
                        horizontal
                        wrap
                        tokens={{ childrenGap: 10 }}
                        styles={{ root: { padding: 8 } }}
                      >
                        {doc.children?.map((file: any) => {
                          const childStatus =
                            checkStatuses[file.id] || undefined;
                          return (
                            <Stack.Item
                              key={file.id}
                              grow
                              className={styles.childFileItems}
                            >
                              <Icon
                                {...getFileTypeIconProps({
                                  extension: file.name.split(".").pop(),
                                  size: 24,
                                  imageFileType: "png",
                                })}
                              />
                              <span className={styles.childFileNames}>
                                {file.name}
                              </span>
                              <div className={styles.childIconGrop}>
                                <Icon
                                  iconName="View"
                                  title="View"
                                  style={{ cursor: "pointer" }}
                                  onClick={() => this.handleView(file.url!)}
                                />
                                <Icon
                                  iconName="Download"
                                  title="Download"
                                  style={{ cursor: "pointer" }}
                                  onClick={() =>
                                    this.handleDownload(
                                      file.url!,
                                      file.name || "download"
                                    )
                                  }
                                />
                              </div>
                              <Dropdown
                                options={statusOptions}
                                placeholder="Status"
                                className={styles.ddlStatus}
                                selectedKey={childStatus}
                                onChange={(_, option) =>
                                  this.handleStatusChange(file.id, option)
                                }
                                disabled={isFinalized}
                              />
                              <TextField
                                className={styles.txtComments}
                                placeholder="Comment(s)"
                                value={comments[file.id] || ""}
                                onChange={(_, val) =>
                                  this.handleCommentChange(file.id, val)
                                }
                                disabled={isFinalized}
                              />
                            </Stack.Item>
                          );
                        })}
                      </Stack>
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Footer */}
        <div className="flex gap-2" style={{ textAlign: "center" }}>
          <PrimaryButton
            className={styles.btnOk}
            style={{ marginRight: "5px" }}
            disabled={isFinalized}
            onClick={this.handleFinalize}
          >
            OK
          </PrimaryButton>
          <DefaultButton
            style={{ minWidth: "0px", padding: "0px 3px" }}
            onClick={onBack}
          >
            Cancel
          </DefaultButton>
        </div>
      </div>
    );
  }
}

export default TransmittalDetailTab;
