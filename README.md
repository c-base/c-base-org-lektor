# c-base-org-lektor


## How to setup the development environment?

(For Windows, see more detailed instructions below)

  - Install uv
  - clone this repository
  - run `uv sync --all-extras --dev` inside the repository's root folder

Lektor comes with a built-in GUI to edit the site's contents. For this, the development server is needed.

To start the development server:
  - run it directly inside the `uv` virtual env: `uv run lektor server --browse`
  - Otherwise you can activate the virtuel env by running `poetry shell` and then run `lektor server`.


## Install on Windows

- get the Python stable (Python 3.10.x) installer and install Python: https://python.org
  - make sure to select `[x] Add Python to PATH` and `[x] Disable filename length limit` in the installer.
- get and install Git from https://git-scm.com/
  - install with all the recommended settings
- get and install Visual Studio Code: https://code.visualstudio.com/
  - On first run, install the Microsoft Python extension via the Extensions menu (icon bar on the left side)

- install ub via the command in the Windows PowerShell described here: https://docs.astral.sh/uv/getting-started/installation/#__tabbed_1_2

``` 
https://docs.astral.sh/uv/getting-started/installation/#__tabbed_1_2
```

The following steps might be necessary on Windows but have not been recently tested:

- Add the poetry installation directory to the PATH environment variable (German "Umgebungsvariablen"):
  - Add the following entry to %PATH%: `%APPDATA%\Python\Scripts`
- Allow the execution of Powershell-Scripts (this is needed to activate the virtualenv)
  ``Set-ExecutionPolicy -ExecutionPolicy Unrestriced 
- Set the location where virtualenvs will be created to be `$project_dir/.venv`:
   - `poetry config virtualenvs.in-project true`
- Use VS Code to clone the project to a local project directory
- After cloning, open a new Terminal windows in VSCode and run `uv sync --all-extras --dev` in the VS Code terminal. That should create the venv.

## Create `launch.json`:

Create a file called `.vscode/launch.json` in your project directory that contains this:

```
{
    // Use IntelliSense to learn about possible attributes.
    // Hover to view descriptions of existing attributes.
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Python: Module",
            "type": "python",
            "request": "launch",
            "module": "lektor",
            "args": ["server", "--browse"],
            "justMyCode": true
        }
    ]
}
```

With this you can start and stop the lektor server directly from VSCode's "Run & Debug" menu.

