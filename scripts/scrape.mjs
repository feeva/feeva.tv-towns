import fs from 'fs';
import { compile } from 'html-to-text';

// Only scrape posts from the last 5 years
const START_TIME = new Date().getTime() - 1000 * 60 * 60 * 24 * 365 * 5;
const htmlToText = compile({
    selectors: [
        { selector: 'p', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
        { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
    ],
});

/**
 * @param {object} config 
 * @param {string} config.DATASET_KEY
 * @param {string} config.nextItemKey
 * @param {string} config.fetchItem
 */
async function scrape(config) {
    // load existing data
    const DATA_FILE = config.filename ?? new URL(import.meta.url + '/../../src/data/posts.json');
    let posts = {};
    let changed = false;

    if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        posts = JSON.parse(data);

        // remove old posts
        Object.keys(posts).forEach(key => {
            const time = new Date(posts[key].date).getTime();
            if (time < START_TIME) {
                delete posts[key];
                changed = true;
            }
        });
    }

    let index = 0;
    let itemKey;

    console.log('Starting scraping...');

    for (;;) {
        itemKey = await config.nextItemKey(posts);

        if (!itemKey) {
            console.log(`[${index++}] No more item to scrape. Stop scraping.`);
            break;
        }

        const key = `${config.DATASET_KEY}-${itemKey}`;

        if (!config.force && posts[key]) {
            console.log(`[${index++}] ${itemKey} already exists`);
            break;
        }
        
        const item = await config.fetchItem(itemKey);
        item.body = htmlToText(item.body)
                    .replace(item.title, '').trim() // remove title from body
                    .replace(/\xa0/g, ' ') // replace non-breaking space with normal space
                    .replace(/( *\n){2,}/g, '\n\n') // replace multiple newlines with two newlines

        const time = new Date(item.date).getTime();

        if (time < START_TIME) {
            console.log(`[${index++}] ${itemKey} is too old. Stop scraping.`);
            break;
        }
        
        console.log(`[${index++}] ${itemKey} - ${item.title}`);
        posts[key] = item;
        changed = true;
    }

    if (changed) {
        console.log('Saving data...');
        fs.writeFileSync(DATA_FILE, JSON.stringify(posts) + '\n');
    }
}

export { scrape };

