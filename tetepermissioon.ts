import { spfi } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/security/list";
import "@pnp/sp/site-users/web";
import "@pnp/sp/site-groups/web";
import "@pnp/sp/role-definitions";
import { PermissionKind } from "@pnp/sp/security";

// Initialize the SP context (adjust based on your environment)
const sp = spfi(...);

export async function setItemPermissionsForSiteGroups(
    listName: string, // Name of the SharePoint list containing the items
    itemId: number // ID of the SharePoint item
): Promise<void> {
    try {
        // Get the list by title and item by ID
        const list = sp.web.lists.getByTitle(listName);
        const item = list.items.getById(itemId);

        // Break role inheritance (remove existing permissions, keep the item unique)
        await item.breakRoleInheritance(false, true);
        console.log(`Permissions inheritance broken for item ${itemId}.`);

        // Fetch the current user's ID
        const currentUser = await sp.web.currentUser();
        const currentUserId = currentUser.Id;

        // Fetch site-level groups
        const groups = await sp.web.siteGroups();

        // Get the read role definition
        const readRoleDefinition = await sp.web.roleDefinitions.getByName("Read")();

        // Loop through each group and grant read access, excluding the current user
        for (const group of groups) {
            try {
                console.log(`Processing group: ${group.Title}`);

                // Grant read access to each site-level group
                await item.roleAssignments.add(group.Id, readRoleDefinition.Id);
                console.log(`Read access granted to group ${group.Title} for item ${itemId}.`);
            } catch (error) {
                console.error(`Error setting permissions for group ${group.Title}:`, error);
            }
        }

        // Get the owner of the item (assuming owner is stored in a 'AuthorId' field)
        const itemOwner = await item.select("Author/Id").expand("Author")();
        const ownerId = itemOwner.Author.Id;

        // Grant read access to the item-level owner, but ensure the owner isn't the current user
        if (ownerId !== currentUserId) {
            await item.roleAssignments.add(ownerId, readRoleDefinition.Id);
            console.log(`Read access granted to item owner for item ${itemId}.`);
        }

        // Check if the current user is not accidentally being granted full control
        const userRoleAssignments = await item.roleAssignments.get();
        userRoleAssignments.forEach(roleAssignment => {
            if (roleAssignment.PrincipalId === currentUserId && roleAssignment.RoleDefinitionBindings.some(rd => rd.BasePermissions.has(PermissionKind.FullControl))) {
                console.warn(`Full control detected for current user on item ${itemId}. This should be reviewed.`);
            }
        });

    } catch (error) {
        console.error(`Error setting permissions for item ${itemId}:`, error);
    }
}
