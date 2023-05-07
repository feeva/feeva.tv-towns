#!/usr/bin/env node

/**
 * This script scrapes the message board of the SBS TV show '생활의 달인' and saves the data to 'src/assets/posts.json'.
 */

import { Command } from 'commander';
import { compile } from 'html-to-text';
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
const htmlToText = compile();

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

        let body = htmlToText(content)
                .trim().replace(/ /g, ' ') // replace non-breaking space with normal space
                .replace(/\n{3,}/g, '\n\n') // replace multiple newlines with two newlines

        return { title, date, body };
    }
}

scrape(config);
