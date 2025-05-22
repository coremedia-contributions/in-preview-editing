![CoreMedia Content Cloud Version](https://img.shields.io/static/v1?message=2412&label=CoreMedia%20Content%20Cloud&style=for-the-badge&labelColor=666666&color=672779 "This badge shows the CoreMedia version(s) this project is compatible with.
Please read the versioning section of the project to see what other CoreMedia versions are supported and how to find them.")
![Status](https://img.shields.io/static/v1?message=active&label=Status&style=for-the-badge&labelColor=666666&color=2FAC66
"The status badge describes if the project is maintained. Possible values are active and inactive.
If a project is inactive it means that the development has been discontinued and won't support future CoreMedia versions."
)

# In-Preview-Editing Extension

This Blueprint extension enables in-preview editing in Studio.


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
