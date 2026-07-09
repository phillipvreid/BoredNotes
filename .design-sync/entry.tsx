// design-sync bundle entry — the app has no dist build, so this file is the
// export surface for the design-system sync (the app itself never imports it).
export * from '../src/components/ui/Sticker';
export * from '../src/components/ui/ActionButton';
export * from '../src/components/ui/Chip';
export * from '../src/components/ui/IconSticker';
export * from '../src/components/ui/Mascot';
export * from '../src/components/ui/OutlinedNumber';
export * from '../src/components/ui/SpeechBubble';
export * from '../src/components/ui/Toast';
// Design tokens + theme hook, so consumers style their own layout glue with
// the app's real values instead of hand-copied hexes.
export * from '../src/theme/tokens';
export { useTheme } from '../src/theme/ThemeContext';
