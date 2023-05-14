import { Command } from 'commander';
import fs from 'fs';
import fetch from 'node-fetch';

import { findAddresses } from './functions.mjs';

const program = new Command();
program
    .argument('<code>', 'Kakao API authorization code')
    .argument('<file>', 'JSON file to process')
    .argument('<output>', 'Output file to write')
    .option('-f, --force', 'Overwrite existing locations')
    .description('Search for Korean addresses in a data file and geocode them')
    .parse()
    ;


const GEO_API = 'https://dapi.kakao.com/v2/local/search/address.json?query='
const AUTHORIZATION = program.args[0];

async function geocode(address) {
    const options = {
        url: GEO_API + encodeURIComponent(address),
        headers: {
            // 'User-Agent': USER_AGENT,
            Authorization: 'KakaoAK ' + AUTHORIZATION,
        }
    };

    const resp = await fetch(options.url, { headers: options.headers });
    const obj = await resp.json();

    if (obj?.documents?.length) {
        return obj.documents[0];
    } else {
        console.log('No results for ' + address);
    }
}


async function geocodeFile(file, output) {
    let text = fs.readFileSync(file, 'utf8');
    const posts = JSON.parse(text);
    const arr = Object.values(posts);
    let locations = {};

    if (fs.existsSync(output)) {
        text = fs.readFileSync(output, 'utf8');
        locations = JSON.parse(text);
    }
    
    try {
        for (let i = 0; i < arr.length; ++i) {
            const item = arr[i];
            const addresses = findAddresses(item.body);
            
            console.log(`Processing ${i + 1}/${arr.length}: ${item.title}`)
            console.log(addresses);

            for (const address of addresses) {
                if (locations[address])
                    continue;

                const loc = await geocode(address);
                if (loc) {
                    locations[address] = {
                        lat: loc.y,
                        lng: loc.x,
                    };
                }
            }
        };
    } catch (e) {
        console.error(e);
    }

    fs.writeFileSync(output, JSON.stringify(locations));
}

if (program.args.length)
    geocodeFile(program.args[1], program.args[2]);

