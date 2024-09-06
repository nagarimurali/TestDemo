import { spfi } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/security/list";
import "@pnp/sp/site-users/web";
import "@pnp/sp/role-definitions";

const sp = spfi(...);

export async function manageItemPermissions(
    listName: string, // Name of the SharePoint list containing the item
    itemId: number // ID of the SharePoint item
): Promise<void> {
    try {
        // Get the list by title and item by ID
        const list = sp.web.lists.getByTitle(listName);
        const item = list.items.getById(itemId);

        // Break role inheritance (remove existing permissions, keep the item unique)
        await item.breakRoleInheritance(false, true);
        console.log(`Permissions inheritance broken for item ${itemId}.`);

        // Get the read role definition
        const readRoleDefinition = await sp.web.roleDefinitions.getByName("Read")();

        // Fetch site-level groups
        const groups = await sp.web.siteGroups();

        // Get the current user's ID
        const currentUser = await sp.web.currentUser();
        const currentUserId = currentUser.Id;

        // Loop through each group, check the principal type, and grant permissions
        for (const group of groups) {
            // Skip if the principal type is "User" (PrincipalType 8)
            if (group.PrincipalType !== 8) {
                try {
                    console.log(`Processing group: ${group.Title}`);

                    // Grant read access to each SharePoint group
                    await item.roleAssignments.add(group.Id, readRoleDefinition.Id);
                    console.log(`Read access granted to group ${group.Title} for item ${itemId}.`);
                } catch (error) {
                    console.error(`Error setting permissions for group ${group.Title}:`, error);
                }
            } else {
                console.log(`Skipping user: ${group.Title}`);
            }
        }

        // Check if the current user has Full Control and remove it
        const roleAssignments = await item.roleAssignments();
        for (const roleAssignment of roleAssignments) {
            if (roleAssignment.PrincipalId === currentUserId) {
                for (const roleDefBinding of roleAssignment.RoleDefinitionBindings) {
                    if (roleDefBinding.BasePermissions.has(PermissionKind.FullControl)) {
                        // Remove Full Control
                        await item.roleAssignments.remove(currentUserId);
                        console.log(`Removed Full Control from current user for item ${itemId}.`);

                        // Add Read permissions
                        await item.roleAssignments.add(currentUserId, readRoleDefinition.Id);
                        console.log(`Added Read permissions to current user for item ${itemId}.`);
                        break;
                    }
                }
            }
        }
    } catch (error) {
        console.error(`Error managing permissions for item ${itemId}:`, error);
    }
}
