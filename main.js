const { app, BrowserWindow } = require('electron')

try {
    const createWindow = () => {
        const win = new BrowserWindow({
            width: 1600,
            height: 900,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        })
    
        win.loadFile('index.html')
    }
    
    app.whenReady().then(() => {
        createWindow()
    })
    
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit()
    })
} catch (error) {
    console.error(error);
}
