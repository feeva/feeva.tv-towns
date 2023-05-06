#!/usr/bin/env node

/**
 * This script scrapes the message board of the SBS TV show '생활의 달인' and saves the data to 'src/assets/posts.json'.
 */

import * as cheerio from 'cheerio';
import { Command } from 'commander';
import fetch from 'node-fetch';

import { scrape } from './scrape.mjs';

const program = new Command();

program.usage('[options]')
    .description('Scrapes the message board of TV show "생활의 달인"')
    .parse(process.argv)
    ;

async function fetchGet(url) {
    const resp = await fetch(url);
    return await resp.json();
}

const START_URL = 'http://api.board.sbs.co.kr/bbs/V2.0/basic/board/lists?limit=1&action_type=json&board_code=lifemaster_bd01&offset=0';
const URL_PATTERN = 'http://api.board.sbs.co.kr/bbs/V2.0/basic/board/detail/{}?action_type=json&board_code=lifemaster_bd01';

let savedItem;

const config = {
    DATASET_KEY: 'masters',

    async nextItemKey() {
        if (savedItem) {
            return savedItem.PREV_NO && savedItem.PREV_NO !== 0 ? savedItem.PREV_NO : null;
        } else {
            const result = await fetchGet(START_URL);
            if (!result?.list?.[0])
                return;

            return result.list[0].NO;
        }
    },

    async fetchItem(itemKey) {
        const no = itemKey;
        const url = URL_PATTERN.replace('{}', no);
        console.log(url);

        const result = (await fetchGet(url))?.Response_Data_For_Detail;
        if (!result)
            return;

        savedItem = result;
        const title = result.TITLE;
        const date = result.REG_DATE;
        const content = result.CONTENT;

        const $ = cheerio.load(content);
        let body = '';
        $('p:not(:has(div, p)), div:not(:has(p, div))').each(function(_idx, elem) {
            body += $(elem).text() + '\n';
        });
        body = body.replace(/ /g, ' '); // replace non-breaking space with normal space

        return { title, date, body };
    }
}

scrape(config);
