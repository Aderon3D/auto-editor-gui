# 🎥 Auto-Editor GUI

Welcome to the **Auto-Editor GUI** project! 🎉 This is a modified version of the original Auto-Editor, designed to provide a user-friendly graphical interface for editing videos using the Auto-Editor CLI tool. 🚀


## 📸 Screenshots

### 🗒️ Initial Screenshot (10/22)
![Initial Screenshot](https://i.imgur.com/I6CT4By.png)


## 🛠️ Changes Made

- **GUI Implementation**: Integrated a React-based graphical user interface to simplify video editing tasks. 🎨
- **File Selection**: Added functionality for users to easily select video files through a file input instead of using command-line prompts. 📂
- **Real-time Feedback**: Implemented real-time logging to display command execution results and errors in the UI. 📜
- **Enhanced User Experience**: Improved the layout and design using Tailwind CSS and Shadcn for a modern look and feel. ✨
- **Dark Mode Default**: Set dark mode as the default theme for better visibility in various lighting conditions. 🌙


## 🌟 Features

- User-friendly interface for video editing. 🎬
- Easy selection of video files. 🖱️
- Clear logging of actions and results. 📊
- Modern UI components with Tailwind CSS. 🛠️
- Built-in dark mode for comfortable viewing. 🌒

## 📁 Project Structure

```
auto-editor-gui/
├── frontend/                # Contains the React application
│   ├── src/                # Source files for the React app
│   ├── public/             # Public assets
│   ├── package.json        # Dependencies for the frontend
│   └── ...
├── main.ts                 # Main Electron process file
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies for the entire project
```

## 🚀 Getting Started

### 🔧 Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (>= 14.x)
- [Electron](https://www.electronjs.org/) (for building the app; we'll integrate this later as a dependency)
- [Auto-Editor CLI](https://github.com/WZBSocialScienceCenter/auto-editor) (installed via `pip`)
- [Python](https://www.python.org/) (required for the Auto-Editor CLI)


### 📝 Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/yourusername/auto-editor-gui.git
   cd auto-editor-gui
   ```

2. Install the Auto-Editor CLI:

   ```bash
   pip install .
   ```

3. Install dependencies for the root directory:

   ```bash
   npm install
   ```

4. Navigate to the `frontend` folder and install dependencies:

   ```bash
   cd frontend
   npm install
   ```

5. Navigate back to the root directory, compile TypeScript files for the main Electron process:

   ```bash
   cd..
   npx tsc
   ```

6. To run the Electron app:

   ```bash
   npm run electron
   ```



### 📽️ Using the Application

1. Select a video file using the "Select a video file" button. 🖼️
2. Click the "Start Editing" button to process the selected video using the Auto-Editor CLI. 🛠️
3. View the logs for feedback and results in the application window. 📈

## 🤝 Contribution

Contributions are welcome! If you have suggestions or improvements, feel free to submit a pull request. 💡

## 🙏 Acknowledgments

- Thanks to the original developers of Auto-Editor for creating the CLI tool. ❤️
- Inspired by the community and developers contributing to open-source projects. 🌍

---
