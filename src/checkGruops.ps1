# -----------------------
# CONFIGURATION
# -----------------------
$onPremSiteUrl = "http://your-onprem-site"
$groupName = "JAC Department Head"
$targetSiteUrl = "https://yourtenant.sharepoint.com/sites/your-target-site"

# -----------------------
# LOAD ON-PREM SP MODULE
# -----------------------
Add-PSSnapin Microsoft.SharePoint.PowerShell -ErrorAction SilentlyContinue

Write-Host "Connecting to On-Premises SharePoint..." -ForegroundColor Cyan

try {
    $web = Get-SPWeb $onPremSiteUrl
    $group = $web.SiteGroups[$groupName]
    $onPremUsers = $group.Users | Select-Object -ExpandProperty LoginName
    Write-Host "Retrieved $($onPremUsers.Count) user(s) from On-Prem group '$groupName'."
} catch {
    Write-Error "Failed to access on-prem group: $_"
    exit
}

# -----------------------
# LOAD PNP MODULE
# -----------------------
if (-not (Get-Module -ListAvailable -Name "PnP.PowerShell")) {
    Write-Host "PnP PowerShell not found. Installing..." -ForegroundColor Yellow
    Install-Module -Name "PnP.PowerShell" -Force -Scope CurrentUser
}
Import-Module PnP.PowerShell

# -----------------------
# CONNECT TO SPO
# -----------------------
Write-Host "Connecting to SharePoint Online..." -ForegroundColor Cyan
Connect-PnPOnline -Url $targetSiteUrl -UseWebLogin

try {
    $spoGroup = Get-PnPGroup -Identity $groupName
    $spoUsers = Get-PnPGroupMembers -Identity $groupName
    $spoUserLogins = $spoUsers.LoginName
    Write-Host "Retrieved $($spoUserLogins.Count) user(s) from SPO group '$groupName'."
} catch {
    Write-Error "Failed to access SPO group: $_"
    exit
}

# -----------------------
# FIND MISSING USERS
# -----------------------
$missingUsers = $onPremUsers | Where-Object { $_ -notin $spoUserLogins }

if ($missingUsers.Count -eq 0) {
    Write-Host "✅ No missing users. Groups are in sync." -ForegroundColor Green
} else {
    Write-Host "`n🔄 Syncing missing users to SPO..." -ForegroundColor Yellow

    foreach ($user in $missingUsers) {
        try {
            Add-PnPGroupMember -Identity $groupName -User $user
            Write-Host "➕ Added: $user"
        } catch {
            Write-Warning "❌ Failed to add $user: $_"
        }
    }

    Write-Host "`n✅ Sync complete. Added $($missingUsers.Count) user(s)." -ForegroundColor Green
}
