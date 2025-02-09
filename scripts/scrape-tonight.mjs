/**
 * This script scrapes the message board of the SBS TV show 'Live Today'
 */

import * as cheerio from 'cheerio';
import { Command } from 'commander';
import fetch from 'node-fetch';

import { scrape } from './scrape.mjs';

const program = new Command();

program.usage('[options] [filename]')
    .description('Scrapes the message board of TV show "오늘N"')
    .option('-f --force', 'Force scraping all items')
    .parse()
    ;

const koTextDecoder = new TextDecoder('utf-8');
async function fetchGet(url) {
    let resp;
    try {
        resp = await fetch(url);
    } catch (e) {
        console.log(`Retrying ${url}...`);
        resp = await fetch(url);
    }
    const buf = await resp.arrayBuffer();
    return koTextDecoder.decode(buf);
}

const LIST_URL = 'https://imbbs.imbc.com/v2/list.aspx?bid=evening_info&page=';
const READ_URL = 'https://imbbs.imbc.com/v2/view.aspx?bid=evening_info&list_id={0}&page={1}';

let $saved;
let itemKey;
let page = 0;

const config = {
    DATASET_KEY: 'tonight',

    async nextItemKey() {
        let tr;
        if (itemKey && $saved) {
            tr = $saved(`.board_table tbody tr a[onclick*="${itemKey}"]`).parents('tr').next();
        }

        if (!tr || !tr.length) {
            const html = await fetchGet(LIST_URL + ++page);
            $saved = cheerio.load(html);
            tr = $saved(`.board_table tbody tr`).first();
        }

        itemKey = tr.length ? tr.find('a').attr('onclick').match(/"(\d+)"/)[1] : null;

        return itemKey;
    },

    async fetchItem(itemKey) {
        const url = READ_URL.replace('{0}', itemKey).replace('{1}', page);
        console.log(url);

        const html = await fetchGet(url);
        const $ = $saved = cheerio.load(html);

        const title = $('.board_table.type_view').eq(0).find('td.title p span').text().trim();
        const date = $('.board_table.type_view').eq(0).find('.id_info .info_date span').text().replace(/\./g, '-');
        const body = $('#divContents td').html();

        return { title, date, body };
    },

    force: program.opts().force,

    filename: program.args[0],
}

scrape(config);
