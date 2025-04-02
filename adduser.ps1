# Variables for Processing
$SiteURL = "https://test.sharepoint.com/sites/FSH"
$UserAccounts = @("AdklV@MODERNCOMMS090301.OnMicrosoft.com", 
                  "NmkV@MODERNCOMMS090301.OnMicrosoft.com", 
                  "thjV@MODERNCOMMS090301.OnMicrosoft.com")

# Connect to SharePoint
Connect-PnPOnline –Url $SiteURL -UseWebLogin

# Setup the context
$AuthenticationManager = New-Object OfficeDevPnP.Core.AuthenticationManager
$Ctx = $AuthenticationManager.GetWebLoginClientContext($SiteURL)

# Loop through each user and assign site admin role
foreach ($UserAccount in $UserAccounts) {
    $User = $Ctx.Web.EnsureUser($UserAccount)
    $User.IsSiteAdmin = $True
    $User.Update()
}

$Ctx.ExecuteQuery()
Write-Host "Users have been successfully added as site admins."
