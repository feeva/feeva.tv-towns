import fs from 'fs';

const ADMIN_FILE = new URL(import.meta.url + `/../../src/data/administrative.txt`);
const content = fs.readFileSync(ADMIN_FILE, 'utf8');
const adminLines = content.split(/\r?\n/g);
const sido = [], sigungu = [];

for (let i = 0; i < adminLines.length; ++i) {
    const l = adminLines[i];
    if (l) {
        const items = l.split(/\t/g);
        if (l.charAt(0) === '\t') {
            sigungu.push(items[2]);
        } else {
            for (let j = 1; j < items.length; ++j)
                sido.push(items[j]);
        }
    }
}

const ADDRESS_PATTERN = new RegExp('((' + sido.join('|') + ')[가-힣 \\t]+?(' + sigungu.join('|') + ')|세종)[가-힣 \\t\\w]+?[시군구읍면동길로리][가-힣 \\t\\w\\-]+', 'g');
// console.log('Adress pattern: ' + ADDRESS_PATTERN);

/**
 * Find Korean addresses in the text
 * @param {string} text 
 * @returns {string[]}
 */
function findAddresses(text) {
    const matches = text.matchAll(ADDRESS_PATTERN);
    const addresses = [];
    for (const match of matches) {
        addresses.push(match[0].trim());
    }

    return addresses;
}

export { findAddresses };

