# Import CSV file
$CSVFilePath = "C:\Users\Murali\Desktop\Powershell Script\sites_users.csv"  # Update with actual file path
$SiteUserData = Import-Csv -Path $CSVFilePath

# Process each row in the CSV
foreach ($Row in $SiteUserData) {
    $SiteURL = $Row.SiteURL
    $UserAccountsRaw = $Row.UserAccount

    # Clean and split the UserAccount field (removes brackets and splits by comma)
    $UserAccounts = $UserAccountsRaw -replace "\[|\]" -split ","

    Write-Host "Processing Site: $SiteURL for Users: $UserAccounts"

    # Connect to SharePoint site
    Connect-PnPOnline –Url $SiteURL -UseWebLogin

    # Setup the context
    $AuthenticationManager = New-Object OfficeDevPnP.Core.AuthenticationManager
    $Ctx = $AuthenticationManager.GetWebLoginClientContext($SiteURL)

    # Assign site admin role for each user
    foreach ($UserAccount in $UserAccounts) {
        $UserAccount = $UserAccount.Trim()  # Remove extra spaces
        if ($UserAccount -ne "") {  # Ensure no empty values
            $User = $Ctx.Web.EnsureUser($UserAccount)
            $User.IsSiteAdmin = $True
            $User.Update()
            Write-Host "Added Site Admin: $UserAccount to $SiteURL"
        }
    }

    # Execute SharePoint update
    $Ctx.ExecuteQuery()
}

Write-Host "Process Completed Successfully!"
