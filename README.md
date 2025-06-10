![CoreMedia Content Cloud Version](https://img.shields.io/static/v1?message=2412&label=CoreMedia%20Content%20Cloud&style=for-the-badge&labelColor=666666&color=672779 "This badge shows the CoreMedia version(s) this project is compatible with.
Please read the versioning section of the project to see what other CoreMedia versions are supported and how to find them.")
![Status](https://img.shields.io/static/v1?message=active&label=Status&style=for-the-badge&labelColor=666666&color=2FAC66
"The status badge describes if the project is maintained. Possible values are active and inactive.
If a project is inactive it means that the development has been discontinued and won't support future CoreMedia versions."
)

# In-Preview-Editing Extension

This Blueprint extension enables in-preview editing in Studio.

![In-Preview-Editing in Studio](/docs/images/in-preview-editing-studio.png "In-Preview-Editing in Studio")

The extension adds a new button to the preview toolbar that allows to toggle in-preview-editing mode. In this mode, the user can edit properties of the displayed content directly in the Studio preview. The changes are saved automatically and can be previewed in real-time. String properties are editable in place, while other properties are opened in a dialog.

## Installation

- From the project's root folder, clone this repository as a submodule of the `extensions` folder.
- Make sure to use the branch name that matches your workspace version. 
```
git submodule add https://github.com/coremedia-contributions/in-preview-editing modules/extensions/in-preview-editing
```

- Use the extension tool in the root folder of the project to link the modules to your workspace.
 ```
mvn -f workspace-configuration/extensions com.coremedia.maven:extensions-maven-plugin:LATEST:sync -Denable=in-preview-editing
```

## How to enable In-Preview Editing
1. To enable in-preview editing, you need to add the `InPreviewEditingStudioPlugin` to your Studio plugin configuration. This can be done by following the installation steps above.
    - See [In-Preview-Editing Studio Plugin](apps/studio-client/apps/main/in-preview-editing/README.md) for more details on how to register custom property editors for the editor overlay
2. As a second step, you need to add the `in-preview-editing-support` package to your frontend client. This package provides the necessary frontend functionality to support in-preview editing in Studio preview.
    - See [In-Preview-Editing Support](packages/in-preview-editing-support/README.md) for more details on how to install and use this package.
