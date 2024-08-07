# Display message about importing from CSV
Write-Host "Importing from CSV..." -ForegroundColor Yellow

# Get the current script directory
$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path

# Construct the path to the input file relative to the script directory
$inputFilePath = Join-Path $scriptDirectory "input_data.csv"

# Construct the dynamic output file path relative to the script directory
$outputFilePath = Join-Path $scriptDirectory ("Output_" + (Get-Date).ToString('dd_MMM_yyyy__HH_mm_ss') + ".csv")

# Read the input CSV file
$inputData = Import-Csv -Path $inputFilePath

# Filter rows where Level is "Business"
$businessRows = $inputData | Where-Object { $_.Level -eq "Business" }

# Initialize the output data list
$outputData = New-Object System.Collections.Generic.List[PSObject]

# Flag to track the first row
$isFirstRow = $true

# Function to recursively add child rows
function Add-ChildRows {
    param (
        [string]$parentID,
        [int]$level,
        [PSCustomObject]$parentRow
    )

    if ($level -gt 5) {
        return
    }

    $childRows = $inputData | Where-Object { $_.'Parent - Product Structu' -eq $parentID }
    
    foreach ($childRow in $childRows) {
        $childProductStructureID = $childRow.'Product Structure ID'
        $childElementName = $childRow.'Element Name'
        
        $row = [PSCustomObject]@{
            "Term Set Name" = ""
            "Term Set Description" = ""
            "LCID" = ""
            "Available for Tagging" = "TRUE"
            "Term Description" = ""
            'Level 1 Term' = $parentRow.'Level 1 Term'
            'Level 2 Term' = $parentRow.'Level 2 Term'
            'Level 3 Term' = $parentRow.'Level 3 Term'
            'Level 4 Term' = $parentRow.'Level 4 Term'
            'Level 5 Term' = ""
        }

        # Add debugging information to help diagnose issues
        Write-Host "Adding row for ParentID: $parentID at Level: $level" -ForegroundColor Cyan
        Write-Host "Child: $childElementName ($childProductStructureID)" -ForegroundColor Cyan

        try {
            $row."Level $level Term" = "$childElementName ($childProductStructureID)"
        }
        catch {
            Write-Host "Error setting Level $level Term: $_" -ForegroundColor Red
        }

        $outputData.Add($row)

        Add-ChildRows -parentID $childProductStructureID -level ($level + 1) -parentRow $row
    }
}

# Process each row where Level is "Business"
foreach ($row in $businessRows) {
    $productStructureID = $row.'Product Structure ID'
    $elementName = $row.'Element Name'
    
    # Add a new row for the TermGroup "Business"
    $parentRow = [PSCustomObject]@{
        "Term Set Name" = if ($isFirstRow) { "Productetion" } else { "" }
        "Term Set Description" = ""
        "LCID" = ""
        "Available for Tagging" = "TRUE"
        "Term Description" = ""
        'Level 1 Term' = "Business"
        'Level 2 Term' = "$elementName ($productStructureID)"
        'Level 3 Term' = ""
        'Level 4 Term' = ""
        'Level 5 Term' = ""
    }
    $outputData.Add($parentRow)

    # Add child rows for Level 2 and beyond
    Add-ChildRows -parentID $productStructureID -level 3 -parentRow $parentRow

    # Set the flag to false after the first row
    $isFirstRow = $false
}

# Export the processed data to a new CSV file
$outputData | Export-Csv -Path $outputFilePath -NoTypeInformation

# Display message about the output file
Write-Host "Output file generated at: $outputFilePath" -ForegroundColor Green
