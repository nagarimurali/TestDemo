private getSharePointItemTerms(): Promise<any[]> {
  const listTitle = this.props.context.pageContext.list?.title;
  const itemId = this.props.context.item?.ID;

  if (!itemId) {
    console.error("Item ID not found.");
    return Promise.resolve([]);
  }

  const spurl = this.props.context.pageContext.web.absoluteUrl;
  const requestUrl = `${spurl}/_api/web/lists/getByTitle('${listTitle}')/items(${itemId})?$select=PLOwnership`;

  console.log("Request URL:", requestUrl);

  // Define the options for the request
  const httpClientOptions: IHttpClientOptions = {
    headers: {
      'Accept': 'application/json; odata=nometadata'
    }
  };

  return this.props.context.httpClient.get(requestUrl, HttpClient.configurations.v1, httpClientOptions)
    .then((response: HttpClientResponse): Promise<string> => {
      if (response.ok) {
        return response.text(); // Return raw text response
      } else {
        console.error("Failed to fetch SharePoint item terms. Status:", response.status);
        return Promise.reject(new Error(response.statusText));
      }
    })
    .then((responseText: string) => {
      console.log("Raw Response Text:", responseText);

      // Check if the response is JSON or XML
      const trimmedResponse = responseText.trim();
      if (trimmedResponse.startsWith('{') || trimmedResponse.startsWith('[')) {
        // Response is likely JSON
        try {
          const jsonResponse = JSON.parse(responseText);
          console.log("Response is in JSON format.");
          
          if (jsonResponse.PLOwnership) {
            const termGuid = jsonResponse.PLOwnership.TermGuid;
            console.log("TermGuid from JSON:", termGuid);
            alert("TermGuid from JSON: " + termGuid);
            return;
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
            console.log("TermGuid from XML:", termGuid);
            alert("TermGuid from XML: " + termGuid);
          } else {
            console.error("TermGuid not found in XML response.");
          }
        } else {
          console.error("PLOwnership node not found in XML response.");
        }
      }
    })
    .catch((error: any) => {
      console.error("Error fetching SharePoint item terms:", error);
    });
}
