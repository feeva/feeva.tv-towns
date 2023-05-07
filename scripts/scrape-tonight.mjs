#!/usr/bin/env node

/**
 * This script scrapes the message board of the SBS TV show 'Live Today'
 */

import * as cheerio from 'cheerio';
import { Command } from 'commander';
import { compile } from 'html-to-text';
import fetch from 'node-fetch';

import { scrape } from './scrape.mjs';

const program = new Command();

program.usage('[options]')
    .description('Scrapes the message board of TV show "생방송 투데이"')
    .parse()
    ;

const koTextDecoder = new TextDecoder('euc-kr');
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
const htmlToText = compile();

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
        const content = $('#divContents td').html();

        let body = htmlToText(content)
                .trim().replace(/ /g, ' ') // replace non-breaking space with normal space
                .replace(/( *\n){2}(\S)/g, '\n$2')
                .replace(/( *\n){2,}/g, '\n\n') // replace multiple newlines with two newlines

        return { title, date, body };
    }
}

scrape(config);
