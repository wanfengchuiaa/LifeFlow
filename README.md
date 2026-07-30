# LifeFlow

## First version: local mode

The first version runs without a server. Records are stored in the browser's IndexedDB and can be migrated with the JSON backup tools in Settings.

Run the frontend with `pnpm dev`.

To try it on an iPhone without a Mac, connect the phone and computer to the same Wi-Fi, run `pnpm dev -- --host 0.0.0.0`, then open `http://<电脑局域网IP>:5173` in Safari and choose Share > Add to Home Screen.

For a production build, run `pnpm build`. The generated `dist` directory can be hosted as a static PWA and wrapped with Capacitor for iOS or Android later.

## Native packaging

Capacitor projects are included under `android/` and `ios/`.

```powershell
pnpm cap:sync
pnpm cap:open:android
pnpm cap:open:ios
```

Android APK/AAB builds require Android Studio and an Android SDK. iOS signing and IPA builds require macOS, Xcode, and an Apple Developer account. Both native targets load the same `dist` build and keep data in the device WebView's IndexedDB; use Settings > Export JSON before moving between devices.

个人生活管理 PWA，包含健康、待办、财务、日程和运势模块。核心数据保存在浏览器 IndexedDB 中。

## 本地运行

```powershell
pnpm install
pnpm dev
```

## 运势接口

第一版默认使用本地数据，所有记录保存在浏览器 IndexedDB。运势、黄历和星座速览使用本地生成数据，不依赖网络；后续可在不改变导出格式的前提下接入同步服务。

在“设置与本地数据”中可以导出或导入完整 JSON 备份。备份包含设置、健康、待办、财务、日程和时间记录，适合换设备时迁移。
