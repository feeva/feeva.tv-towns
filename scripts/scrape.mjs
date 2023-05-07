import fs from 'fs';

const SCRAPE_YEAR = 5;

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
    const year = new Date().getFullYear();

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
        
        const item = await config.fetchItem(itemKey);

        if (year - item.date.slice(0, 4) > SCRAPE_YEAR) {
            console.log(`[${index++}] ${itemKey} is too old. Stop scraping.`);
            break;
        }
        
        console.log(`[${index++}] ${itemKey} - ${item.title}`);
        posts[itemKey] = item;
        changed = true;
    }

    if (changed) {
        console.log('Saving data...');
        fs.writeFileSync(DATA_FILE, JSON.stringify(posts) + '\n');
    }
}

export { scrape };

