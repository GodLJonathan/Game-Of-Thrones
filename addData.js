const mongoose = require('mongoose');
const { chromium } = require('playwright');
const express = require('express');
const app = express();
const axios = require('axios');
const Movie = require('./Models/Movie');
const chalk = require('chalk');

require('dotenv').config();

app.use(express.json())

async function connectToMongo() {
    
    try {

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected to MongoDB");
        
        const baseUrl = "https://api.themoviedb.org/3"
        const API_KEY = process.env.MOVIE_API_KEY;

        const parameters = [
            [`/trending/all/week?api_key=${API_KEY}&language=en-US`,'Trending'],
            [`/discover/tv?api_key=${API_KEY}&with_networks=213`,'Netflix Originals'],
            [`/movie/top_rated?api_key=${API_KEY}&language=en-US`,'Top Rated'],
            [`/discover/movie?api_key=${API_KEY}&with_genres=28`,'Action Movies'],
            [`/discover/movie?api_key=${API_KEY}&with_genres=35`,'Comedy Movies'],
            [`/discover/movie?api_key=${API_KEY}&with_genres=27`,'Horror Movies'],
            [`/discover/movie?api_key=${API_KEY}&with_genres=10749`,'Romance Movies'],
            [`/discover/movie?api_key=${API_KEY}&with_genres=99`,'Documentaries'],
            [`/discover/movie?api_key=${API_KEY}&with_genres=16`,'Animation Movies'],
            [`/discover/movie?api_key=${API_KEY}&with_genres=80`,'Crime Movies'],
            [`/discover/movie?api_key=${API_KEY}&with_genres=9648`,'Mystery Movies'],
            [`/discover/movie?api_key=${API_KEY}&with_genres=12` ,'Adventure Movies'],
            [`/discover/movie?api_key=${API_KEY}&with_genres=10752`,'War Movies'],
        ];

        for(const element of parameters) {
            await fetchData(baseUrl+element[0],element[1]);
        }

        console.log(chalk.blue('All Tasks Completed ! Stopping the server...'));

        setTimeout(() => {
            process.exit()
        },5000);

    }

    catch (error) {
        throw error
    }

}

connectToMongo();

async function findTrailer(title) {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('https://www.youtube.com/results?search_query=' + title + " trailer");
    await page.click('#contents > .style-scope.ytd-item-section-renderer > #dismissible > .text-wrapper.style-scope.ytd-video-renderer > #meta > #title-wrapper > .title-and-badge.style-scope.ytd-video-renderer > #video-title')
    const url = page.url()
    await browser.close();
    return url;
}

async function fetchData(url,category) {
    try {
        const response = await axios.get(url);

        let genreArray = [{"id":28,"name":"Action"},
            {"id":12,"name":"Adventure"},
            {"id":16,"name":"Animation"},
            {"id":35,"name":"Comedy"},
            {"id":80,"name":"Crime"},
            {"id":99,"name":"Documentary"},
            {"id":18,"name":"Drama"},
            {"id":10751,"name":"Family"},
            {"id":14,"name":"Fantasy"},
            {"id":36,"name":"History"},
            {"id":27,"name":"Horror"},
            {"id":10402,"name":"Music"},
            {"id":9648,"name":"Mystery"},
            {"id":10749,"name":"Romance"},
            {"id":878,"name":"Science Fiction"},
            {"id":10770,"name":"TV Movie"},
            {"id":53,"name":"Thriller"},
            {"id":10752,"name":"War"},
            {"id":37,"name":"Western"},
            {"id":10765,"name":"Fantasy"},];

        for(const movie of response.data.results) {

            let date ;
            let genre;

            console.log(movie)
            if(movie.overview === undefined || movie.overview.length === 0) continue;

            if(movie.release_date) date = new Date(movie.release_date).getFullYear();
            else date = new Date(movie.first_air_date).getFullYear();

            let title = movie.original_title ? movie.original_title : movie.original_name;

            let oldMovie = await Movie.findOne({title:title});

            if(oldMovie) {
                console.log(chalk.yellow(title + " updated ! "));

                let flag = false;

                for(const cat of oldMovie.category) {
                    if(cat === category) {
                        flag = true;
                        break;
                    }
                }

                if(flag === true) continue;

                oldMovie.category.push(category);
                await oldMovie.save()
                continue
            }

            for(const genreId of movie.genre_ids) {
                let flag = false
                for(const genreOne of genreArray) {
                    if(genreId === genreOne.id) {
                        genre = genreOne.name;
                        flag = true
                        break;
                    }
                }
                if(flag === true) break;
            }

            if(genre === undefined) continue;
            
            const trailerUrl = await findTrailer(title);
            
            let shortTitle = "";
            
            for(let ctr = 0 ; ctr < title.length ; ctr++) {
                if(title[ctr] === '(' || title[ctr] === ':') break;
                shortTitle += title[ctr];
            }

            const newMovie = new Movie({
                title:title,
                description:movie.overview,
                posterImage:`https://image.tmdb.org/t/p/original/${movie.poster_path}`,
                bannerImage:`https://image.tmdb.org/t/p/original/${movie.backdrop_path}`,
                year : date,
                limit : movie.adult ? 18:16,
                genre:genre,
                category: [category],
                trailer:trailerUrl,
                shortTitle:shortTitle
            });

            await newMovie.save();
            console.log(chalk.green(title + ' created !'))

        }

        return response
    }

    catch (error) {
        throw error
    }
}

app.listen(3000)
