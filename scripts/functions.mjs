const ADDRESS_PATTERN = /(?<!(지번[ :]+))(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|충청|전북|전남|전라|경북|경남|경상|제주)[가-힣\d.\s]+[동길로리가]\s*[가-힣]*\d[가-힣\d-]*/g;
// console.log('Adress pattern: ' + ADDRESS_PATTERN);

/**
 * Find Korean addresses in the text.
 * Ignores a line that starts with '지번:'.
 * @param {string} text 
 * @returns {string[]}
 */
function findAddresses(text) {
    const matches = text.matchAll(ADDRESS_PATTERN);
    const addresses = [];
    for (const match of matches) {
        addresses.push(match[0].trim());
    }

    return addresses;
}

export { findAddresses };

