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

# Add the header row to the output data
$outputData.Add([PSCustomObject]@{
    TermGroup = "Business"
    'Level 1 Term' = ""
    'Level 2 Term' = ""
    'Level 3 Term' = ""
    'Level 4 Term' = ""
})

# Function to recursively add child rows
function Add-ChildRows {
    param (
        [string]$parentID,
        [int]$level
    )

    if ($level -gt 4) {
        return
    }

    $childRows = $inputData | Where-Object { $_.'Parent - Product Structu' -eq $parentID }
    
    foreach ($childRow in $childRows) {
        $childProductStructureID = $childRow.'Product Structure ID'
        $childElementName = $childRow.'Element Name'
        
        $row = [PSCustomObject]@{
            TermGroup = ""
            'Level 1 Term' = ""
            'Level 2 Term' = ""
            'Level 3 Term' = ""
            'Level 4 Term' = ""
        }

        # Add debugging information to help diagnose issues
        Write-Host "Adding row for ParentID: $parentID at Level: $level" -ForegroundColor Cyan
        Write-Host "Child: $childProductStructureID($childElementName)" -ForegroundColor Cyan

        try {
            $row."Level $level Term" = "$childProductStructureID($childElementName)"
        }
        catch {
            Write-Host "Error setting Level $level Term: $_" -ForegroundColor Red
        }

        $outputData.Add($row)

        Add-ChildRows -parentID $childProductStructureID -level ($level + 1)
    }
}

# Process each row where Level is "Business"
foreach ($row in $businessRows) {
    $productStructureID = $row.'Product Structure ID'
    $elementName = $row.'Element Name'
    
    # Add a new row for the TermGroup "Business"
    $outputData.Add([PSCustomObject]@{
        TermGroup = "Business"
        'Level 1 Term' = "$productStructureID($elementName)"
        'Level 2 Term' = ""
        'Level 3 Term' = ""
        'Level 4 Term' = ""
    })

    # Add child rows for Level 2 and beyond
    Add-ChildRows -parentID $productStructureID -level 2
}

# Export the processed data to a new CSV file
$outputData | Export-Csv -Path $outputFilePath -NoTypeInformation

# Display message about the output file
Write-Host "Output file generated at: $outputFilePath" -ForegroundColor Green
