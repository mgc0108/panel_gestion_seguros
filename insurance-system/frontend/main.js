const { app, BrowserWindow } = require('electron');
const path = require('path');

// Desactivar aceleración de hardware para evitar parpadeos en algunos PCs
app.disableHardwareAcceleration();

function createWindow() {
  const win = new BrowserWindow({
    width: 1300, // Un poco más ancho para tu diseño de 4 columnas
    height: 900,
    title: "InsuranceSync",
    show: false,
    icon: path.join(__dirname, 'public/icon.ico'), // Opcional, si llegas a ponerlo
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false
    }
  });

  // Ocultar menú superior para que parezca una App profesional
  win.setMenu(null);

  // --- LÓGICA DE CARGA ---
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    // En desarrollo usa el servidor de Vite
    win.loadURL('http://localhost:5173');
  } else {
    // En el EXE final, busca el index.html dentro de la carpeta dist
    // Usamos join con __dirname para que la ruta sea relativa al ejecutable
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // --- OPTIMIZACIÓN DE RENDERIZADO ---
  win.once('ready-to-show', () => {
    win.show();
    win.focus();
    
    // Tu truco para forzar el repintado de Tailwind/Vite
    setTimeout(() => {
      if (!win.isDestroyed()) {
        const size = win.getSize();
        win.setSize(size[0], size[1] + 1);
        win.setSize(size[0], size[1]);
      }
    }, 500);
  });

  win.on('blur', () => {
    win.webContents.executeJavaScript('window.dispatchEvent(new Event("resize"));');
  });
}

// Identificador para notificaciones en Windows
if (process.platform === 'win32') {
  app.setAppUserModelId("InsuranceSync");
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.whenReady().then(createWindow);