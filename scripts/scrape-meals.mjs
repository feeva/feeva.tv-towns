#!/usr/bin/env node

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

let $saved;

const config = {
    DATASET_KEY: 'meals',

    async nextItemKey() {
        if (!$saved) {
            const html = await fetchGet(START_URL);
            const $ = cheerio.load(html);
            return $('.bbs_list tbody a').eq(0).attr('href').match(/(\d+)\.cstv/)[1];
        }

        const a = $saved('.list_adjoin .prev a');
        if (!a.attr('href'))
            return;

        return a.attr('href').match(/(\d+)\.cstv/)[1];
    },

    async fetchItem(itemKey) {
        const url = URL_PATTERN.replace('{}', itemKey);
        console.log(url);

        const html = await fetchGet(url);
        if (!html)
            return;

        const $ = cheerio.load(html);
        $saved = $;

        const title = $('#viewTitle').contents().eq(0).text().trim();
        const date = $('.bbs_detail .w_info .date').text().replace(/\./g, '-');
        const body = $('#content').html();

        return { title, date, body };
    },

    force: program.opts().force,

    filename: program.args[0],
}

scrape(config);
