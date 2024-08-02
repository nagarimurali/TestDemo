Write-Host "Importing CSV" -ForegroundColor Yellow

# Get the current script directory
$ScriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path

# Construct the path to the input file relative to the script directory
$inputFilePath = Join-Path $ScriptDirectory "InputData.csv"

# Construct the dynamic output file path relative to the script directory
$outputFilePath = Join-Path $ScriptDirectory ("Output_" + (Get-Date).ToString('dd_MMM_yyyy__HH_mm_ss') + ".csv")

# Read the input CSV file
$inputData = Import-Csv -Path $inputFilePath

# Initialize an array to store the processed output data
$outputData = @()

# Process the input data
foreach ($row in $inputData) {
    $codeParts = $row.Code -split '\.'
    $outputObject = [ordered]@{}

    # Add "Term Set Name" to the output object
    $outputObject["Term Set Name"] = $inputData | Where-Object { $_.Code -eq $codeParts[0] } | Select-Object -ExpandProperty Name

    # Add dynamic level terms to the output object
    for ($i = 1; $i -le $codeParts.Length; $i++) {
        $code = $codeParts[0..($i - 1)] -join '.'
        $levelName = if ($i -eq 1) { "Term" } else { "Level $($i - 1) Term" }
        $term = $inputData | Where-Object { $_.Code -eq $code } | Select-Object -ExpandProperty Name
        $outputObject[$levelName] = $term
    }

    # Add the output object to the output data array
    $outputData += [pscustomobject]$outputObject
}

# Filter out empty rows where "Term" is empty and "Level 1 Term" is not
$outputData = $outputData | Where-Object { -not ([string]::IsNullOrWhiteSpace($_.Term) -and -not [string]::IsNullOrWhiteSpace($_.{"Level 1 Term"})) }

# Export the processed data to a new CSV file
$outputData | Export-Csv -Path $outputFilePath -NoTypeInformation

Write-Output "Processing completed. Output saved to $outputFilePath"
