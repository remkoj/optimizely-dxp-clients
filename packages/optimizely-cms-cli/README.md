# Optimizely CMS Command Line Toolkit
A collection of Command Line tools used to increase productivity when working with the Optimizely CMS from a TypeScript / JavaScript based frontend.

## Installing

## General parameters
All commands share these parameters that configure the frontend environment. 

## Available commands
The following commands are available, you can always run `opti-cms --help` or `opti-cms [command] --help` to see all information for the CLI utility or command.

| Command | Description |
| --- | --- |
|`types:pull`| Read all existing content types from the Optimizely CMS and create their representation within the codebase. Use the parameters of this method to control which types will be pulled and to allow overwriting of existing files. |
|`types:push`| Create or overwrite the content type defintions from the codebase into Optimizely CMS, use the parameters of this method to control which types will be transferred and whether destructive changes are allowed. |
