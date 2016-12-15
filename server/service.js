const express = require('express');
const bodyParser = require('body-parser');
const service = express();
const request = require('superagent');
const token = '';
const urlNeo = 'https://api.nasa.gov/neo/rest/v1/feed';

service.use(bodyParser.json());
service.use(bodyParser.urlencoded({ extended: false }));

service.post('/service/neo', getNeo);

function getNeo(req, res){
    process(req.body).
    then((stuff) => {
        res.json(stuff);
    }, (error) => {
        res.json(error);
    });
}


const onNeoData = (resolve, reject) => (err, res) => {
    if(err){
        return reject(err);
    }
    
    const {element_count, near_earth_objects : neos} = res.body;
    
    let results = {};
    results.count = element_count;
    results.days = [];
    
    for(let day in neos){
        let d = {};
        
        d.close_approach_date = new Date(day);
        d.asteroids = [];
        
        for(let o of neos[day]){
            let a = {};
            a.name = o.name;
            a.hazardous = o.is_potentially_hazardous_asteroid;
            a.magnitude_h = o.absolute_magnitude_h;
            a.diameter_min = o.estimated_diameter.kilometers.estimated_diameter_min;
            a.diameter_max = o.estimated_diameter.kilometers.estimated_diameter_max;
            a.kilometers_per_hour = o.close_approach_data[0].relative_velocity.kilometers_per_hour;
            a.miss_distance = o.close_approach_data[0].miss_distance.kilometers;
            a.orbiting_body = o.close_approach_data[0].orbiting_body;
            d.asteroids.push(a);
        }
        results.days.push(d);
    }

    return resolve(results);
};


function process(entities){
    let start_date = new Date();
    let end_date = start_date;

    if(entities.datetime && entities.datetime[0]){
        let datetime = entities.datetime[0];
        if(datetime.type == 'value'){
            start_date = new Date(datetime.value);
            
            switch(datetime.grain){
                case 'year':
                    end_date = new Date(start_date.getFullYear()+1, start_date.getMonth(), start_date.getDate());
                    break;
                case 'quarter':
                    end_date = new Date(start_date.getFullYear(), start_date.getMonth()+3, start_date.getDate());
                    break;
                case 'month':
                    end_date = new Date(start_date.getFullYear(), start_date.getMonth()+1, start_date.getDate());
                    break;
                case 'week':
                    end_date = new Date(start_date.getFullYear(), start_date.getMonth(), start_date.getDate()+7);
                    break;
                default:
                    end_date = start_date;
                    break;
            }
        }
        else if(datetime.type == 'interval'){
            start_date = new Date(datetime.from.value);
            end_date = new Date(datetime.to.value);
        }

        let spanDays = (end_date - start_date) / 1000 / 60 / 60 / 24;
        if(spanDays > 7){
            // span exceeds api limit of 7 days
            end_date = new Date(start_date.getFullYear(), start_date.getMonth(), start_date.getDate()+7);
        }
    }

    return new Promise((resolve, reject)=>{
        request.
            get(urlNeo).
            query({
                start_date: start_date.toISOString().substring(0, 10),
                end_date: end_date.toISOString().substring(0, 10),
                api_key: token
            }).
            end(onNeoData(resolve, reject));
    });
}


module.exports = service;