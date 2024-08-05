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

# Initialize the output data array
$outputData = @()

# Add the header row to the output data
$outputData += [PSCustomObject]@{
    TermGroup = "Business"
    'Level 1 Term' = ""
    'Level 2 Term' = ""
    'Level 3 Term' = ""
    'Level 4 Term' = ""
}

# Process each row where Level is "Business"
foreach ($row in $businessRows) {
    $productStructureID = $row.'Product Structure ID'
    $elementName = $row.'Element Name'
    
    # Add a new row for the TermGroup "Business"
    $outputData += [PSCustomObject]@{
        TermGroup = "Business"
        'Level 1 Term' = "$productStructureID($elementName)"
        'Level 2 Term' = ""
        'Level 3 Term' = ""
        'Level 4 Term' = ""
    }

    # Filter the input data based on the current Product Structure ID being the Parent - Product Structu
    $childRows = $inputData | Where-Object { $_.'Parent - Product Structu' -eq $productStructureID }
    
    # Add child rows to the output data
    foreach ($childRow in $childRows) {
        $childProductStructureID = $childRow.'Product Structure ID'
        $childElementName = $childRow.'Element Name'
        $outputData += [PSCustomObject]@{
            TermGroup = ""
            'Level 1 Term' = ""
            'Level 2 Term' = "$childProductStructureID($childElementName)"
            'Level 3 Term' = ""
            'Level 4 Term' = ""
        }
    }
}

# Export the processed data to a new CSV file
$outputData | Export-Csv -Path $outputFilePath -NoTypeInformation

# Display message about the output file
Write-Host "Output file generated at: $outputFilePath" -ForegroundColor Green
