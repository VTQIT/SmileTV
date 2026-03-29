import { IPTVChannel, PlaylistData } from './types';

export function parseM3U(content: string): PlaylistData {
  const lines = content.split('\n');
  const channels: IPTVChannel[] = [];
  const categoriesSet = new Set<string>();
  
  let currentChannel: Partial<IPTVChannel> = {};
  let channelCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      channelCount++;
      // Extract metadata
      const nameMatch = line.match(/,(.*)$/);
      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      const groupMatch = line.match(/group-title="([^"]*)"/);
      
      const name = nameMatch ? nameMatch[1].trim() : `Channel ${channelCount}`;
      const logo = logoMatch ? logoMatch[1] : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
      const category = groupMatch ? groupMatch[1] : 'Uncategorized';

      currentChannel = {
        id: `ch-${channelCount}-${Date.now()}`,
        name,
        logo,
        category,
        number: channelCount
      };
      
      categoriesSet.add(category);
    } else if (line.startsWith('http')) {
      if (currentChannel.name) {
        currentChannel.url = line;
        channels.push(currentChannel as IPTVChannel);
        currentChannel = {};
      }
    }
  }

  return {
    name: 'My Playlist',
    channels,
    categories: Array.from(categoriesSet).sort()
  };
}
