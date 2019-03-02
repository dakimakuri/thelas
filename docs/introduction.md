# Introduction

Complicated resources (usually remote resources) are represented by code for easy creation, updating, replication, and destruction. Relationships are handled by detecting data dependencies between resources and creating them in the proper order, identifying cascading updates, and deleting them in the opposite order in which they were created. To ensure the only modifications are the ones the user expects, a diff is generated and displayed to the user (in the case of using the CLI) detailing exactly what steps will be taken to update the remote resources to match the desired state.

## Command Line Interface

The simpliest way to use Thelas is with the CLI tool. Install using npm:

```npm install -g thelas```

## Simple Example

Create a file called ```input.json```. The following ```input.json``` will create a file on disk (hello.txt) with the contents "Hello World":

```
{
  "fs.file.hello": {
    "filename": "hello.txt",
    "contents": "Hello World"
  }
}
```

Within the same folder as ```input.json```, run ```thelas apply``` to see the diff. Enter ```y``` to confirm the creation of the file. Next, modify either the filename or contents and run ```thelas apply``` again to see how the resource will be updated.
