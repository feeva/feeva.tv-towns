import { describe, expect, it } from 'vitest';
import config from '../scrape-meals.mjs';

describe('scrape-meals', () => {
  it('should get the next item', async () => {
    const itemKey = await config.nextItemKey();
    expect(itemKey).to.have.length.greaterThan(0);

    const result = await config.fetchItem(itemKey);
    
    expect(result).to.have.keys('title', 'date', 'body');
    expect(result.title).to.have.length.greaterThan(0);
    expect(result.date).to.match(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.body).to.have.length.greaterThan(10);
  });
});
