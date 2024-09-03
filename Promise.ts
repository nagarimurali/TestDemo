private async openFreezeDialog(): Promise<void> {
    try {
        // Extract Technical Document items with non-null DocumentId
        const technicalDocumentItems = this.props.linkedSearchItems.filter(item => 
            item.ContentType === 'Technical Document' && item.DocumentId !== null
        );

        // Extract Baseline items with non-null ChildBaselineId
        const baselineItems = this.props.linkedSearchItems.filter(item => 
            item.ContentType === 'Baseline' && item.ChildBaselineId !== null
        );

        // Make both API calls concurrently
        const [technicalData, baselineData] = await Promise.all([
            BaselineService.getSearchResults({ ContentType: "Technical Document" }),
            BaselineService.getSearchResults({ ContentType: "Baseline" })
        ]);

        // Filter technicalData based on DocumentId from linkedSearchItems
        const filteredTechnicalData = technicalData.filter(techItem =>
            technicalDocumentItems.some(linkedItem => linkedItem.DocumentId === techItem.DocumentId)
        );

        // Ensure all filtered technical documents are in "Draft" status
        const allTechnicalDraft = filteredTechnicalData.every(item => item.DocumentStatus === "Draft");

        // Filter baselineData based on ChildBaselineId and SiteUrl from linkedSearchItems
        const filteredBaselineData = baselineData.filter(baselineItem =>
            baselineItems.some(linkedItem =>
                linkedItem.ChildBaselineId === baselineItem.ItemId &&
                linkedItem.SiteUrl === baselineItem.SiteUrl
            )
        );

        // Ensure at least one filtered baseline document is in "Ongoing" status
        const anyBaselineOngoing = filteredBaselineData.some(item => item.BaselineStatus === "Ongoing");

        // Show the dialog only if both conditions are met
        if (allTechnicalDraft && anyBaselineOngoing) {
            this.setState({ isFreezeDialogVisible: true });
        } else {
            // Handle cases where conditions are not met (e.g., logging)
            console.log('Conditions not met for showing the freeze dialog.');
            console.log('Filtered Technical Data:', filteredTechnicalData);
            console.log('Filtered Baseline Data:', filteredBaselineData);
        }
    } catch (error) {
        // Handle any errors from the API calls
        console.error('Error fetching data:', error);
    }
}
