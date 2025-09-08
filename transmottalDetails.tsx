{transmittal.documents[0].docChildItems?.map((doc: any, index: number) => {
  const checkStatuse = this.state.checkStatuses[doc.id] || "";
  const isFirstFile = index === 0 && doc.type === "file"; // coversheet ignore

  // === Coversheet file (first item) ===
  if (isFirstFile) {
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
          <span style={{ fontWeight: 600, marginLeft: "3px" }}>{doc.name}</span>
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
      </Stack>
    );
  }

  // === Folders (after first file) ===
  if (doc.type === "folder") {
    const optionLabel = this.props.statusOptions[index - 1]; // pick Yes / No

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

          {/* Approve / Reject */}
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

          {/* Yes/No label before Comment(s) */}
          <Stack.Item>
            <span style={{ fontWeight: 500 }}>{optionLabel}</span>
          </Stack.Item>

          <Stack.Item grow={3}>
            <TextField
              className={styles.txtComments}
              placeholder="Comment(s)"
              disabled={this.state.validated}
            />
          </Stack.Item>
        </Stack>

        {/* Expand folder children */}
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
