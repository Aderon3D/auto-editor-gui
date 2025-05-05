import React, { useState, useEffect } from 'react';
import CardWithForm from './InputCard';
import CardWithArguments from './ArgumentsCard';

interface ExportXMLProps {
  onFileSelect: (files: { name: string; path: string }[] | null) => void;
  onCommandChange: (command: string) => void;
  onExportPathChange: (path: string) => void;
  setAlert: React.Dispatch<React.SetStateAction<{ message: string, type: 'normal' | 'error' | 'success' | null } | null>>;  // Prop to set alert
}

interface CommandResult {
  success: boolean;
  message?: string;
}


const ExportXML: React.FC<ExportXMLProps> = ({ onFileSelect, onCommandChange, onExportPathChange, setAlert  }) => {
  const [selectedFile, setSelectedFile] = useState<{ name: string; path: string }[] | null>(null);
  const [exportAs, setExportAs] = useState<string>('premiere');
  const [exportPath, setExportPath] = useState<string>('');
  const [loudness, setLoudness] = useState<number>(-19);
  const [margin, setMargin] = useState<number>(0);
  const [previewStats, setPreviewStats] = useState<{originalDuration?: string, newDuration?: string, percentCut?: number} | null>(null);
  // Add state for individual video statistics
  const [videoStats, setVideoStats] = useState<{name: string, originalDuration?: string, newDuration?: string, percentCut?: number}[]>([]);
  

  // Fetch the AppData path when the component mounts
  useEffect(() => {
    const fetchAppDataPath = async () => {
      try {
        const appDataPath = await window.electron.getAppDataPath();
        const defaultExportPath = `\\output`;
        setExportPath(defaultExportPath);
        onExportPathChange(defaultExportPath);
      } catch (error) {
        console.error('Failed to get AppData path:', error);
      }
    };
    fetchAppDataPath();
  }, [onExportPathChange]);

const buildCommand = (): string => {
  // If no files are selected, use example.mp4
  if (!selectedFile || selectedFile.length === 0) {
    return `auto_editor "example.mp4" --export ${exportAs} --edit audio:${loudness}dB --margin ${margin}s`;
  }
  
  // If only one file is selected, build a single command
  if (selectedFile.length === 1) {
    const quotedInputFile = `"${selectedFile[0].path}"`; // Ensure the path is quoted
    return `auto_editor ${quotedInputFile} --export ${exportAs} --edit audio:${loudness}dB --margin ${margin}s`;
  }
  
  // If multiple files are selected, show the number of files in the command
  return `auto_editor [${selectedFile.length} files selected] --export ${exportAs} --edit audio:${loudness}dB --margin ${margin}s`;
};


  // Handle file selection
  const handleFileSelect = (files: { name: string; path: string }[] | null) => {
    setSelectedFile(files);
    onFileSelect(files);
    const command = buildCommand();
    onCommandChange(command);
  };

  // Handle export (loudness and margin changes)
  const handleExport = async (loud: number, marg: number) => {
    setLoudness(loud);
    setMargin(marg);
    const command = buildCommand();
    onCommandChange(command);
    setAlert({ message: 'Exporting video...', type: 'normal' }); // Show "Exporting" alert
    await runAutoEditor(command);
  };

  const handleApply = (loud: number, marg: number) => {
    // Directly use loud and marg for building the command
    const command = `auto_editor "${selectedFile?.[0]?.path ?? 'example.mp4'}" --export ${exportAs} --edit audio:${loud}dB --margin ${marg}s`;
    setLoudness(loud); // Update state
    setMargin(marg);   // Update state
    onCommandChange(command);
  };

  useEffect(() => {
  const command = buildCommand();
  onCommandChange(command);
}, [selectedFile, exportAs, loudness, margin]);



const runAutoEditor = async (command: string) => {
  if (!selectedFile || selectedFile.length === 0) {
    setAlert({ message: 'No files selected for processing.', type: 'error' });
    return;
  }

  try {
    // If multiple files are selected, process them sequentially
    if (selectedFile.length > 1) {
      setAlert({ message: `Processing ${selectedFile.length} files...`, type: 'normal' });
      
      let successCount = 0;
      let failCount = 0;
      const newVideoStats: {name: string, originalDuration?: string, newDuration?: string, percentCut?: number}[] = [];
      
      // Process each file sequentially
      for (let i = 0; i < selectedFile.length; i++) {
        const file = selectedFile[i];
        // Add --stats flag to get statistics for each file
        const singleFileCommand = `auto_editor "${file.path}" --export ${exportAs} --edit audio:${loudness}dB --margin ${margin}s --stats`;
        // Parse the command string to preserve quoted paths
        const commandArgs = [];
        let currentArg = '';
        let inQuotes = false;
        
        for (let i = 0; i < singleFileCommand.length; i++) {
          const char = singleFileCommand[i];
          
          if (char === '"') {
            inQuotes = !inQuotes;
            currentArg += char; // Keep the quotes in the argument
          } else if (char === ' ' && !inQuotes) {
            if (currentArg) {
              commandArgs.push(currentArg);
              currentArg = '';
            }
          } else {
            currentArg += char;
          }
        }
        
        if (currentArg) {
          commandArgs.push(currentArg);
        }
        
        console.log('Parsed command args for file:', file.name, commandArgs);
        
        setAlert({ message: `Processing file ${i+1}/${selectedFile.length}: ${file.name}`, type: 'normal' });
        
        try {
          const result = await window.electron.runCommand(commandArgs);
          if (typeof result === 'string' && result.includes('Process completed successfully with code 0')) {
            successCount++;
            
            // Extract statistics for this file
            const originalMatch = result.match(/Original duration: ([\d:\.]+)/);
            const newMatch = result.match(/New duration: ([\d:\.]+)/);
            const percentMatch = result.match(/Percent cut: ([\d\.]+)%/);
            
            // Add stats for this file
            newVideoStats.push({
              name: file.name,
              originalDuration: originalMatch ? originalMatch[1] : undefined,
              newDuration: newMatch ? newMatch[1] : undefined,
              percentCut: percentMatch ? parseFloat(percentMatch[1]) : undefined
            });
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          failCount++;
        }
      }
      
      // Update the video stats state with all processed files
      setVideoStats(newVideoStats);
      
      // Show summary of processing results
      if (failCount === 0) {
        setAlert({ message: `All ${successCount} files processed successfully!`, type: 'success' });
      } else {
        setAlert({ message: `Processed ${successCount} files successfully, ${failCount} files failed.`, type: 'error' });
      }
      
      return;
    }
    
    // Process single file
    console.log('Running command:', command);
    // Modify command to include stats flag
    const singleFileCommand = `auto_editor "${selectedFile[0].path}" --export ${exportAs} --edit audio:${loudness}dB --margin ${margin}s --stats`;
    
    // Parse the command string to preserve quoted paths
    const commandArgs = [];
    let currentArg = '';
    let inQuotes = false;
    
    for (let i = 0; i < singleFileCommand.length; i++) {
      const char = singleFileCommand[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
        currentArg += char; // Keep the quotes in the argument
      } else if (char === ' ' && !inQuotes) {
        if (currentArg) {
          commandArgs.push(currentArg);
          currentArg = '';
        }
      } else {
        currentArg += char;
      }
    }
    
    if (currentArg) {
      commandArgs.push(currentArg);
    }
    
    console.log('Parsed command args:', commandArgs);
    const result = await window.electron.runCommand(commandArgs); // Run the command

    console.log('Command executed with result:', result);

    // Check if the result is a string (i.e., command output)
    if (typeof result === 'string') {
      // Check for the success message in the result
      if (result.includes('Process completed successfully with code 0')) {
        // Extract statistics for this file
        const originalMatch = result.match(/Original duration: ([\d:\.]+)/);
        const newMatch = result.match(/New duration: ([\d:\.]+)/);
        const percentMatch = result.match(/Percent cut: ([\d\.]+)%/);
        
        // Create stats for this file
        const newStats = {
          name: selectedFile[0].name,
          originalDuration: originalMatch ? originalMatch[1] : undefined,
          newDuration: newMatch ? newMatch[1] : undefined,
          percentCut: percentMatch ? parseFloat(percentMatch[1]) : undefined
        };
        
        // Update the video stats state with this file
        setVideoStats([newStats]);
        
        setAlert({ message: 'File processed successfully!', type: 'success' });
      } else {
        // If the result includes any error message, show error alert
        setAlert({ message: result, type: 'error' });
      }
    } else {
      // Handle unexpected result format
      setAlert({ message: 'Unexpected result format.', type: 'error' });
    }

  } catch (error: unknown) {
    console.error('Error executing command:', error);

    // Handle different error types
    if (error instanceof Error) {
      setAlert({ message: `Error: ${error.message}`, type: 'error' });
    } else {
      setAlert({ message: 'An unknown error occurred.', type: 'error' });
    }
  }
};



  // Add a new function to generate preview
  const handlePreview = async (loud: number, marg: number) => {
    if (!selectedFile || selectedFile.length === 0) {
      setAlert({ message: 'No files selected for preview.', type: 'error' });
      return;
    }

    setAlert({ message: 'Generating preview...', type: 'normal' });
    
    try {
      // Use the first file for preview if multiple are selected
      const file = selectedFile[0];
      // Add --stats flag to the command to get statistics without processing the full video
      const previewCommand = `auto_editor "${file.path}" --export ${exportAs} --edit audio:${loud}dB --margin ${marg}s --stats`;
      
      // Parse the command to preserve quoted paths
      const commandArgs = [];
      let currentArg = '';
      let inQuotes = false;
      
      for (let i = 0; i < previewCommand.length; i++) {
        const char = previewCommand[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
          currentArg += char;
        } else if (char === ' ' && !inQuotes) {
          if (currentArg) {
            commandArgs.push(currentArg);
            currentArg = '';
          }
        } else {
          currentArg += char;
        }
      }
      
      if (currentArg) {
        commandArgs.push(currentArg);
      }
      
      console.log('Running preview command:', commandArgs);
      
      const result = await window.electron.runCommand(commandArgs);
      
      // Parse the result to extract statistics
      // This is a simplified example - you'll need to adapt based on actual output format
      if (typeof result === 'string') {
        // Example parsing - adjust based on actual output format
        const originalMatch = result.match(/Original duration: ([\d:\.]+)/);
        const newMatch = result.match(/New duration: ([\d:\.]+)/);
        const percentMatch = result.match(/Percent cut: ([\d\.]+)%/);
        
        setPreviewStats({
          originalDuration: originalMatch ? originalMatch[1] : undefined,
          newDuration: newMatch ? newMatch[1] : undefined,
          percentCut: percentMatch ? parseFloat(percentMatch[1]) : undefined
        });
        
        setAlert({ 
          message: `Preview generated. ${percentMatch ? `Approximately ${percentMatch[1]}% will be cut.` : ''}`, 
          type: 'success' 
        });
      } else {
        setAlert({ message: 'Failed to generate preview.', type: 'error' });
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      setAlert({ message: 'Error generating preview.', type: 'error' });
    }
  };

  return (
    <div>
      <div className="flex sm:flex-row flex-col gap-2">
        <CardWithForm 
          onFileSelect={setSelectedFile} 
          onExportAsChange={setExportAs} 
          onExportPathChange={setExportPath} 
          selectedFile={selectedFile}
        />
        <CardWithArguments 
          onExport={handleExport}
          onApply={handleApply}
          onPreview={handlePreview} // Add the preview handler
        />
      </div>
      
      {/* Display preview statistics if available */}
      {previewStats && (
        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Preview Statistics</h3>
          <div className="grid grid-cols-2 gap-2">
            {previewStats.originalDuration && (
              <>
                <div className="text-gray-600 dark:text-gray-400">Original Duration:</div>
                <div>{previewStats.originalDuration}</div>
              </>
            )}
            {previewStats.newDuration && (
              <>
                <div className="text-gray-600 dark:text-gray-400">New Duration:</div>
                <div>{previewStats.newDuration}</div>
              </>
            )}
            {previewStats.percentCut !== undefined && (
              <>
                <div className="text-gray-600 dark:text-gray-400">Percent Cut:</div>
                <div>{previewStats.percentCut.toFixed(2)}%</div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Display individual video statistics if available */}
      {videoStats.length > 0 && (
        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Processed Video Statistics</h3>
          
          {videoStats.map((stat, index) => (
            <div key={index} className="mb-4 border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
              <h4 className="font-medium text-base mb-2">{stat.name}</h4>
              <div className="grid grid-cols-2 gap-2">
                {stat.originalDuration && (
                  <>
                    <div className="text-gray-600 dark:text-gray-400">Original Duration:</div>
                    <div>{stat.originalDuration}</div>
                  </>
                )}
                {stat.newDuration && (
                  <>
                    <div className="text-gray-600 dark:text-gray-400">New Duration:</div>
                    <div>{stat.newDuration}</div>
                  </>
                )}
                {stat.percentCut !== undefined && (
                  <>
                    <div className="text-gray-600 dark:text-gray-400">Percent Cut:</div>
                    <div>{stat.percentCut.toFixed(2)}%</div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExportXML;
