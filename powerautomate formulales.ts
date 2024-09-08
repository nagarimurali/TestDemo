{
  "Accept": "application/json;odata=verbose"
}
_api/web/lists/getbytitle('TaskStatus')/items(@{outputs('Update_item')?['body/ID']})/roleassignments/addroleassignment(principalid=@{items('Apply_to_each')?['Id']},roledefid=1073741826)

/_api/web/lists(guid'@{outputs('Compose_2')}')/items(@{outputs('Update_item')?['body/ID']})/roleassignments?$expand=RoleDefinitionBindings


  _api/lists/getByTitle('TaskStatus')/items(@{triggerOutputs()?['body/ID']})/breakroleinheritance(copyRoleAssignments=false, clearSubscopes=true)
