Write-Host "Importing CSV" -ForegroundColor Yellow
 
# Get the current script directory
$ScriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
 
# Construct the path to the input file relative to the script directory
$inputFilePath = Join-Path $ScriptDirectory "Input.csv"
 
# Construct the dynamic output file path relative to the script directory
$outputFilePath = Join-Path $ScriptDirectory ("Output_" + (Get-Date).ToString('dd_MMM_yyyy__HH_mm_ss') + ".csv")
 
# Read the input CSV file
$inputData = Import-Csv -Path $inputFilePath
 
# Initialize an array to store the processed output data
$outputData = @()
 
# Process the input data
foreach ($row in $inputData) {
    $codeParts = $row.Code -split '\.'
 
    # Initialize the term set and levels array
    $termSet = $inputData[0].Name
    $levels = @()
 
    # Dynamically assign levels based on the code parts
    for ($i = 0; $i -lt $codeParts.Length; $i++) {
        if ($i -eq 0) {
            $termSet = $inputData | Where-Object { $_.Code -eq $codeParts[0] } | Select-Object -ExpandProperty Name
        } else {
            $levelCode = ($codeParts[0..$i] -join '.')
            $levelName = $inputData | Where-Object { $_.Code -eq $levelCode } | Select-Object -ExpandProperty Name
            $levels += $levelName
        }
    }
 
    # Create the output object
    $outputObject = [pscustomobject]@{
        "TermSet" = $termSet
        "Term" = $row.Name
    }
 
    # Add the dynamic levels to the output object
    for ($i = 0; $i -lt $levels.Count; $i++) {
        $levelName = "Level$($i+1)"
        $outputObject | Add-Member -MemberType NoteProperty -Name $levelName -Value $levels[$i]
    }
 
    $outputData += $outputObject
}
 
# Determine the maximum number of levels in the output data
$maxLevels = ($outputData | ForEach-Object {
    $levelCount = ($_.PSObject.Properties.Name | Where-Object { $_ -like 'Level*' }).Count
    return $levelCount
}) | Measure-Object -Maximum | Select-Object -ExpandProperty Maximum
 
# Fill in missing level columns with empty values
foreach ($item in $outputData) {
    for ($i = 1; $i -le $maxLevels; $i++) {
        $levelName = "Level$i"
        if (-not $item.PSObject.Properties[$levelName]) {
            $item | Add-Member -MemberType NoteProperty -Name $levelName -Value ""
        }
    }
}
 
# Export the processed data to a new CSV file
$outputData | Export-Csv -Path $outputFilePath -NoTypeInformation
 
Write-host "Output report exported to CSV successfully!" -ForegroundColor Green