import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Platform } from 'react-native';

export function ExternalLink(
  props: Omit<React.ComponentProps<typeof Link>, 'href'> & { href: string }
) {
  return (
    <Link
      target="_blank"
      {...props}
      // @ts-expect-error: URL-urile externe nu sunt tipizate
      href={props.href}
      onPress={(e) => {
        if (Platform.OS !== 'web') {
          // previne comportamentul default de link la browser-ul default pe native  
          e.preventDefault();
          // deschide link-ul in browser-ul din app
          WebBrowser.openBrowserAsync(props.href as string);
        }
      }}
    />
  );
}
