import fs from 'fs';

/**
 * @param {object} config 
 * @param {string} config.DATASET_KEY
 * @param {string} config.nextItemKey
 * @param {string} config.fetchItem
 */
async function scrape(config) {
    // load existing data
    const DATA_FILE = new URL(import.meta.url + `/../../src/data/${config.DATASET_KEY}.json`);
    let posts = {};

    if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        posts = JSON.parse(data);
    }

    let index = 0;
    let itemKey;
    let changed = true;

    console.log('Starting scraping...');

    for (;;) {
        itemKey = await config.nextItemKey(posts);

        if (!itemKey) {
            console.log(`[${index++}] No more item to scrape. Stop scraping.`);
            break;
        }

        if (Object.prototype.hasOwnProperty.call(posts, itemKey)) {
            console.log(`[${index++}] ${itemKey} already exists. Stop scraping.`);
            break;
        }
        
        console.log(`[${index++}] ${itemKey}`);
        const item = await config.fetchItem(itemKey);
        
        posts[itemKey] = item;
        changed = true;
    }

    if (changed) {
        console.log('Saving data...');
        fs.writeFileSync(DATA_FILE, JSON.stringify(posts) + '\n');
    }
}

export { scrape };

