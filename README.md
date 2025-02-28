# TV Towns

TV Towns is my weekend project that showcases local places in Korea that have become famous 
because they were featured on TV shows. From the small town of Jeonju to the bustling city of Seoul,
TV Towns will take you on a journey through some of yummy or spectacular places from Korean television shows.

Open [the page](https://feeva.github.io/pages/tv-towns/) to see it in action.


## Scraping Data

The data is scraped from four different TV shows and can be scraped using JavaScript programs in `scripts` folder.

- SBS 생방송 투데이 - `scrape-today.mjs`
- SBS 생활의 달인 - `scrape-masters.mjs`
- TV Chosun 백반 기행 - `scrape-meals.mjs`
- MBC 오늘N - `scrape-tonight.mjs`

Run the scripts using Node.js to get the data in JSON format. This will create `posts.json` file in the `src/data` folder.

```bash
node scripts/scrape-today.mjs
node scripts/scrape-masters.mjs
node scripts/scrape-meals.mjs
node scripts/scrape-tonight.mjs
node scripts/scrape-real.mjs
```

Now build locations data for the scraped data. You need to provide Kakao API key to geocode the addresses.

```bash
node scripts/geocode.mjs [Kakao API key] src/data/posts.json src/data/locations.json
```

## Start the Development Server

```bash
npm run dev
```

Now you can visit `http://localhost:5173` to see the app in action.
