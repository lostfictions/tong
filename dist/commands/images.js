"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chatter_1 = require("chatter");
const got = require("got");
const cheerio = require("cheerio");
const recents_1 = require("../actions/recents");
const util_1 = require("../util");
const trace_1 = require("../components/trace");
// based on https://github.com/jimkang/g-i-s/blob/master/index.js
const requestAndParse = (term, animated, exact) => got('http://images.google.com/search', {
    query: {
        q: term,
        tbm: 'isch',
        nfpr: exact ? 1 : 0,
        tbs: animated ? 'itp:animated' : undefined
    },
    timeout: 5000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.86 Safari/537.36'
    }
}).then(res => {
    const $ = cheerio.load(res.body);
    const metaLinks = $('.rg_meta');
    const urls = [];
    metaLinks.each((i, el) => {
        if (el.children.length > 0 && 'data' in el.children[0]) {
            const metadata = JSON.parse(el.children[0].data);
            if (metadata.ou) {
                urls.push(metadata.ou);
            }
            // Elements without metadata.ou are subcategory headings in the results page.
        }
    });
    return urls;
});
const search = (term, store, animated = false) => requestAndParse(term, animated, true)
    .then(res => {
    if (res.length === 0) {
        // if no results, try an inexact search
        return requestAndParse(term, animated, false);
    }
    return res;
})
    .then(res => {
    const state = store.getState();
    const excluding = state.get('recents');
    const unseenResults = [];
    while (res.length > 0 && unseenResults.length < 5) {
        const i = res.shift();
        if (!excluding.has(i)) {
            unseenResults.push(i);
        }
    }
    if (unseenResults.length === 0) {
        return 'nothing :(';
    }
    const result = util_1.randomInArray(unseenResults);
    store.dispatch(recents_1.addRecentAction(result));
    return result;
});
exports.imageSearchCommand = chatter_1.createCommand({
    name: 'image',
    aliases: [`what's`, `who's`, `what is`, `who is`, `show me`],
    description: 'i will show you'
}, (message, { store }) => {
    if (message.length === 0) {
        return false;
    }
    const maybeTraced = trace_1.tryTrace(message, store.getState().get('concepts'));
    if (maybeTraced) {
        return search(maybeTraced, store)
            .then(res => `(${maybeTraced})\n${res}`);
    }
    return search(message, store);
});
exports.gifSearchCommand = chatter_1.createCommand({
    name: 'gifsearch',
    aliases: ['gif me the', 'gif me a', 'gif me', 'gif'],
    description: 'moving pictures'
}, (message, { store }) => {
    if (message.length === 0) {
        return false;
    }
    const maybeTraced = trace_1.tryTrace(message, store.getState().get('concepts'));
    if (maybeTraced) {
        return search(maybeTraced, store, true).then(res => `(${maybeTraced})\n${res}`);
    }
    return search(message, store, true);
});
