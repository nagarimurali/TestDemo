{
  "Accept": "application/json;odata=verbose"
}
_api/web/lists/getbytitle('TaskStatus')/items(@{outputs('Update_item')?['body/ID']})/roleassignments/addroleassignment(principalid=@{items('Apply_to_each')?['Id']},roledefid=1073741826)
