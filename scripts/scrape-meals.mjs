/**
 * This script scrapes the message board of the TV Chosun show '백반기행'
 */

import * as cheerio from 'cheerio';
import { Command } from 'commander';
import fetch from 'node-fetch';

import { scrape } from './scrape.mjs';

const program = new Command();

program.usage('[options] [filename]')
    .description('Scrapes the message board of TV show "백반기행"')
    .option('-f --force', 'Force scraping all items')
    .parse()
    ;

async function fetchGet(url) {
    const resp = await fetch(url);
    return await resp.text();
}

const START_URL = 'http://broadcast.tvchosun.com/broadcast/program/3/C201900033/bbs/8663/C201900033_7/list.cstv';
const URL_PATTERN = 'http://broadcast.tvchosun.com/broadcast/program/3/C201900033/bbs/8663/C201900033_7/{}.cstv?search_text=';

let currPage;
let pageLinks;

const config = {
    DATASET_KEY: 'meals',

    async nextItemKey() {
        if (!pageLinks?.length) {
            if (!currPage) {
                const html = await fetchGet(START_URL);
                currPage = cheerio.load(html);
            } else {
                const href = currPage('.comm-pagination a.next').attr('href');
                if (!href)
                    return;
        
                const url = 'http://broadcast.tvchosun.com' + href;
                const html = await fetchGet(url);
                currPage = cheerio.load(html);
            }

            pageLinks = currPage('.board-list a').map((_, el) => currPage(el).attr('href')).get();
        }

        return pageLinks.pop().match(/(\d+)\.cstv/)[1];
    },

    async fetchItem(itemKey) {
        const url = URL_PATTERN.replace('{}', itemKey);
        console.log(url);

        const html = await fetchGet(url);
        if (!html)
            return;

        const $ = cheerio.load(html);
        const title = cheerio.load($('.title-box .tit').text()).text().trim();
        const date = $('.title-box .info span').eq(1).text().trim().replace(/\./g, '-');
        const body = $('.cont-box').html().replace(/\ufeff/gm, '');

        return { title, date, body };
    },

    force: program.opts().force,

    filename: program.args[0],
}

export default config;

if (!this) {
    scrape(config);
}
