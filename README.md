# Azure DevOps Copy Parent
This extension simply copies area, iteration and tags from the work item's parent. It works only if the creation or the update of the work item happen via the Azure DevOps UI; if a work item is created or updated through the AD APIs the information won't be copied.

## Configuration
From the `Boards` menu it is possible to access the `Copy Parent` submenu to configure the extension. There are few settings, based on that it is possible to decide to copy the parent's area, iteration, tags or any combination of them.

![Extension settings](readme-static/settings.gif "Extension settings")

## Usage
The extension will copy the parent information whenever the `Parent` field is updated, during the creation or the update of the work item.

![Child creation](readme-static/new-child.gif "Child creation")

## Launch the extension locally
All the information can be found [here](https://github.com/microsoft/azure-devops-extension-hot-reload-and-debug).