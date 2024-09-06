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

        // Break role inheritance and reset permissions
        await item.breakRoleInheritance(false, false);
        console.log(`Permissions inheritance broken and reset for item ${itemId}.`);

        // Fetch site-level groups
        const groups = await sp.web.siteGroups();

        // Get the read and full control role definitions
        const readRoleDefinition = await sp.web.roleDefinitions.getByName("Read")();
        const fullControlRoleDefinition = await sp.web.roleDefinitions.getByName("Full Control")();

        // Loop through each group and grant read access
        for (const group of groups) {
            try {
                console.log(`Group ${group.Title} retrieved successfully.`);

                // Remove full control if present
                await item.roleAssignments.remove(group.Id, fullControlRoleDefinition.Id);

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

        // Remove full control from the owner (if present)
        await item.roleAssignments.remove(ownerId, fullControlRoleDefinition.Id);

        // Grant read access to the item-level owner
        await item.roleAssignments.add(ownerId, readRoleDefinition.Id);
        console.log(`Read access granted to item owner for item ${itemId}.`);

    } catch (error) {
        console.error(`Error setting permissions for item ${itemId}:`, error);
    }
}
