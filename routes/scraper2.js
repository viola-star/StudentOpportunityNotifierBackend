const request = require('request');
const cheerio = require('cheerio');

const details = (error,response,html) =>{
    if(!error && response.statusCode == 200){
        //console.log(html);
        const $ = cheerio.load(html);

        //get internship details 
        $('.internship_meta').each((i,ele)=>{


            //get title , link to apply , location , start date , apply date , stipend
            const title = $(ele).find('.heading_4_5 a').text();
            const link = "https://internshala.com"+ $(ele).find('a').attr('href');
            const location = $(ele).find('#location_names').text();
            const start_date = $(ele).find('.start_immediately_desktop').text();
            const apply_by = $(ele).find( ".apply_by .item_body").text();
            const stipend = "₹" + $(ele).find( ".stipend").text();
            console.log(title , link , location , start_date ,apply_by, stipend);

            //put in array format
            let internship = {
                'title' : title,
                'link' : link,
                'location' : location,
                'start_date' : start_date,
                'apply_by' : apply_by,
                'stipend' : stipend
            }
        })
    }
}
request('https://internshala.com/internships', details);