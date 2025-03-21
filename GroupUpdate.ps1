# Get the script directory
$ScriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path

# Define input/output file paths dynamically
$CsvFilePath = Join-Path -Path $ScriptDirectory -ChildPath "Input.csv"
$LogFilePath = Join-Path -Path $ScriptDirectory -ChildPath ("Output_" + (Get-Date).ToString('dd_MMM_yyyy__HH_mm_ss') + ".csv")

# Import CSV data
$table = Import-Csv -Path $CsvFilePath -Delimiter ","

# Store results
$result = @()

# Loop through each site in the CSV
foreach ($row in $table) {
    try {
        Write-Host "Connecting to: $($row.SiteUrl)" -ForegroundColor Cyan
        $SourceSiteURL = $row.SiteUrl  

        # Connect to the SharePoint site using PnP Online and Web Login
        Connect-PnPOnline -Url $SourceSiteURL -UseWebLogin

        # Extract group details
        $GroupName = $row.GroupName
        $GroupOwner = $row.GroupOwner

        if ([string]::IsNullOrWhiteSpace($GroupName) -or [string]::IsNullOrWhiteSpace($GroupOwner)) {
            Write-Host "Skipping: GroupName or GroupOwner is missing for $SourceSiteURL" -ForegroundColor Yellow
        } else {
            # Update Group Owner and 'Who can edit membership' setting
            Set-PnPGroup -Identity $GroupName -AllowMembersEditMembership $false -Owner $GroupOwner
            Write-Host "Updated Group Owner and membership settings for $GroupName" -ForegroundColor Green
        }

        # Collect success result
        $result += [PSCustomObject]@{
            SiteUrl   = $row.SiteUrl
            Status    = "Successfully updated Group Owner and membership settings"
            Timestamp = (Get-Date).ToString('dd-MMM-yyyy HH:mm:ss')
        }
    }
    catch {
        Write-Host "Error processing $SourceSiteURL : $_" -ForegroundColor Red

        # Log the failure
        $result += [PSCustomObject]@{
            SiteUrl   = $row.SiteUrl
            Status    = "Error: $_"
            Timestamp = (Get-Date).ToString('dd-MMM-yyyy HH:mm:ss')
        }
    }
}

# Export results to CSV
$result | Export-Csv -Path $LogFilePath -NoTypeInformation -Encoding UTF8
Write-Host "✅ Output report exported to CSV file successfully: $LogFilePath" -ForegroundColor Green
