import { sp } from "@pnp/sp/presets/all";

export default class SharePointService {

    // Method to update an item column
    public async updateItemColumn(listName: string, itemId: number, fieldName: string, value: any): Promise<void> {
        try {
            await sp.web.lists.getByTitle(listName).items.getById(itemId).update({
                [fieldName]: value
            });
            console.log(`Item ${itemId} updated successfully.`);
        } catch (error) {
            console.error(`Error updating item ${itemId}:`, error);
        }
    }

    // Method to break inheritance, remove specific group permissions, and grant access to a target group
    public async setItemPermissionsToGroup(
        listName: string, 
        itemId: number, 
        groupNamesToRemove: string[], 
        groupNameToGrant: string
    ): Promise<void> {
        try {
            const item = await sp.web.lists.getByTitle(listName).items.getById(itemId);

            // Break role inheritance (remove existing permissions, keep the item unique)
            await item.breakRoleInheritance(false, true);

            console.log(`Permissions inheritance broken for item ${itemId}.`);

            // Remove specific group permissions
            for (const groupName of groupNamesToRemove) {
                try {
                    const group = await sp.web.siteGroups.getByName(groupName);
                    await item.roleAssignments.remove(group.Id);
                    console.log(`Removed permissions for group: ${groupName}`);
                } catch (error) {
                    console.error(`Error removing permissions for group ${groupName}:`, error);
                }
            }

            // Get the target SharePoint group by name
            const groupToGrant = await sp.web.siteGroups.getByName(groupNameToGrant);
            console.log(`Group ${groupNameToGrant} retrieved successfully.`);

            // Grant read access to the target group
            await item.roleAssignments.add(groupToGrant.Id, sp.web.roleDefinitions.getByName("Read").Id);
            console.log(`Read access granted to group ${groupNameToGrant} for item ${itemId}.`);

        } catch (error) {
            console.error(`Error setting permissions for item ${itemId}:`, error);
        }
    }
}
