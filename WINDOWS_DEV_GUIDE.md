# Windows Development Guide

## 🖥️ Windows-Specific Setup & Troubleshooting

This guide addresses common Windows development issues, particularly symlink problems that can occur with OneDrive and Next.js.

### ⚡ Quick Fix for Symlink Errors

If you encounter `EINVAL: invalid argument, readlink` errors:

```bash
# Clean restart (recommended)
npm run dev:clean

# Or full refresh
npm run dev:fresh
```

### 🛠️ Prevention Measures Implemented

#### 1. Next.js Configuration (`next.config.mjs`)
- **Symlinks disabled**: `config.resolve.symlinks = false`
- **Windows-specific caching**: Filesystem cache with polling
- **Watch options**: Proper file watching for Windows
- **OneDrive compatibility**: Prevents sync conflicts

#### 2. Development Scripts (`package.json`)
```json
{
  "dev:clean": "Clean .next directory and start dev server",
  "dev:fresh": "Full clean including caches",
  "clean": "Manual cleanup script"
}
```

#### 3. Git Configuration (`.gitignore`)
- Windows-specific file exclusions
- OneDrive sync prevention
- Symlink protection

### 🔧 Manual Troubleshooting

#### If Problems Persist:

1. **Pause OneDrive Sync** (Temporary)
   - Right-click OneDrive icon in system tray
   - Select "Settings" → "Account" → "Choose folders"
   - Temporarily uncheck your project folder
   - Re-enable after development session

2. **Administrator Mode** (If needed)
   - Run terminal as Administrator
   - Execute: `npm run dev:clean`

3. **Developer Mode** (Permanent fix)
   - Open Settings → Update & Security → For Developers
   - Enable "Developer Mode"
   - This allows symlink creation without elevation

#### Emergency Commands:
```bash
# Force remove .next directory
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
Remove-Item -Recurse -Force node_modules
npm install
```

### 📁 OneDrive Best Practices

#### Recommended OneDrive Settings:
1. **Files On-Demand**: Enable to reduce local storage
2. **Selective Sync**: Exclude `node_modules` and `.next` folders
3. **Backup Settings**: Disable automatic backup for dev folders

#### Project Structure Recommendations:
```
📁 OneDrive/
  └── 📁 Documents/
      └── 📁 Development/        ← Safe for code
          └── 📁 dopamine-detox/
📁 C:/Development/               ← Alternative location
  └── 📁 dopamine-detox/        ← No OneDrive conflicts
```

### ⚠️ Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| `readlink EINVAL` | Corrupted symlinks | `npm run dev:clean` |
| Watch mode not working | OneDrive interference | Pause sync temporarily |
| Cache issues | Windows file locking | `npm run dev:fresh` |
| Permission errors | UAC restrictions | Run as Administrator |
| Slow file operations | OneDrive scanning | Exclude dev folders |

### 🚀 Recommended Development Workflow

```bash
# 1. Start development (with cleanup)
npm run dev:clean

# 2. If issues occur during development
npm run clean && npm run dev

# 3. For persistent issues
# Pause OneDrive sync, then:
npm run dev:fresh
```

### 💡 Performance Tips

1. **Use SSD**: Place projects on SSD for faster I/O
2. **Exclude from OneDrive**: Move active projects outside OneDrive
3. **Windows Defender**: Add project folder to exclusions
4. **WSL Alternative**: Consider WSL2 for Unix-like environment

### 🔗 Useful Links

- [Next.js Windows Issues](https://nextjs.org/docs/getting-started/installation#windows)
- [OneDrive Sync Issues](https://docs.microsoft.com/en-us/onedrive/sync-client-files-on-demand)
- [Windows Developer Mode](https://docs.microsoft.com/en-us/windows/apps/get-started/enable-your-device-for-development)

---

**Need Help?** Check the main [README.md](./README.md) or create an issue with your error details.
