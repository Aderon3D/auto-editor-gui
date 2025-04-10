import  React from "react";
import  {useState} from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StringInput from "./StringInput";

interface CardWithFormProps {
  onFileSelect: (files: { name: string; path: string }[]) => void;
  onExportPathChange: (path: string) => void;
  onExportAsChange: (exportAs: string) => void;
  selectedFile: { name: string; path: string }[] | null;  // Updated to array for multiple files
}

const CardWithForm: React.FC<CardWithFormProps> = ({ onFileSelect, onExportPathChange, onExportAsChange, selectedFile  }) => {
  const handleFileChange = async () => {
    try {
      // Call Electron's file dialog API to open the file selection dialog
      const selectedFilePaths = await window.electron.openFileDialog();
      if (selectedFilePaths && selectedFilePaths.length > 0) {
        // Process all selected files
        const files = selectedFilePaths.map((filePath: string) => {
          // Extract file name and create file object
          const fileName = filePath.split('/').pop() || 'example.mp4';
          return {
            name: fileName,
            path: filePath, // Full file path returned by Electron
          };
        });
        onFileSelect(files);
      } else {
        // Handle case where no file is selected
        onFileSelect([{
          name: 'example.mp4',
          path: 'example.mp4',
        }]);
      }
    } catch (error) {
      console.error('File selection failed:', error);
    }
  };

// Handler for selecting the export folder
  const handleExportPathChange = async () => {
    try {
      const selectedFolderPath = await window.electron.openFolderDialog(); // Open folder dialog
      if (selectedFolderPath) {
        onExportPathChange(selectedFolderPath); // Update export path with selected folder
      }
    } catch (error) {
      console.error('Folder selection failed:', error);
    }
  };

  // Handler for export format selection
  const handleExportAsChange = (value: string) => {
    onExportAsChange(value);
  };

  const [isDisabled, setIsDisabled] = useState(false);

return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Choose video file(s)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <button onClick={handleFileChange} className="btn">Select Files</button>
          </div>
          {selectedFile && selectedFile.length > 0 && (
            <div className="flex flex-col space-y-1.5">
              <Label>Selected Files ({selectedFile.length})</Label>
              <div className="max-h-[100px] overflow-y-auto text-sm">
                {selectedFile.map((file, index) => (
                  <div key={index} className="text-xs truncate">{file.name}</div>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col space-y-1.5">
                  <div style={{ pointerEvents: 'none'}}>
            <StringInput 
              label="Export Path"
              id="exportPath"
              placeholder="output/"
              onChange={(e) => onExportPathChange(e.target.value)}
             
            />
            </div>
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="framework">Export as</Label>
            <Select onValueChange={onExportAsChange}>
              <SelectTrigger id="framework">
                <SelectValue placeholder="Premiere Pro XML" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="premiere">Premiere Pro XML</SelectItem>
                <SelectItem value="resolve-fcp7">Resolve FCP7 XML</SelectItem>
                <SelectItem value="final-cut-pro">Final Cut Pro XML</SelectItem>
                <SelectItem value="shotcut">Shotcut MLT</SelectItem>
                <SelectItem value="audio">Audio Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter />
    </Card>
  );
};
export default CardWithForm;
