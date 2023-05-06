import { Command } from 'commander';
import fs from 'fs';
import fetch from 'node-fetch';

import { findAddresses } from './functions.mjs';

const program = new Command();
program
    .argument('<code>', 'Kakao API authorization code')
    .argument('<file>', 'JSON file to process')
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


async function geocodeFile(file) {
    const text = fs.readFileSync(file, 'utf8');
    const posts = JSON.parse(text);

    const arr = Object.values(posts);
    
    try {
        for (let i = 0; i < arr.length; ++i) {
            const item = arr[i];
            if (!program.opts().force && item.locations) continue;

            const locations = [];
            const addresses = findAddresses(item.body);
            
            console.log(`Processing ${i + 1}/${arr.length}: ${item.title}`)
            console.log(addresses);

            for (const address of addresses) {
                const loc = await geocode(address);
                if (loc) {
                    locations.push({
                        address,
                        lat: loc.y,
                        lng: loc.x,
                    });
                }
            }

            item.locations = locations;
        };
    } catch (e) {
        console.error(e);
    }

    fs.writeFileSync(file, JSON.stringify(posts, null, 2));
}

if (program.args.length)
    geocodeFile(program.args[1]);

