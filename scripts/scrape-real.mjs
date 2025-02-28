/**
 * This script scrapes the message board of the KBS TV show '생성정보'
 */

import { Command } from 'commander';
import fetch from 'node-fetch';

import { scrape } from './scrape.mjs';

const program = new Command();

program.usage('[options] [filename]')
    .description('Scrapes the message board of TV show "생생정보"')
    .option('-f --force', 'Force scraping all items')
    .parse()
    ;

async function fetchGet(url) {
    const resp = await fetch(url);
    return await resp.json();
}

const START_URL = 'https://cfpbbsapi.kbs.co.kr/board/v1/list?bbs_id=T2014-0844-04-785706&page=1';
const URL_PATTERN = 'https://cfpbbsapi.kbs.co.kr/board/v1/read_post?bbs_id=T2014-0844-04-785706&id={}&post_no=';

let savedItem;

const config = {
    DATASET_KEY: 'real',

    async nextItemKey() {
        if (savedItem) {
            return savedItem.next?.id || null;
        } else {
            const result = await fetchGet(START_URL);
            return result.data.find(item => !item.notice_order).id;
        }
    },

    async fetchItem(itemKey) {
        const no = itemKey;
        const url = URL_PATTERN.replace('{}', no);
        console.log(url);

        const result = await fetchGet(url);
        if (!result)
            return;

        savedItem = result;
        const title = result.post.post_title;
        const date = result.post.date_created;
        const body = result.post.post_contents;

        return { title, date, body };
    },

    force: program.opts().force,

    filename: program.args[0],
}

scrape(config);
