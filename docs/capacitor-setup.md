# Capacitor Mobile Setup

Этот проект теперь поддерживает сборку под **Android** и **iOS** через [Capacitor](https://capacitorjs.com/).

## Требования

- Node.js 18+
- Android Studio (для Android)
- Xcode (для iOS, только macOS)
- `JAVA_HOME` и `ANDROID_HOME` настроены (для Android)

## Установка

Зависимости уже добавлены в `package.json`. Достаточно:

```bash
cd nodes-frontend
npm install
```

## Билд и синхронизация

```bash
# Собрать production bundle и синхронизировать с нативными проектами
npm run mobile:build

# Только синхронизировать (если веб-код не менялся)
npm run mobile:sync
```

## Запуск на Android

```bash
npm run mobile:open:android
```

Откроется Android Studio. Далее:
- **Run** → выбрать эмулятор или реальное устройство.

Для дебага с локальным Django backend в сети разработчика, убедитесь что `android:usesCleartextTraffic="true"` установлен в `AndroidManifest.xml`.

## Запуск на iOS

```bash
npm run mobile:open:ios
```

Откроется Xcode. Далее:
- Выберите target device/simulator.
- **Product → Run**.

## Архитектурные изменения

- **HashRouter** вместо BrowserRouter — необходим для работы с `file://` протоколом в WebView.
- **Capacitor plugins** инициализируются в `src/lib/capacitor.ts` перед монтированием React.
- **Safe areas** и **mobile CSS** добавлены в `src/styles/mobile.css`.
- **Deep links** настроены на схему `nodes://` для обоих платформ.
- **Android back button** обрабатывается через `@capacitor/app`.
- **Offline banner** показывается при отсутствии сети через `@capacitor/network`.

## Структура нативных проектов

- `android/` — Gradle проект, генерируется `npx cap add android`.
- `ios/` — Xcode проект, генерируется `npx cap add ios`.

Эти директории содержат нативный код и **не должны редактироваться вручную** без необходимости (Capacitor CLI перезаписывает `public/` при `cap sync`, но сохраняет нативные конфиги).

## API и CORS

- **Supabase** работает без дополнительной настройки (CORS уже разрешён).
- **Django API** должен разрешать origins: `capacitor://localhost`, `http://localhost`, `https://localhost`.
- Для разработки с HTTP (не HTTPS) включён `cleartext` в Android и iOS ATS.

## Troubleshooting

| Проблема | Решение |
|---|---|
| Белый экран после сплэша | Проверьте `base: './'` в `vite.config.ts` и `webDir: 'dist'` в `capacitor.config.ts` |
| CORS ошибки на API | Убедитесь что Django разрешает `capacitor://localhost` |
| HTTP заблокирован на Android | `android:usesCleartextTraffic="true"` в `AndroidManifest.xml` |
| HTTP заблокирован на iOS | `NSAllowsArbitraryLoads` в `Info.plist` |
| Роутер 404 при обновлении | Убедитесь что используется `HashRouter` |
| Клавиатура перекрывает поля | `@capacitor/keyboard` настроен на `KeyboardResize.Native` |

## Скрипты

| Скрипт | Описание |
|---|---|
| `npm run mobile:build` | Собрать и синхронизировать |
| `npm run mobile:sync` | Синхронизировать web assets в нативные проекты |
| `npm run mobile:open:android` | Открыть Android Studio |
| `npm run mobile:open:ios` | Открыть Xcode |
