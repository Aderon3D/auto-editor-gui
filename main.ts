import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';

const createAutoEditorFolder = () => {
  const folderPath = path.join(process.env.APPDATA || '', 'Auto Editor Output');
  if (!fs.existsSync(folderPath)) {
    try {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`Directory created at: ${folderPath}`);
    } catch (error) {
      console.error('Error creating directory:', error);
    }
  } else {
    console.log(`Directory already exists at: ${folderPath}`);
  }
};

ipcMain.handle("dialog:openFolder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("open-folder-dialog", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});


// Helper function to get the correct Python interpreter
const getPythonPath = () => {
  const pythonPath = path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', 'Python311', 'python.exe');
  // Check if Python exists at the specified path
  if (!fs.existsSync(pythonPath)) {
    throw new Error(`Python not found at: ${pythonPath}`);
  }
  return pythonPath;
};

// Helper function to find the local Auto-Editor __main__.py script
const getAutoEditorScriptPath = () => {
  return path.join(__dirname, 'auto_editor'); // Folder containing __main__.py
};

// Helper function to find Python and Auto-Editor paths
const getPythonAndEditorPaths = () => {
  const userHomeDir = os.homedir();
  const pythonPath = path.join(userHomeDir, 'AppData', 'Local', 'Programs', 'Python', 'Python311', 'python.exe');
  const autoEditorScript = path.join(userHomeDir, 'AppData', 'Local', 'Programs', 'Python', 'Python311', 'Scripts', 'auto-editor');
  return { pythonPath, autoEditorScript };
};

const appDataPath = app.getPath('appData');  // Automatically gets the AppData path

// Define the path for the AutoEditorOutput folder
const autoEditorOutputPath = path.join(appDataPath, 'AutoEditorOutput');

// Ensure the Auto-Editor Output directory exists
const ensureAutoEditorOutputDirectory = () => {
  const appDataPath = app.getPath('appData');
  const autoEditorOutputPath = path.join(appDataPath, 'AutoEditorOutput');
  if (!fs.existsSync(autoEditorOutputPath)) {
    try {
      fs.mkdirSync(autoEditorOutputPath, { recursive: true });
      console.log(`Created folder: ${autoEditorOutputPath}`);
    } catch (error) {
      console.error(`Error creating output directory: ${error}`);
      throw new Error(`Failed to create folder: ${autoEditorOutputPath}`);
    }
  }
  return autoEditorOutputPath;
};

console.log("AppData Path:", appDataPath);  // Outputs something like "C:\\Users\\<UserName>\\AppData\\Roaming"

// Create the Electron window
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '..', 'dist/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true,
      disableDialogs: true,
      spellcheck: false,
      webviewTag: false,
      autoplayPolicy: 'no-user-gesture-required',
      experimentalFeatures: false,
      safeDialogs: true,
    },
  });

  mainWindow.loadURL('http://localhost:5173'); // Adjust based on your server URL
}

// Define the AppData output directory
const getAppDataOutputDirectory = () => {
  const appDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'AutoEditorOutput');
  if (!fs.existsSync(appDataPath)) {
    try {
      fs.mkdirSync(appDataPath, { recursive: true });
      console.log(`Output directory created: ${appDataPath}`);
    } catch (error) {
      console.error(`Error creating output directory: ${error}`);
      throw new Error(`Failed to create output directory: ${appDataPath}`);
    }
  }
  return appDataPath;
};

// Handle the request for AppData path
ipcMain.handle('get-appdata-path', () => {
  ensureAutoEditorOutputDirectory(); 
  return app.getPath('appData'); // Returns the AppData path for the user
});



ipcMain.handle('run-command', async (_event, args: string[]) => {
  const autoEditorFolder = path.join(__dirname, 'dist/auto_editor');
  
  // Extract the actual file path from the first argument
  // The first argument from frontend is in format: auto_editor "filepath"
  let inputFile = args[0];
  if (inputFile.startsWith('auto_editor')) {
    // Remove 'auto_editor' prefix and trim any whitespace
    inputFile = args[1]?.replace(/^"|"$/g, '') || '';
  } else {
    // If format is different, just use the first argument
    inputFile = inputFile.replace(/^"|"$/g, '');
  }
  
  const exportFormat = args.find((arg: string) => arg.startsWith('--export'))?.split('=')[1] || 'mp4';

  const outputFolderPath = path.join(__dirname, '..', 'output');
  
  if (!fs.existsSync(outputFolderPath)) {
    fs.mkdirSync(outputFolderPath);
    console.log(`Output folder created at: ${outputFolderPath}`);
  }

  const inputFileName = path.basename(inputFile, path.extname(inputFile));
  
  const formatExtensions: { [key: string]: string } = {
    premiere: '.xml',
    'resolve-fcp7': '.xml',
    'final-cut-pro': '.xml',
    resolve: '.xml',
    shotcut: '.mlt',
    json: '.json',
    timeline: '.timeline',
    audio: '.mp3',
    'clip-sequence': '.clip-sequence',
    mp4: '.mp4',
  };

  const fileExtension = formatExtensions[exportFormat] || '.mp4';

  // Fix the output filename to avoid duplication of 'auto_editor' in the name
  // If the inputFileName already contains 'auto_editor', don't add it again
  const outputFileName = inputFileName.includes('auto_editor') ? 
    inputFileName : 
    `${inputFileName}_edited`;
    
  const outputFilePath = path.join(outputFolderPath, `${outputFileName}${fileExtension}`);

  const command = [
    getPythonPath(),
    '-m',
    'auto_editor',
    inputFile,
    // Skip the first two arguments if they were in the format 'auto_editor "filepath"'
    // Otherwise just skip the first argument
    ...args.slice(args[0].startsWith('auto_editor') ? 2 : 1)
      .filter(arg => !arg.startsWith('--output') && arg !== 'auto_editor')
      .map(arg => arg.replace(/^"|"$/g, '')),
    '--output',
    outputFilePath
  ];

  // When using spawn with shell:true, we need to properly quote the entire command
  const quotedCommand = command.map(arg => {
    // If the argument contains spaces, wrap it in quotes
    return arg.includes(' ') ? `"${arg}"` : arg;
  });

  // Use the quoted command array when spawning the process
  console.log("Executing command:", quotedCommand.join(' '));
  
  // Log the input file to debug
  console.log("Input file path:", inputFile);
  
  // Log the input file to debug
  console.log("Input file:", inputFile);

  console.log("Executing command:", command.join(' '));

  return new Promise<string>((resolve, reject) => {
    const process = spawn(quotedCommand[0], quotedCommand.slice(1), { shell: true });

    process.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    process.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    process.on('close', (code) => {
      console.log(`Process exited with code ${code}`);
      if (code === 0) {
        resolve(`Process completed successfully with code ${code}`);
      } else {
        reject(`Process failed with code ${code}`);
      }
    });

    process.on('error', (error) => {
      console.error(`Process error: ${error.message}`);
      reject(error);
    });
  });
});


ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Videos', extensions: ['mp4', 'avi', 'mov', 'mkv'] }],
  });

  if (result.filePaths && result.filePaths.length > 0) {
    const importFolderPath = path.join(__dirname, '..', 'import');  // Root-level 'import' folder
    if (!fs.existsSync(importFolderPath)) {
      fs.mkdirSync(importFolderPath, { recursive: true });
      console.log(`Import folder created at: ${importFolderPath}`);
    }

    // Process all selected files
    const newFilePaths = result.filePaths.map(selectedFilePath => {
      const fileName = path.basename(selectedFilePath);
      const newFilePath = path.join(importFolderPath, fileName);

      fs.copyFileSync(selectedFilePath, newFilePath);
      console.log(`File moved to: ${newFilePath}`);
      
      return newFilePath;
    });
    
    return newFilePaths;  // Return array of new file paths in the import folder
  } else {
    throw new Error('No files selected');
  }
});

app.whenReady().then(() => {
  createAutoEditorFolder();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
