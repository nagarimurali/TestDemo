import * as React from "react";
import {
  TextField,
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
  docChildItems: any;
  docId: string;
  name: string;
  type: "folder" | "file";
  url?: string;
  filetype?: string;
  children?: ITransmittalDocument[];
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
  statusOptions: string[];
}

interface ITransmittalDetailTabState {
  expandedDocs: { [key: string]: boolean };
  checkStatuses: { [key: string]: "Approved" | "Rejected" | "" };
  comments: { [docId: string]: string };
  transmittalStatus: "Approved" | "Rejected" | "Pending";
  validated: boolean;
}

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
      transmittalStatus: "Pending",
      validated: false,
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

  handleButtonStatusChange = (docId: string, status: "Approved" | "Rejected") => {
    this.setState(
      (prevState) => ({
        checkStatuses: {
          ...prevState.checkStatuses,
          [docId]: status,
        },
      }),
      this.updateTransmittalStatus
    );
  };

  updateTransmittalStatus = () => {
    const { checkStatuses } = this.state;
    const values = Object.values(checkStatuses);

    if (values.length === 0 || values.some((v) => v === "")) {
      this.setState({ transmittalStatus: "Pending" });
      return;
    }

    if (values.every((v) => v === "Approved")) {
      this.setState({ transmittalStatus: "Approved" });
    } else if (values.some((v) => v === "Rejected")) {
      this.setState({ transmittalStatus: "Rejected" });
    }
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

  handleValidate = () => {
    if (window.confirm("Are you sure you want to validate this transmittal?")) {
      this.setState({ validated: true });
    }
  };

  render() {
    const { transmittal, onBack } = this.props;

    return (
      <div className={styles.container}>
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

        {/* Documents list */}
        <div className={styles.docContainer}>
          {transmittal.documents[0].docChildItems?.map((doc: any, index: number) => {
            const checkStatuse = this.state.checkStatuses[doc.id] || "";
            const isFirstFile = index === 0 && doc.type === "file"; // disable only first item

            if (doc.type === "file") {
              return (
                <Stack
                  key={doc.id}
                  horizontal
                  verticalAlign="center"
                  tokens={{ childrenGap: 12 }}
                  style={{ marginBottom: "10px", paddingBottom: "10px" }}
                >
                  <Stack.Item
                    grow={3}
                    style={{ display: "flex", width: "86px", alignItems: "center" }}
                  >
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
                    <span className={styles.xlsxIcons}>
                      <Icon
                        iconName="View"
                        title="View"
                        style={{ cursor: "pointer", marginRight: "4px" }}
                        onClick={() => this.handleView(doc.url)}
                      />
                      <Icon
                        iconName="Download"
                        title="Download"
                        style={{ cursor: "pointer" }}
                        onClick={() => this.handleDownload(doc.url, doc.name || "download")}
                      />
                    </span>
                  </Stack.Item>

                  {/* Approve / Reject buttons */}
                  <Stack.Item>
                    <DefaultButton
                      style={{ marginRight: "5px", minWidth: "0px" }}
                      className={`${styles.statusIcons} ${
                        checkStatuse === "Approved" ? styles.iconApproved : ""
                      }`}
                      onClick={() => this.handleButtonStatusChange(doc.id, "Approved")}
                      disabled={isFirstFile || this.state.validated}
                    >
                      <FontIcon iconName="CheckMark" />
                    </DefaultButton>
                    <DefaultButton
                      style={{ marginRight: "5px", minWidth: "0px" }}
                      className={`${styles.statusIcons} ${
                        checkStatuse === "Rejected" ? styles.iconRejected : ""
                      }`}
                      onClick={() => this.handleButtonStatusChange(doc.id, "Rejected")}
                      disabled={isFirstFile || this.state.validated}
                    >
                      <FontIcon iconName="Cancel" />
                    </DefaultButton>
                  </Stack.Item>

                  <Stack.Item grow={3}>
                    <TextField
                      className={styles.txtComments}
                      placeholder="Comment(s)"
                      disabled={this.state.validated}
                    />
                  </Stack.Item>
                </Stack>
              );
            }

            if (doc.type === "folder") {
              return (
                <div key={doc.id} style={{ paddingBottom: 10, marginBottom: 10 }}>
                  <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }}>
                    <Stack.Item grow={3}>
                      <Icon iconName="FabricFolder" />
                      <span style={{ fontWeight: 600, marginLeft: "3px" }}>
                        {doc.name}
                      </span>
                      <Icon
                        iconName={
                          this.state.expandedDocs[doc.id] ? "ChevronUp" : "ChevronDown"
                        }
                        onClick={() => this.toggleExpand(doc.id)}
                        style={{ minWidth: 0, padding: 4, cursor: "pointer" }}
                      />
                    </Stack.Item>

                    {/* Approve / Reject for folders */}
                    <Stack.Item>
                      <DefaultButton
                        style={{ marginRight: "5px", minWidth: "0px" }}
                        className={`${styles.statusIcons} ${
                          checkStatuse === "Approved" ? styles.iconApproved : ""
                        }`}
                        onClick={() => this.handleButtonStatusChange(doc.id, "Approved")}
                        disabled={this.state.validated}
                      >
                        <FontIcon iconName="CheckMark" />
                      </DefaultButton>
                      <DefaultButton
                        style={{ marginRight: "5px", minWidth: "0px" }}
                        className={`${styles.statusIcons} ${
                          checkStatuse === "Rejected" ? styles.iconRejected : ""
                        }`}
                        onClick={() => this.handleButtonStatusChange(doc.id, "Rejected")}
                        disabled={this.state.validated}
                      >
                        <FontIcon iconName="Cancel" />
                      </DefaultButton>
                    </Stack.Item>

                    <Stack.Item grow={3}>
                      <TextField
                        className={styles.txtComments}
                        placeholder="Comment(s)"
                        disabled={this.state.validated}
                      />
                    </Stack.Item>
                  </Stack>

                  {this.state.expandedDocs[doc.id] && (
                    <div className={styles.childContainer}>
                      <Stack horizontal wrap tokens={{ childrenGap: 10 }} styles={{ root: { padding: 8 } }}>
                        {doc.children?.map((file: any) => (
                          <Stack.Item
                            key={file.id}
                            grow
                            className={styles.childFileItems}
                            style={{ maxWidth: "250px" }}
                          >
                            <Icon
                              {...getFileTypeIconProps({
                                extension: file.name.split(".").pop(),
                                size: 24,
                                imageFileType: "png",
                              })}
                            />
                            <span className={styles.childFileNames}>{file.name}</span>
                            <div className={styles.childIconGrop}>
                              <Icon
                                iconName="View"
                                title="View"
                                style={{ cursor: "pointer" }}
                                onClick={() => this.handleView(file.url)}
                              />
                              <Icon
                                iconName="Download"
                                title="Download"
                                style={{ cursor: "pointer" }}
                                onClick={() => this.handleDownload(file.url, file.name || "download")}
                              />
                            </div>
                          </Stack.Item>
                        ))}
                      </Stack>
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })}
        </div>

        <div className="flex gap-2" style={{ textAlign: "center" }}>
          <PrimaryButton
            className={styles.btnOk}
            style={{ marginRight: "5px", minWidth: "0px" }}
            onClick={this.handleValidate}
            disabled={this.state.validated}
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
