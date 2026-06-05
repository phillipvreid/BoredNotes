import React from 'react';
import { View } from 'react-native';
import { CARD_STYLES } from './templates';
import { PassportCard } from './passport-card';
import { PhotoCard } from './photo-card';
import { SignalCard } from './signal-card';

export interface ShareCardProps {
  styleId: string;
  variantId: string;
  promptText: string;
  responseText: string;
  createdAt: string | null;
  location: string | null;
  photoUri: string | null;
  showDate: boolean;
  showLocation: boolean;
  entryMode: 'prompted' | 'freeform';
}

export const ShareCard = React.forwardRef<View, ShareCardProps>(
  ({ styleId, variantId, promptText, responseText, createdAt, location, photoUri, showDate, showLocation, entryMode }, ref) => {
    const style = CARD_STYLES.find(s => s.id === styleId) ?? CARD_STYLES[0];

    if (style.id === 'passport') {
      const variant = style.variants.find(v => v.id === variantId) ?? style.variants[0];
      return (
        <PassportCard
          ref={ref} tokens={variant.tokens}
          promptText={promptText} responseText={responseText}
          createdAt={createdAt} location={location}
          showDate={showDate} showLocation={showLocation}
          entryMode={entryMode}
        />
      );
    }
    if (style.id === 'photo') {
      const variant = style.variants.find(v => v.id === variantId) ?? style.variants[0];
      return (
        <PhotoCard
          ref={ref} tokens={variant.tokens}
          promptText={promptText} responseText={responseText}
          createdAt={createdAt} location={location} photoUri={photoUri}
          showDate={showDate} showLocation={showLocation}
          entryMode={entryMode}
        />
      );
    }
    // style.id === 'signal' — TypeScript narrows here because of discriminated union
    const variant = style.variants.find(v => v.id === variantId) ?? style.variants[0];
    return (
      <SignalCard
        ref={ref} tokens={variant.tokens}
        responseText={responseText} createdAt={createdAt}
        location={location} showDate={showDate}
        showLocation={showLocation} entryMode={entryMode}
      />
    );
  }
);
