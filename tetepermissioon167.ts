import { spfi } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/security/list";
import "@pnp/sp/site-users/web";
import "@pnp/sp/site-groups/web";
import "@pnp/sp/role-definitions";

const sp = spfi(...);

export async function setPermissionsWithoutCurrentUser(
    listName: string, // Name of the SharePoint list containing the item
    itemId: number // ID of the SharePoint item
): Promise<void> {
    try {
        // Get the list by title and item by ID
        const list = sp.web.lists.getByTitle(listName);
        const item = list.items.getById(itemId);

        // Break role inheritance and remove existing permissions
        await item.breakRoleInheritance(false, true);
        console.log(`Permissions inheritance broken for item ${itemId}. Existing permissions removed.`);

        // Get current user's ID
        const currentUser = await sp.web.currentUser();
        const currentUserId = currentUser.Id;

        // Remove current user's role assignments if any
        const roleAssignments = await item.roleAssignments();
        for (const roleAssignment of roleAssignments) {
            if (roleAssignment.PrincipalId === currentUserId) {
                await item.roleAssignments.remove(currentUserId);
                console.log(`Removed current user (ID: ${currentUserId}) from item ${itemId}.`);
            }
        }

        // Fetch all site-level groups
        const groups = await sp.web.siteGroups();

        // Get the read role definition
        const readRoleDefinition = await sp.web.roleDefinitions.getByName("Read")();

        // Loop through each group and grant read access
        for (const group of groups) {
            // Check if the principal type is not "User" (PrincipalType 8) and grant permissions
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

    } catch (error) {
        console.error(`Error setting permissions for item ${itemId}:`, error);
    }
}
