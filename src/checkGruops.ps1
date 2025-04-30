# Define URLs
$sourceSiteUrl = "https://yourtenant.sharepoint.com/sites/source-site"
$targetSiteUrl = "https://yourtenant.sharepoint.com/sites/target-site"
$groupName = "JAC Department Head"

# Connect to Source Site
Connect-PnPOnline -Url $sourceSiteUrl -Interactive
$sourceGroup = Get-PnPGroup -Identity $groupName
$sourceUsers = Get-PnPGroupMembers -Identity $sourceGroup

# Connect to Target Site
Connect-PnPOnline -Url $targetSiteUrl -Interactive
$targetGroup = Get-PnPGroup -Identity $groupName
$targetUsers = Get-PnPGroupMembers -Identity $targetGroup

# Compare users
$sourceLogins = $sourceUsers.LoginName
$targetLogins = $targetUsers.LoginName
$missingUsers = $sourceUsers | Where-Object { $_.LoginName -notin $targetLogins }

# Add missing users to target group
foreach ($user in $missingUsers) {
    Write-Host "Adding $($user.LoginName) to $groupName in target site..."
    Add-PnPGroupMember -Identity $groupName -User $user.LoginName
}

Write-Host "Sync completed. Added $($missingUsers.Count) missing user(s)."
