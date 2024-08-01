# Define the input and output file paths
$inputFilePath = "path\to\your\input.csv"
$outputFilePath = "path\to\your\output.csv"
 
# Read the input CSV file
$inputData = Import-Csv -Path $inputFilePath
 
# Initialize an array to store the processed output data
$outputData = @()
 
# Process the input data
foreach ($row in $inputData) {
    $codeParts = $row.Code -split '\.'
 
    $termSet = $inputData[0].Name  # The top-level term set
    $term = $row.Name
    $level1 = ""
    $level2 = ""
    $level3 = ""
 
    switch ($codeParts.Length) {
        1 { $termSet = $row.Name }
        2 { $level1 = $row.Name }
        3 { 
            $level1 = $inputData | Where-Object { $_.Code -eq "$($codeParts[0]).$($codeParts[1])" } | Select-Object -ExpandProperty Name
            $level2 = $row.Name 
        }
        4 { 
            $level1 = $inputData | Where-Object { $_.Code -eq "$($codeParts[0]).$($codeParts[1])" } | Select-Object -ExpandProperty Name
            $level2 = $inputData | Where-Object { $_.Code -eq "$($codeParts[0]).$($codeParts[1]).$($codeParts[2])" } | Select-Object -ExpandProperty Name
            $level3 = $row.Name 
        }
    }
 
    $outputData += [pscustomobject]@{
        "TermSet" = $termSet
        "Term" = $term
        "Level1" = $level1
        "Level2" = $level2
        "Level3" = $level3
    }
}
 
# Export the processed data to a new CSV file
$outputData | Export-Csv -Path $outputFilePath -NoTypeInformation
 
Write-Output "Processing completed. Output saved to $outputFilePath"