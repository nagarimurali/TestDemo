public componentDidMount(): void {
    const { context } = this.props;

    // CAML Query for filtering items where Revision = "AB"
    const camlQuery = `<View Scope="RecursiveAll">
        <Query>
            <Where>
                <Eq>
                    <FieldRef Name="Revision" />
                    <Value Type="Text">AB</Value>
                </Eq>
            </Where>
        </Query>
    </View>`;

    // Fetch and log the data
    this._sp.web.lists
        .getById(context.list.guid.toString())
        .renderListDataAsStream({
            ViewXml: camlQuery,
            RenderOptions: RenderListDataOptions.ListData,
        })
        .then((listDataAsStream) => {
            console.log("Filtered Items:", listDataAsStream?.Row || []);
        })
        .catch((error) => {
            console.error("Error fetching data:", error);
        });
}
