/**
 * Emoji mapping for text-based emojis
 * Converts text emojis like :) to actual emoji characters
 */

const emojiMap: Record<string, string> = {
  ':)': '😊',
  ':-)': '😊',
  ':(': '😢',
  ':-(': '😢',
  ':D': '😃',
  ':-D': '😃',
  ':P': '😛',
  ':-P': '😛',
  ';)': '😉',
  ';-)': '😉',
  ':O': '😮',
  ':-O': '😮',
  ':|': '😐',
  ':-|': '😐',
  ':/': '😕',
  ':-/': '😕',
  ':\\': '😕',
  ':-\\': '😕',
  ':*': '😘',
  ':-*': '😘',
  '<3': '❤️',
  '</3': '💔',
  '>:(': '😠',
  '>:-(': '😠',
  ":'(": '😭',
  ":'-(": '😭',
  xD: '😆',
  XD: '😆',
  o_O: '😳',
  O_O: '😳',
  o_o: '😳',
  O_o: '😳',
  '^_^': '😊',
  '^^': '😊',
  '-_-': '😑',
  T_T: '😭',
  t_t: '😭',
  '>:)': '😈',
  '>:-)': '😈',
  'B)': '😎',
  'B-)': '😎',
  ':3': '😊',
  ':-3': '😊',
  '8)': '😎',
  '8-)': '😎',
  '=)': '😊',
  '=-)': '😊',
  '=(': '😢',
  '=-(': '😢',
};

/**
 * Convert text emojis to actual emoji characters
 */
export function convertTextEmojis(text: string): string {
  let result = text;

  // Sort by length (longest first) to avoid partial matches
  const sortedEntries = Object.entries(emojiMap).sort((a, b) => b[0].length - a[0].length);

  for (const [textEmoji, emoji] of sortedEntries) {
    // Use word boundaries or whitespace to avoid matching inside words
    const regex = new RegExp(
      `(^|[^\\w])${textEmoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\w]|$)`,
      'g',
    );
    result = result.replace(regex, (match, before, after) => {
      return `${before}${emoji}${after}`;
    });
  }

  return result;
}
