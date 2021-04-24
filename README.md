# Azure DevOps Copy Parent
This extension simply copies area, iteration and tags from the work item's parent. It works only if the creation or the update of the work item happen via the Azure DevOps UI; if a work item is created or updated through the AD APIs the information won't be copied.

## Configuration
From the `Boards` menu it is possible to access the `Copy Parent` submenu to configure the extension. There are few settings, based on that it is possible to decide to copy the parent's area, iteration, tags or any combination of them.

![Extension settings](https://github.com/simonetodisco/azure-devops-copy-parent/raw/master/readme-static/settings.gif "Extension settings")

## Usage
The extension will copy the parent information whenever the `Parent` field is updated, during the creation or the update of the work item.

![Child creation](https://raw.githubusercontent.com/simonetodisco/azure-devops-copy-parent/master/readme-static/new-child.gif "Child creation")

## Launch the extension locally
All the information can be found [here](https://github.com/microsoft/azure-devops-extension-hot-reload-and-debug).

## Changelog
All notable changes to this project will be documented in this section.

**0.2.1**
- Fix a bug that prevents the information update, in case a work item is created directly from its parent

**0.2.0**
- Initial release

## Disclaimer
Since I created this project pretty fast and sometimes understanding the APIs documentation was really difficult, please consider this as a very early beta version. In case you find bugs or you simply want to ask for new features feel free to open an issue, a PR or to [contact me](https://simonetodisco.com).
