const { chromium } = require('playwright');
const mongoose = require('mongoose');
const Movie = require('./Models/Movie')

require('dotenv').config();

async function findTrailer(title) {
    const browser = await chromium.launch({headless: false});
    const page = await browser.newPage();
    await page.goto('https://www.youtube.com/results?search_query=' + title + " trailer");
    await page.click('#contents > .style-scope.ytd-item-section-renderer > #dismissible > .text-wrapper.style-scope.ytd-video-renderer > #meta > #title-wrapper > .title-and-badge.style-scope.ytd-video-renderer > #video-title')
    const url = page.url()
    await browser.close();
    return url;
}

async function findAll() {
    try {
        const movies = await Movie.find({});
        
        for(const movie of movies) {
            const trailerUrl = await findTrailer(movie.title);
            movie.trailer = trailerUrl;
            await movie.save();
        }

        console.log("All movies are done, stopping the code execution");
        process.exit();

    }
    catch(err) {
        console.error(err);
    }
}

async function connectToMongoDB() {
    try {
        console.log("Trying to connect to MongoDB");
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected to MongoDB");
        findAll();
    }
    catch(err) {
        console.error(err);
    }
}

connectToMongoDB();